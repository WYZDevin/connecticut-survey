import { useNavigate } from 'react-router-dom';
import { useSurvey } from '../hooks/useSurvey';
import { stressQuestions } from '../data/questions';
import FrequencyQuestion from '../components/FrequencyQuestion';
import AgreementQuestion from '../components/AgreementQuestion';
import type { FrequencyResponse, AgreementResponse } from '../types/survey';

export default function StressPage() {
  const navigate = useNavigate();
  const { state, setStressResponse } = useSurvey();

  const allAnswered = stressQuestions.every(
    (q) => state.stressResponses[q.id] !== undefined,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Section 2: Perceived Stress
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
          <div className="mt-8 flex justify-end">
            <button
              disabled={!allAnswered}
              onClick={() => navigate('/survey/comparison/0')}
              className={`px-8 py-3 rounded-lg text-lg font-medium transition-colors ${
                allAnswered
                  ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
