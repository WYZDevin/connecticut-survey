import { useNavigate } from 'react-router-dom';
import { useSurvey } from '../hooks/useSurvey';
import { demographicQuestions } from '../data/questions';
import ProgressBar from '../components/ProgressBar';
import RadioQuestion from '../components/RadioQuestion';
import LikertQuestion from '../components/LikertQuestion';
import type { YesNoResponse, LikertResponse } from '../types/survey';

export default function DemographicPage() {
  const navigate = useNavigate();
  const { state, setDemographicResponse } = useSurvey();

  const allAnswered = demographicQuestions.every(
    (q) => state.demographicResponses[q.id] !== undefined,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto mt-8">
        <ProgressBar current={1} total={6} />
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            About You
          </h2>
          {demographicQuestions.map((q) => {
            if (q.type === 'yes-no') {
              return (
                <RadioQuestion
                  key={q.id}
                  prompt={q.prompt}
                  value={state.demographicResponses[q.id] as YesNoResponse | undefined}
                  onChange={(val) => setDemographicResponse(q.id, val)}
                />
              );
            }
            if (q.type === 'likert') {
              return (
                <LikertQuestion
                  key={q.id}
                  prompt={q.prompt}
                  lowLabel={q.lowLabel}
                  highLabel={q.highLabel}
                  value={state.demographicResponses[q.id] as LikertResponse | undefined}
                  onChange={(val) => setDemographicResponse(q.id, val)}
                />
              );
            }
            return null;
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
