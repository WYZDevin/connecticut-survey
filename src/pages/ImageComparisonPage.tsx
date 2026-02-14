import { useParams, useNavigate } from 'react-router-dom';
import { useSurvey } from '../hooks/useSurvey';
import { comparisonQuestions } from '../data/questions';
import ProgressBar from '../components/ProgressBar';
import ImageComparisonQuestion from '../components/ImageComparisonQuestion';
import type { ImageComparisonResponse } from '../types/survey';

export default function ImageComparisonPage() {
  const { index } = useParams<{ index: string }>();
  const navigate = useNavigate();
  const { state, setComparisonResponse, completeSurvey } = useSurvey();

  const idx = Number(index);
  const question = comparisonQuestions[idx];

  if (!question) {
    navigate('/thank-you', { replace: true });
    return null;
  }

  const handleSelect = (value: ImageComparisonResponse) => {
    setComparisonResponse(question.id, value);

    if (idx < comparisonQuestions.length - 1) {
      navigate(`/survey/comparison/${idx + 1}`);
    } else {
      completeSurvey();
      navigate('/thank-you');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto mt-8">
        <ProgressBar current={idx + 2} total={6} />
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Image Comparison {idx + 1} of {comparisonQuestions.length}
          </h2>
          <ImageComparisonQuestion
            prompt={question.prompt}
            imageA={question.imageA}
            imageB={question.imageB}
            value={state.comparisonResponses[question.id]}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>
  );
}
