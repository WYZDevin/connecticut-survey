import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useSurvey } from '../hooks/useSurvey';
import { comparisonPrompts } from '../data/questions';
import type { ImageComparisonResponse } from '../types/survey';

export default function ImageComparisonPage() {
  const { index } = useParams<{ index: string }>();
  const navigate = useNavigate();
  const { state, setComparisonResponse } = useSurvey();

  const maxComparisons = state.imagePairs.length;
  const idx = Number(index);
  const pair = state.imagePairs[idx];

  // No session (page refresh or direct deep link): restart from consent.
  if (maxComparisons === 0) {
    return <Navigate to="/" replace />;
  }
  if (!Number.isInteger(idx) || idx < 0 || idx >= maxComparisons || !pair) {
    return <Navigate to="/survey/demographics" replace />;
  }

  function responseKey(promptId: string) {
    return `${pair.id}-${promptId}`;
  }

  const allAnswered = comparisonPrompts.every(
    (p) => state.comparisonResponses[responseKey(p.id)] !== undefined,
  );

  const isLast = idx === maxComparisons - 1;

  function handleNext() {
    if (isLast) {
      navigate('/survey/demographics');
      return;
    }
    navigate(`/survey/comparison/${idx + 1}`);
  }

  return (
    <div className="flex-1 p-3">
      <div className="max-w-3xl mx-auto mt-4">
        <div className="mb-3 text-sm text-gray-500">
          Comparison {idx + 1} of {maxComparisons}
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Street View Comparison #{idx + 1}
          </h2>

          {/* Images displayed once at the top */}
          <div className="flex flex-col md:flex-row gap-4 mb-5">
            <div className="flex-1 rounded-xl border-2 border-gray-300 overflow-hidden">
              <img
                src={pair.imageA.src}
                alt="Left"
                className="w-full aspect-video object-cover"
              />
              <div className="py-2 px-3 text-center font-medium text-gray-700 bg-white text-sm">
                Left
              </div>
            </div>
            <div className="flex-1 rounded-xl border-2 border-gray-300 overflow-hidden">
              <img
                src={pair.imageB.src}
                alt="Right"
                className="w-full aspect-video object-cover"
              />
              <div className="py-2 px-3 text-center font-medium text-gray-700 bg-white text-sm">
                Right
              </div>
            </div>
          </div>

          {/* 6 comparison questions */}
          {comparisonPrompts.map((p, i) => {
            const key = responseKey(p.id);
            const value = state.comparisonResponses[key];

            return (
              <div key={p.id} className="mb-3">
                <p className="text-sm font-medium text-gray-800 mb-1.5">
                  {i + 1}. {p.prompt}
                </p>
                <div className="flex gap-2">
                  {(['A', 'E', 'B'] as ImageComparisonResponse[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setComparisonResponse(key, opt)}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors cursor-pointer ${
                        value === opt
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {opt === 'A' ? 'Left' : opt === 'B' ? 'Right' : 'Equal'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="mt-5 flex justify-end">
            <button
              disabled={!allAnswered}
              onClick={handleNext}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                allAnswered
                  ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLast ? 'Continue to Questionnaire' : 'Next Comparison'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
