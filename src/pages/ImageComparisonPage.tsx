import { useParams, useNavigate } from 'react-router-dom';
import { useSurvey } from '../hooks/useSurvey';
import { generateRandomPair } from '../data/questions';
import ImageComparisonQuestion from '../components/ImageComparisonQuestion';
import type { ImageComparisonResponse } from '../types/survey';

export default function ImageComparisonPage() {
  const { index } = useParams<{ index: string }>();
  const navigate = useNavigate();
  const { state, setComparisonResponse, addPair, completeSurvey } = useSurvey();

  const idx = Number(index);
  const pair = state.imagePairs[idx];

  if (!pair) {
    navigate('/thank-you', { replace: true });
    return null;
  }

  function handleSelect(value: ImageComparisonResponse) {
    setComparisonResponse(pair.id, value);
    const nextIdx = idx + 1;
    if (!state.imagePairs[nextIdx]) {
      addPair(generateRandomPair(nextIdx));
    }
    navigate(`/survey/comparison/${nextIdx}`);
  }

  function handleFinish() {
    completeSurvey();
    navigate('/thank-you');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto mt-8">
        <div className="mb-6 text-sm text-gray-500">
          Comparison #{idx + 1}
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Street View Comparison #{idx + 1}
          </h2>

          <ImageComparisonQuestion
            prompt="Which area looks more likely to flood?"
            imageA={pair.imageA}
            imageB={pair.imageB}
            value={state.comparisonResponses[pair.id]}
            onSelect={handleSelect}
          />

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleFinish}
              className="px-6 py-3 rounded-lg text-lg font-medium transition-colors bg-gray-600 text-white hover:bg-gray-700 cursor-pointer"
            >
              Finish Survey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
