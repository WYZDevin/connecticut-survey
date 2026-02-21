import type { FrequencyResponse } from '../types/survey';

interface FrequencyQuestionProps {
  prompt: string;
  value: FrequencyResponse | undefined;
  onChange: (value: FrequencyResponse) => void;
}

const LABELS: { value: FrequencyResponse; label: string }[] = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Almost never' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Fairly often' },
  { value: 4, label: 'Very often' },
];

export default function FrequencyQuestion({
  prompt,
  value,
  onChange,
}: FrequencyQuestionProps) {
  return (
    <div className="mb-6">
      <p className="text-lg font-medium text-gray-800 mb-4">{prompt}</p>
      <div className="flex flex-wrap gap-2">
        {LABELS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors cursor-pointer ${
              value === item.value
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
