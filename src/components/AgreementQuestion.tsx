import type { AgreementResponse } from '../types/survey';

interface AgreementQuestionProps {
  prompt: string;
  value: AgreementResponse | undefined;
  onChange: (value: AgreementResponse) => void;
}

const LABELS: { value: AgreementResponse; label: string }[] = [
  { value: 1, label: 'Strongly disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly agree' },
];

export default function AgreementQuestion({
  prompt,
  value,
  onChange,
}: AgreementQuestionProps) {
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
