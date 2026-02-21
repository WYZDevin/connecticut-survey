import { useNavigate } from 'react-router-dom';
import { useSurvey } from '../hooks/useSurvey';
import { identifierQuestions } from '../data/questions';
import { SURVEY_PHASE } from '../data/config';
import TextInputQuestion from '../components/TextInputQuestion';

export default function IdentifierPage() {
  const navigate = useNavigate();
  const { state, setIdentifierResponse } = useSurvey();

  const question = identifierQuestions[SURVEY_PHASE];
  const canProceed = state.identifierResponse.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Participant Identifier
          </h2>
          <TextInputQuestion
            prompt={question.prompt}
            placeholder={question.placeholder}
            value={state.identifierResponse}
            onChange={setIdentifierResponse}
          />
          <div className="mt-8 flex justify-end">
            <button
              disabled={!canProceed}
              onClick={() => navigate('/survey/demographics')}
              className={`px-8 py-3 rounded-lg text-lg font-medium transition-colors ${
                canProceed
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
