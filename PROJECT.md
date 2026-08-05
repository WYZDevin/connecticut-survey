# Connecticut Street-View Survey — Backend Implementation Guide

This document is the working guide for building the survey backend. It records the
agreed architecture decisions and specifies the data model, API, frontend changes,
and deployment steps in enough detail that an AI (or human) contributor can execute
them without re-deriving context.

## 1. Project overview

A research survey (UConn, PI contact: hanlin.zhou@uconn.edu) in which participants
compare pairs of street-view images and answer short questionnaires. Current flow
(all client-side, React SPA):

```
/            ConsentPage      — consent form, initials, agree to participate
/welcome     WelcomePage
/survey/identifier            — email (phase 1) or Prolific ID (phase 2), see src/data/config.ts
/survey/comparison/:index     — image-pair comparisons (currently 20 random pairs; becomes 20 assigned pairs)
/survey/demographics          — Q1–Q3 single-choice
/survey/climate               — Q4–Q6 environmental-risk questions
/survey/stress                — Q10–Q14 perceived stress (Q14 is an attention check)
/thank-you                    — summary/confirmation
```

Frontend stack: Vite + React 19 + TypeScript + Tailwind 4 + react-router 7.
State lives in a `useReducer` context (`src/hooks/useSurvey.ts`); nothing is
persisted today. `src/data/questions.ts` currently generates random pairs from
`public/svi/` — this is the placeholder behavior the backend replaces.

## 2. Goal

Replace random client-side pairs with **server-assigned pairs from a curated
pairing list**, and **persist all survey responses** in a database.

- Pair list: `svi/survey_source/streetview_pairings_pioneer_50.csv`
  — columns `pair_id,left_id,right_id`; **1,000 pairs**, IDs like
  `pioneer_pair_000001`.
- Images: `svi/survey_source/NewEngland_StreetView_AllRounds_LargestArea_6200/`
  — ~6,200 files, 3.5 GB. The current CSV references **200 unique images
  (116.7 MB)**, but the pool will grow to ~6,000 images with future pairing
  rounds, so the design must not assume the small subset.
- **Important**: CSV IDs have no file extension. The folder mixes `.jpg` and
  `.png` (of the 200 currently referenced: 182 jpg, 18 png). Extension
  resolution happens once at ingest time; the DB stores full filenames.
- Each participant receives **20 pairs** when they agree to the consent form.
- All responses (consent initials, identifier, comparisons, demographics,
  climate, stress, timing) are saved to the backend database.

## 3. Agreed decisions

| Decision | Choice |
|---|---|
| Backend language/framework | **Python + FastAPI** |
| Database | **Azure Database for PostgreSQL Flexible Server** (burstable tier is fine) |
| Backend hosting | **Azure** (App Service for Linux recommended) |
| Frontend hosting | **Vercel** (separate origin → CORS required) |
| Image hosting | **Azure Blob Storage**, public-read container (see §7) |
| Pair assignment | **Sequential blocks**: block *k* = CSV rows `20k … 20k+19` (50 blocks/cycle) |
| Abandonment handling | **Assignment + expiry**: a claimed block is reserved; if no submission arrives within the TTL (default 60 min, configurable), the reservation expires and the block becomes claimable again |
| Save timing | **Single submit at the end** — one POST containing the entire survey; no incremental saves |
| Left/right display | **Keep CSV order** — `left_id` always renders on the left; no per-participant flipping |

Rationale for Blob Storage over bundling: 6,000 images ≈ 3.5 GB far exceeds
Vercel deploy limits; blob URLs decouple image/pairing updates from frontend
deploys; Azure egress at survey traffic is negligible. (If bandwidth ever
matters, put Azure Front Door/CDN in front of the container — not needed now.)

## 4. Repository layout

Monorepo: frontend stays at the repo root (deployed by Vercel); backend is a
new self-contained directory (deployed to Azure).

```
/                       # existing Vite app (Vercel root)
backend/
  app/
    main.py             # FastAPI app, CORS, routers
    config.py           # pydantic-settings: env vars
    db.py               # SQLAlchemy engine/session
    models.py           # ORM models (§5)
    schemas.py          # pydantic request/response models
    routers/
      sessions.py       # POST /api/sessions, POST /api/sessions/{id}/submit
      health.py         # GET /api/health
    assignment.py       # block-claim logic (§6)
  alembic/              # migrations
  scripts/
    ingest_pairs.py     # CSV + image folder -> pairs table + blob upload (§7)
    export_responses.py # DB -> CSVs for analysis (§10)
  tests/
  requirements.txt      # fastapi, uvicorn, sqlalchemy, alembic, psycopg[binary],
                        # pydantic-settings, azure-storage-blob (scripts only)
  Dockerfile            # optional; App Service can also run from source
```

