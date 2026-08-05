import type { SurveyState } from './types/survey';
import { comparisonPrompts } from './data/questions';

// Empty in dev: requests go to the Vite proxy (/api -> localhost:8000).
const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export interface ApiPair {
  pairId: string;
  leftImageUrl: string;
  rightImageUrl: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  expiresAt: string;
  pairs: ApiPair[];
}

export interface SubmitComparison {
  pairId: string;
  promptId: string;
  choice: 'left' | 'equal' | 'right';
}

export interface SubmitPayload {
  consentInitials: string;
  paymentOptOutInitials: string;
  identifier: string;
  surveyPhase: number;
  demographic: Record<string, string>;
  climate: Record<string, number>;
  stress: Record<string, number>;
  durationSeconds: number;
  comparisons: SubmitComparison[];
}

export async function createSession(): Promise<CreateSessionResponse> {
  const res = await fetch(`${BASE}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) throw new Error(`createSession failed: ${res.status}`);
  return res.json();
}

export async function submitSurvey(
  sessionId: string,
  payload: SubmitPayload,
): Promise<void> {
  const res = await fetch(`${BASE}/api/sessions/${sessionId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  // 409 = already submitted: a retry after a request that actually landed.
  if (res.status === 409) return;
  if (!res.ok) throw new Error(`submitSurvey failed: ${res.status}`);
}

const CHOICE_MAP = { A: 'left', E: 'equal', B: 'right' } as const;

export function buildSubmitPayload(
  state: SurveyState,
  surveyPhase: number,
): SubmitPayload {
  const comparisons: SubmitComparison[] = [];
  for (const pair of state.imagePairs) {
    for (const prompt of comparisonPrompts) {
      const value = state.comparisonResponses[`${pair.id}-${prompt.id}`];
      if (value !== undefined) {
        comparisons.push({
          pairId: pair.id,
          promptId: prompt.id,
          choice: CHOICE_MAP[value],
        });
      }
    }
  }
  return {
    consentInitials: state.consentInitials,
    paymentOptOutInitials: state.paymentOptOutInitials,
    identifier: state.identifierResponse,
    surveyPhase,
    demographic: state.demographicResponses,
    climate: state.climateResponses,
    stress: state.stressResponses,
    durationSeconds: Math.round((Date.now() - state.startTime) / 1000),
    comparisons,
  };
}
