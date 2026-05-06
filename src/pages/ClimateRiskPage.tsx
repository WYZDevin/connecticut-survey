import { useNavigate } from 'react-router-dom';
import { useSurvey } from '../hooks/useSurvey';
import { climateRiskQuestions } from '../data/questions';
import FrequencyQuestion from '../components/FrequencyQuestion';
import LikertQuestion from '../components/LikertQuestion';
import type { FrequencyResponse, LikertResponse } from '../types/survey';

export default function ClimateRiskPage() {
  const navigate = useNavigate();
  const { state, setClimateResponse } = useSurvey();

  const allAnswered = climateRiskQuestions.every(
    (q) => state.climateResponses[q.id] !== undefined,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Section 2: Environmental Risks
          </h2>
          <p className="text-gray-500 mb-6">
            The following questions ask about your views and experience with
            environmental risks, including floods, heatwaves, and wildfires.
          </p>
          {climateRiskQuestions.map((q) => {
            if (q.type === 'frequency') {
              return (
                <FrequencyQuestion
                  key={q.id}
                  prompt={q.prompt}
                  value={
                    state.climateResponses[q.id] as
                      | FrequencyResponse
                      | undefined
                  }
                  onChange={(val) => setClimateResponse(q.id, val)}
                />
              );
            }
            return (
              <LikertQuestion
                key={q.id}
                prompt={q.prompt}
                lowLabel={q.lowLabel}
                highLabel={q.highLabel}
                value={
                  state.climateResponses[q.id] as LikertResponse | undefined
                }
                onChange={(val) => setClimateResponse(q.id, val)}
              />
            );
          })}
          <div className="mt-8 flex justify-end">
            <button
              disabled={!allAnswered}
              onClick={() => navigate('/survey/stress')}
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
