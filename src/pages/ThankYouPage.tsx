import { useSurvey } from '../hooks/useSurvey';
import { demographicQuestions, stressQuestions } from '../data/questions';

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

const FREQUENCY_LABELS: Record<number, string> = {
  0: 'Never',
  1: 'Almost never',
  2: 'Sometimes',
  3: 'Fairly often',
  4: 'Very often',
};

const AGREEMENT_LABELS: Record<number, string> = {
  1: 'Strongly disagree',
  2: 'Disagree',
  3: 'Neutral',
  4: 'Agree',
  5: 'Strongly agree',
};

export default function ThankYouPage() {
  const { state } = useSurvey();
  const elapsed = Date.now() - state.startTime;

  function formatStressValue(questionId: string): string {
    const val = state.stressResponses[questionId];
    if (val === undefined) return '\u2014';
    const q = stressQuestions.find((sq) => sq.id === questionId);
    if (q?.type === 'agreement') return AGREEMENT_LABELS[val] ?? String(val);
    return FREQUENCY_LABELS[val] ?? String(val);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-5xl mb-4">&#10003;</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
        <p className="text-gray-600 mb-4 leading-relaxed">
          Your responses have been recorded. Thank you for contributing to
          Connecticut flood risk research.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          You completed {state.imagePairs.length} comparison{state.imagePairs.length !== 1 ? 's' : ''} in {formatElapsed(elapsed)}.
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
            {/* Identifier */}
            <h3 className="font-semibold text-gray-800">Identifier</h3>
            <p className="text-blue-600">
              {state.identifierResponse || '\u2014'}
            </p>

            {/* Demographics */}
            <h3 className="font-semibold text-gray-800 pt-2">Demographics</h3>
            {demographicQuestions.map((q) => (
              <div key={q.id}>
                <p className="font-medium">{q.prompt}</p>
                <p className="text-blue-600">
                  {state.demographicResponses[q.id] ?? '\u2014'}
                </p>
              </div>
            ))}

            {/* Perceived Stress */}
            <h3 className="font-semibold text-gray-800 pt-2">
              Perceived Stress
            </h3>
            {stressQuestions.map((q) => (
              <div key={q.id}>
                <p className="font-medium">{q.prompt}</p>
                <p className="text-blue-600">{formatStressValue(q.id)}</p>
              </div>
            ))}

            {/* Comparisons */}
            <h3 className="font-semibold text-gray-800 pt-2">
              Image Comparisons
            </h3>
            {state.imagePairs.map((pair, pairIdx) => (
              <div key={pair.id} className="border-t border-gray-200 pt-2">
                <p className="font-medium">
                  Pair {pairIdx + 1}: {pair.imageA.src} vs {pair.imageB.src}
                </p>
                <p className="text-blue-600">
                  {state.comparisonResponses[pair.id]
                    ? `Selected ${state.comparisonResponses[pair.id]}`
                    : '\u2014'}
                </p>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
