import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSurvey } from '../hooks/useSurvey';
import { stressQuestions } from '../data/questions';
import { submitSurvey, buildSubmitPayload } from '../api';
import { SURVEY_PHASE } from '../data/config';
import FrequencyQuestion from '../components/FrequencyQuestion';
import AgreementQuestion from '../components/AgreementQuestion';
import type { FrequencyResponse, AgreementResponse } from '../types/survey';

export default function StressPage() {
  const navigate = useNavigate();
  const { state, setStressResponse, completeSurvey } = useSurvey();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = stressQuestions.every(
    (q) => state.stressResponses[q.id] !== undefined,
  );

  async function handleFinish() {
    if (submitting) return;
    if (!state.sessionId) {
      setError(
        'Your survey session was lost (for example after a page refresh). ' +
          'Please restart the survey from the beginning.',
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitSurvey(state.sessionId, buildSubmitPayload(state, SURVEY_PHASE));
      completeSurvey();
      navigate('/thank-you');
    } catch {
      setError(
        'Your responses could not be saved. Please check your internet ' +
          'connection and try again — your answers are still here.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 p-4">
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Section 3: Perceived Stress
          </h2>
          <p className="text-gray-500 mb-6">
            The following questions ask about your feelings and thoughts during
            the last month.
          </p>
          {stressQuestions.map((q) => {
            if (q.type === 'frequency') {
              return (
                <FrequencyQuestion
                  key={q.id}
                  prompt={q.prompt}
                  value={
                    state.stressResponses[q.id] as
                      | FrequencyResponse
                      | undefined
                  }
                  onChange={(val) => setStressResponse(q.id, val)}
                />
              );
            }
            return (
              <AgreementQuestion
                key={q.id}
                prompt={q.prompt}
                value={
                  state.stressResponses[q.id] as
                    | AgreementResponse
                    | undefined
                }
                onChange={(val) => setStressResponse(q.id, val)}
              />
            );
          })}
          {error && (
            <p
              role="alert"
              className="mt-6 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3"
            >
              {error}
            </p>
          )}
          <div className="mt-8 flex justify-end">
            <button
              disabled={!allAnswered || submitting}
              onClick={handleFinish}
              className={`px-8 py-3 rounded-lg text-lg font-medium transition-colors ${
                allAnswered && !submitting
                  ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Submitting…' : 'Finish Survey'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