## 5. Database schema (PostgreSQL)

```sql
-- One row per CSV pair. Populated by ingest script; immutable afterwards.
CREATE TABLE pairs (
  pair_id     text PRIMARY KEY,        -- e.g. 'pioneer_pair_000001'
  csv_index   integer NOT NULL UNIQUE, -- 0-based row order in the CSV
  block_index integer NOT NULL,        -- csv_index / 20
  left_image  text NOT NULL,           -- full filename incl. extension, e.g. '44005040102_02.jpg'
  right_image text NOT NULL,
  source_csv  text NOT NULL            -- 'streetview_pairings_pioneer_50.csv' (future rounds append)
);
CREATE INDEX ON pairs (block_index);

-- One row per block; the claimable unit. Populated by ingest (block 0..49).
CREATE TABLE blocks (
  block_index     integer PRIMARY KEY,
  submitted_count integer NOT NULL DEFAULT 0   -- completed submissions across all cycles
);

-- One row per participant session, created when they agree on the consent page.
CREATE TABLE sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_index  integer NOT NULL REFERENCES blocks,
  status       text NOT NULL DEFAULT 'assigned',  -- assigned | submitted | expired
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,              -- created_at + TTL
  submitted_at timestamptz
);
CREATE INDEX ON sessions (status, expires_at);

-- One row per completed survey (single-submit payload, minus comparisons).
CREATE TABLE submissions (
  session_id            uuid PRIMARY KEY REFERENCES sessions,
  consent_initials      text NOT NULL,
  payment_optout_initials text NOT NULL DEFAULT '',
  identifier            text NOT NULL,       -- email or Prolific ID
  survey_phase          integer NOT NULL,    -- SURVEY_PHASE at submit time
  demographic           jsonb NOT NULL,      -- {"Q1": "...", ...}
  climate               jsonb NOT NULL,      -- {"Q4": 3, ...}
  stress                jsonb NOT NULL,      -- {"Q10": 2, ...}
  duration_seconds      integer NOT NULL,
  user_agent            text,
  submitted_at          timestamptz NOT NULL DEFAULT now()
);

-- One row per (pair × prompt) judgment. 20 pairs × 6 prompts = 120 rows/submission.
CREATE TABLE comparison_responses (
  session_id uuid NOT NULL REFERENCES sessions,
  pair_id    text NOT NULL REFERENCES pairs,
  prompt_id  text NOT NULL,   -- flood | heatwave | wildfire | crime | transport | noise
  choice     text NOT NULL,   -- 'left' | 'equal' | 'right'  (maps A/E/B; left == left_id, CSV order preserved)
  PRIMARY KEY (session_id, pair_id, prompt_id)
);
```

Notes:
- Do **not** store IP addresses (IRB/PII posture; identifier is already collected
  deliberately).
- `blocks.submitted_count` is the cycle-coverage signal; sessions in status
  `assigned` with `expires_at > now()` count as active reservations.

## 6. Block assignment with expiry

Triggered by `POST /api/sessions` (fired when the participant agrees on the
consent page). All inside one transaction:

1. Lazy-expire stale reservations:
   `UPDATE sessions SET status='expired' WHERE status='assigned' AND expires_at < now();`
   (No background job needed.)
2. Claim the best block — fewest submissions first, then fewest active
   reservations, then lowest index; lock to prevent double-claims under
   concurrency:

   ```sql
   SELECT b.block_index
   FROM blocks b
   LEFT JOIN LATERAL (
     SELECT count(*) AS active
     FROM sessions s
     WHERE s.block_index = b.block_index AND s.status = 'assigned'
   ) a ON true
   ORDER BY b.submitted_count + a.active, b.block_index
   LIMIT 1
   FOR UPDATE OF b SKIP LOCKED;
   ```
3. Insert the session row (`expires_at = now() + TTL`).
4. Return session id + the block's 20 pairs (ordered by `csv_index`) with full
   image URLs.

On submit, set `status='submitted'`, increment `blocks.submitted_count`. A
submit that arrives *after* expiry is still accepted and stored (data is data);
it just may mean the block was also served to someone else — fine.

Properties: every block gets served once per cycle before any block is served
twice; abandoned blocks return to the pool after TTL; concurrent participants
never receive the same block while a reservation is live.

## 7. Images → Azure Blob Storage

- Container: `svi`, blob name = exact filename (`44005040102_02.jpg`). Access
  level: **blob** (public read, no listing).
