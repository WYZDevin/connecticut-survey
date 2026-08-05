# Question Key — internal note

Maps the `Q*` column codes in database/CSV exports to the actual survey
questions and their answer encodings. Source of truth: `src/data/questions.ts`.

## Identifier

| Column | Content |
|---|---|
| `identifier` | Phase 1: participant email. Phase 2 (current): **Prolific ID**. Stored on the submission row and on every comparison row. |

## Demographics (stored as the chosen option's text)

| Code | Question | Options |
|---|---|---|
| Q1 | What is your age group? | 18–24 / 25–34 / 35–44 / 45–54 / 55–64 / 65 or older |
| Q2 | What is your gender? | Male / Female / Non-binary / Prefer not to say |
| Q3 | What is the highest level of education you have completed? | Less than high school / High school diploma or GED / Some college – Associate degree / Bachelor's degree / Graduate or professional degree |

## Environmental Risks

| Code | Question | Encoding |
|---|---|---|
| Q4 | How likely do you think environmental risks will become more frequent or severe in the years ahead? | Likert 1–5 (1 = Not at all likely … 5 = Very likely) |
| Q5 | How willing are you to change your habits to better prepare for environmental risks? | Likert 1–5 (1 = Not at all willing … 5 = Very willing) |
| Q6 | How often have you been directly affected by environmental risks? | Frequency 0–4 (see scale below) |

## Perceived Stress (past month)

| Code | Question | Encoding |
|---|---|---|
| Q10 | How often have you felt unable to control the important things in your life? | Frequency 0–4 |
| Q11 | How often have you felt confident about your ability to handle your personal problems? | Frequency 0–4 (positively worded — reverse-score for a PSS total) |
| Q12 | How often have you felt that things were going your way? | Frequency 0–4 (positively worded — reverse-score for a PSS total) |
| Q13 | How often have you felt difficulties were piling up so high that you could not overcome them? | Frequency 0–4 |
| Q14 | **Attention check**: "To confirm you are reading carefully, please select 'Agree.'" | Agreement 1–5; **correct answer = 4 (Agree)** — exclude participants with any other value at analysis time |

## Scales

- **Frequency (0–4)**: 0 = Never, 1 = Almost never, 2 = Sometimes, 3 = Fairly often, 4 = Very often
- **Agreement (1–5)**: 1 = Strongly disagree, 2 = Disagree, 3 = Neutral, 4 = Agree, 5 = Strongly agree
- **Likert (1–5)**: endpoints labeled per question (see Q4/Q5 above)

## Image comparisons (`comparisons.csv` / `comparison_responses`)

Each participant judges 20 image pairs on 6 prompts (120 rows). `choice` is
relative to the displayed sides: `left` = `left_image`, `right` = `right_image`,
`equal` = no difference. Display order matches the pairing CSV (never flipped).

| `prompt_id` | Question shown |
|---|---|
| flood | Which area looks more likely to be flooded? |
| heatwave | Which area looks more likely to be exposed to heatwaves? |
| wildfire | Which area looks more likely to have a wildfire occurred? |
| crime | Which place appears to be safer from crime (i.e., less possibility of crime events)? |
| transport | Which place appears to be safer for active transport (e.g., walking or cycling for travel) with fewer barriers and hazards? |
| noise | Which place appears to be less noisy? |

Note: image filenames are `<census-tract-GEOID>_<photo##>.jpg|png`; there are
no Q7–Q9 — the numbering in `questions.ts` simply skips them.
