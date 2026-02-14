import { useSurvey } from '../hooks/useSurvey';
import { demographicQuestions, comparisonQuestions } from '../data/questions';

export default function ThankYouPage() {
  const { state } = useSurvey();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-5xl mb-4">&#10003;</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Your responses have been recorded. Thank you for contributing to
          Connecticut flood risk research.
        </p>

        <div className="bg-blue-50 rounded-lg p-5 mb-6 text-left">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Contact Information
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            If you have any questions about this study, please contact:
          </p>
          <p className="text-sm text-gray-700">
            Email:{' '}
            <a
              href="mailto:zhang.chen@uconn.edu"
              className="text-blue-600 hover:underline"
            >
              zhang.chen@uconn.edu
            </a>
          </p>
        </div>

        <details className="text-left bg-gray-50 rounded-lg p-4">
          <summary className="cursor-pointer font-medium text-gray-700">
            View your responses
          </summary>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <h3 className="font-semibold text-gray-800">Demographic</h3>
            {demographicQuestions.map((q) => (
              <div key={q.id}>
                <p className="font-medium">{q.prompt}</p>
                <p className="text-blue-600">
                  {String(state.demographicResponses[q.id] ?? '—')}
                </p>
              </div>
            ))}
            <h3 className="font-semibold text-gray-800 pt-2">
              Image Comparisons
            </h3>
            {comparisonQuestions.map((q) => (
              <div key={q.id}>
                <p className="font-medium">{q.id}</p>
                <p className="text-blue-600">
                  {state.comparisonResponses[q.id]
                    ? `Selected ${state.comparisonResponses[q.id]}`
                    : '—'}
                </p>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