- `scripts/ingest_pairs.py` (idempotent, safe to re-run):
  1. Read the CSV; resolve each ID to its actual filename by scanning the
     source image folder (error loudly on missing or ambiguous IDs).
  2. Upsert `pairs` and `blocks` rows.
  3. Upload each referenced image to the container (skip if blob exists —
     compare size/MD5). Only referenced images are uploaded, so today that's
     200 files; future rounds upload their own increments.
- The API returns absolute image URLs
  (`https://<account>.blob.core.windows.net/svi/<filename>`), built from the
  `IMAGE_BASE_URL` env var — the frontend never constructs image paths itself,
  which keeps a later CDN/domain switch backend-only.
- `public/svi/` and `public/svi_neus/` in the frontend become dead weight once
  this lands — remove them from the deploy (keep out of Vercel).

## 8. API

Base path `/api`. JSON everywhere. CORS: allow the Vercel production domain,
`https://*.vercel.app` previews (regex), and `http://localhost:5173`.

### `POST /api/sessions`
Called when the participant agrees to the consent form. No body (or `{}`).

Response `201`:
```json
{
  "sessionId": "1c0e…uuid",
  "expiresAt": "2026-08-04T18:00:00Z",
  "pairs": [
    {
      "pairId": "pioneer_pair_000011",
      "leftImageUrl": "https://…/svi/44005040102_02.jpg",
      "rightImageUrl": "https://…/svi/25017383902_02.jpg"
    }
    // exactly 20, in csv_index order
  ]
}
```

### `POST /api/sessions/{sessionId}/submit`
Body (mirrors `SurveyState`, keyed by real IDs):
```json
{
  "consentInitials": "HZ",
  "paymentOptOutInitials": "",
  "identifier": "user@example.com",
  "surveyPhase": 1,
  "demographic": {"Q1": "25–34", "Q2": "Female", "Q3": "Bachelor's degree"},
  "climate": {"Q4": 4, "Q5": 3, "Q6": 1},
  "stress": {"Q10": 2, "Q11": 3, "Q12": 2, "Q13": 1, "Q14": 4},
  "durationSeconds": 812,
  "comparisons": [
    {"pairId": "pioneer_pair_000011", "promptId": "flood", "choice": "left"}
    // 120 entries: 20 pairs × 6 prompts
  ]
}
```
Validation: session exists and is not already `submitted` (409 on double
submit); every `pairId` belongs to the session's block; all 120 (pair, prompt)
cells present; `choice ∈ {left, equal, right}`; `promptId` in the known set.
Accept even if the session is `expired` (see §6). Response `201 {"ok": true}`.

### `GET /api/health`
DB connectivity check for App Service health probes.

### Export (choose one, keep it simple)
`GET /api/export?key=<ADMIN_EXPORT_KEY>` streaming CSVs, **or** skip the
endpoint and rely on `scripts/export_responses.py` run locally against the DB.
The script is required either way (§10); the endpoint is optional.

## 9. Frontend changes

1. **API client** (`src/api.ts`): `createSession()` and `submitSurvey()` using
   `fetch`; base URL from `import.meta.env.VITE_API_BASE_URL` (empty in dev —
   use a Vite dev proxy for `/api` → `http://localhost:8000`).
2. **Types/state** (`src/types/survey.ts`, `src/hooks/useSurvey.ts`):
   - `ImagePair` gains `pairId`; `src` fields come from the API.
   - `SurveyState` gains `sessionId: string | null` and holds the 20 assigned
     pairs; remove `generateRandomPair` usage and `ADD_PAIR` incremental logic
     (`SET_SESSION` action sets sessionId + all pairs at once).
3. **ConsentPage**: on Agree, call `createSession()`; store sessionId + pairs;
   navigate on success; on failure show a retry error state (do not let the
   participant proceed without a session).
4. **ImageComparisonPage**: `MAX_COMPARISONS` 20 → 10 (derive from
   `state.imagePairs.length` instead of a constant); pairs come from state, no
   generation. Response keys stay `${pairId}-${promptId}`.
5. **StressPage** (end of questionnaire): on Continue, build the submit payload
   from state, `submitSurvey()`, then navigate to `/thank-you`. On failure:
   error banner + retry button; keep state intact. Only navigate after 201.
6. **ThankYouPage**: unchanged conceptually (confirmation + response review).
7. **`src/data/questions.ts`**: delete `generateRandomPair` and
   `IMAGE_POOL_SIZE` once nothing references them.
8. Env: `.env.production` on Vercel sets `VITE_API_BASE_URL=https://<app>.azurewebsites.net`.

## 10. Export & analysis

