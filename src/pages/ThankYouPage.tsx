import { useEffect } from 'react';
import { useSurvey } from '../hooks/useSurvey';
import {
  demographicQuestions,
  climateRiskQuestions,
  stressQuestions,
  comparisonPrompts,
} from '../data/questions';
import { PROLIFIC_COMPLETION_URL } from '../data/config';

const REDIRECT_DELAY_MS = 5000;

const COMPARISON_LABELS = {
  A: 'Left',
  E: 'Equal',
  B: 'Right',
} as const;

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

  // Only a completed survey (successful submit) returns to Prolific;
  // a stray visit to /thank-you does not.
  useEffect(() => {
    if (!state.completed) return;
    const timer = setTimeout(() => {
      window.location.replace(PROLIFIC_COMPLETION_URL);
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state.completed]);

  function formatStressValue(questionId: string): string {
    const val = state.stressResponses[questionId];
    if (val === undefined) return '\u2014';
    const q = stressQuestions.find((sq) => sq.id === questionId);
    if (q?.type === 'agreement') return AGREEMENT_LABELS[val] ?? String(val);
    return FREQUENCY_LABELS[val] ?? String(val);
  }

  function formatClimateValue(questionId: string): string {
    const val = state.climateResponses[questionId];
    if (val === undefined) return '\u2014';
    const q = climateRiskQuestions.find((cq) => cq.id === questionId);
    if (q?.type === 'frequency') return FREQUENCY_LABELS[val] ?? String(val);
    if (q?.type === 'likert') return `${val} / 5 (${q.lowLabel} \u2192 ${q.highLabel})`;
    return String(val);
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-5xl mb-4">&#10003;</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Your responses have been recorded. Thank you for contributing to
          our research.
        </p>

        {state.completed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-6">
            <p className="text-gray-700 mb-3">
              You will be returned to Prolific in a few seconds to register
              your completion.
            </p>
            <a
              href={PROLIFIC_COMPLETION_URL}
              className="inline-block px-6 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
            >
              Return to Prolific now
            </a>
            <p className="text-xs text-gray-500 mt-3">
              If you are not redirected, use the button above. Completion
              code: C16Y04R2
            </p>
          </div>
        )}

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
              href="mailto:hanlin.zhou@uconn.edu"
              className="text-blue-600 hover:underline"
            >
              hanlin.zhou@uconn.edu
            </a>
          </p>
        </div>

        <details className="text-left bg-gray-50 rounded-lg p-4">
          <summary className="cursor-pointer font-medium text-gray-700">
            View your responses
          </summary>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            {/* Consent */}
            <h3 className="font-semibold text-gray-800">Consent</h3>
            <p className="text-blue-600">
              Agreed
              {state.paymentOptOutInitials
                ? ` (declined payment: ${state.paymentOptOutInitials})`
                : ''}
            </p>

            {/* Identifier */}
            <h3 className="font-semibold text-gray-800 pt-2">Identifier</h3>
            <p className="text-blue-600">
              {state.identifierResponse || '\u2014'}
            </p>

            {/* Comparisons */}
            <h3 className="font-semibold text-gray-800 pt-2">
              Image Comparisons
            </h3>
            {state.imagePairs.map((pair, pairIdx) => (
              <div key={pair.id} className="border-t border-gray-200 pt-2">
                <p className="font-semibold text-gray-700">
                  Pair {pairIdx + 1}: {pair.imageA.src} vs {pair.imageB.src}
                </p>
                {comparisonPrompts.map((cp) => {
                  const key = `${pair.id}-${cp.id}`;
                  const val = state.comparisonResponses[key];
                  return (
                    <div key={key} className="ml-4">
                      <p className="font-medium">{cp.prompt}</p>
                      <p className="text-blue-600">
                        {val ? COMPARISON_LABELS[val] : '\u2014'}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}

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

            {/* Environmental Risks */}
            <h3 className="font-semibold text-gray-800 pt-2">
              Environmental Risks
            </h3>
            {climateRiskQuestions.map((q) => (
              <div key={q.id}>
                <p className="font-medium">{q.prompt}</p>
                <p className="text-blue-600">{formatClimateValue(q.id)}</p>
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
          </div>
        </details>
      </div>
    </div>
  );
}
