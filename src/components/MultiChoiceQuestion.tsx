import type { MultiChoiceResponseValue } from '../types/survey';

interface MultiChoiceQuestionProps {
  prompt: string;
  options: string[];
  hasOther?: boolean;
  value: MultiChoiceResponseValue | undefined;
  onChange: (value: MultiChoiceResponseValue) => void;
}

export default function MultiChoiceQuestion({
  prompt,
  options,
  hasOther,
  value,
  onChange,
}: MultiChoiceQuestionProps) {
  const selected = value?.selected ?? [];
  const otherText = value?.otherText ?? '';
  const otherChecked = selected.includes('__other__');

  function toggle(option: string) {
    const next = selected.includes(option)
      ? selected.filter((s) => s !== option)
      : [...selected, option];
    onChange({ selected: next, otherText });
  }

  function setOtherText(text: string) {
    onChange({ selected, otherText: text });
  }

  return (
    <div className="mb-6">
      <p className="text-lg font-medium text-gray-800 mb-4">{prompt}</p>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`w-full text-left py-3 px-4 rounded-lg border-2 font-medium transition-colors cursor-pointer flex items-center gap-3 ${
              selected.includes(option)
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                selected.includes(option)
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-gray-400'
              }`}
            >
              {selected.includes(option) && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </span>
            {option}
          </button>
        ))}
        {hasOther && (
          <div>
            <button
              type="button"
              onClick={() => toggle('__other__')}
              className={`w-full text-left py-3 px-4 rounded-lg border-2 font-medium transition-colors cursor-pointer flex items-center gap-3 ${
                otherChecked
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                  otherChecked
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-gray-400'
                }`}
              >
                {otherChecked && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </span>
              Other (please specify)
            </button>
            {otherChecked && (
              <input
                type="text"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="Please specify..."
                className="mt-2 w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:border-blue-600 transition-colors"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