`scripts/export_responses.py` connects via `DATABASE_URL` and writes:
- `submissions.csv` — one row per participant (questionnaire answers flattened).
- `comparisons.csv` — one row per judgment: `session_id, pair_id, prompt_id,
  choice, left_image, right_image, submitted_at` (join `pairs`).
Only `status='submitted'` sessions are exported.

## 11. Configuration (backend env vars)

| Var | Meaning |
|---|---|
| `DATABASE_URL` | `postgresql+psycopg://…` (Azure requires `sslmode=require`) |
| `IMAGE_BASE_URL` | e.g. `https://<account>.blob.core.windows.net/svi` |
| `SESSION_TTL_MINUTES` | reservation TTL, default `60` |
| `CORS_ORIGINS` | comma-separated; Vercel prod domain + localhost |
| `ADMIN_EXPORT_KEY` | only if the export endpoint is built |
| `AZURE_STORAGE_CONNECTION_STRING` | ingest script only, not the API |

## 12. Deployment (live resources, deployed 2026-08-05)

All Azure resources live in resource group **`ct-survey-rg`** (subscription
"Azure subscription 1"). Compute/DB are in **centralus** (eastus/eastus2 were
capacity-restricted for Flexible Server on this subscription); storage is in
eastus2.

| Piece | Resource | Notes |
|---|---|---|
| PostgreSQL | `ct-survey-pg-hz2026.postgres.database.azure.com` (Flexible Server, B1ms, PG16) | DB `survey`; admin `surveyadmin` (password in `backend/.env.azure`, gitignored); firewall: dev IP + Azure services |
| API | `https://ct-survey-api-hz2026.azurewebsites.net` (App Service Linux B1, Python 3.12) | startup `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`; zip deploy with Oryx build |
| Images | `https://ctsurveysvihz2026.blob.core.windows.net/svi/` (public-read blob) | 200 images uploaded via `ingest_pairs.py` |
| Frontend | `https://connecticut-survey.vercel.app` (Vercel project `connecticut-survey`) | `VITE_API_BASE_URL` set in Vercel prod env |

Redeploy commands:
- API: `cd backend && zip -r deploy.zip app alembic alembic.ini requirements.txt scripts -x '*__pycache__*' && az webapp deploy -g ct-survey-rg -n ct-survey-api-hz2026 --type zip --src-path deploy.zip`
- Schema: `cd backend && DATABASE_URL=<azure url from .env.azure> .venv/bin/alembic upgrade head`
- New pairing rounds: `ingest_pairs.py` with `AZURE_STORAGE_CONNECTION_STRING` and Azure `DATABASE_URL` set (uploads only new images, never resets counts)
- Frontend: `vercel --prod --yes` from repo root
- Export: `DATABASE_URL=<azure url> python scripts/export_responses.py`

## 13. Implementation milestones

Each milestone should end in a working, testable state.

1. **Backend scaffold**: FastAPI app, config, SQLAlchemy, Alembic initial
   migration for §5 schema, `/api/health`; local Postgres via
   `docker compose up db`.
2. **Ingest**: `ingest_pairs.py` against local Postgres with a `--no-upload`
   flag (skips blob upload, images served from local path in dev). Verify:
   1,000 pairs, 100 blocks, extension resolution correct (182 jpg / 18 png).
3. **Assignment**: `POST /api/sessions` with claim + expiry logic. Tests:
   sequential claims get blocks 0,1,2…; expiry frees a block; concurrent
   claims never share a block; cycle 2 starts only after all 100 blocks have
   a submission.
4. **Submit**: `POST /api/sessions/{id}/submit` with full validation + tests
   (double submit, wrong pairIds, missing cells, late-after-expiry accepted).
5. **Frontend integration** (§9), pointing at the local backend via Vite proxy;
   full manual run-through.
6. **Blob + Azure**: upload images, provision Azure resources, deploy API,
   deploy frontend to Vercel, CORS verified, end-to-end test on real URLs.
7. **Export script** + a smoke test that a completed session round-trips into
   the CSVs correctly.

## 14. Known constraints & open questions

- `desktop.ini` exists in the image folder — ingest must ignore non-image files.
- Attention check (Q14) is stored, not enforced server-side; filtering happens
  at analysis time.
- Open: should the Thank-You page show a Prolific completion code in phase 2?
  (Backend could return one on successful submit.)
- Open: any target number of submissions per block/cycle at which the survey
  should auto-close? (Currently it cycles indefinitely.)
- Open: image files average ~0.6 MB; if participant bandwidth becomes a
  complaint, add a one-time resize/compress step to the ingest script.
