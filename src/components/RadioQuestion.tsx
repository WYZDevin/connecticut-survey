import type { YesNoResponse } from '../types/survey';

interface RadioQuestionProps {
  prompt: string;
  value: YesNoResponse | undefined;
  onChange: (value: YesNoResponse) => void;
}

export default function RadioQuestion({
  prompt,
  value,
  onChange,
}: RadioQuestionProps) {
  const options: { label: string; val: YesNoResponse }[] = [
    { label: 'Yes', val: 'yes' },
    { label: 'No', val: 'no' },
  ];

  return (
    <div className="mb-6">
      <p className="text-lg font-medium text-gray-800 mb-4">{prompt}</p>
      <div className="flex gap-4">
        {options.map((opt) => (
          <button
            key={opt.val}
            type="button"
            onClick={() => onChange(opt.val)}
            className={`flex-1 py-3 px-6 rounded-lg border-2 text-lg font-medium transition-colors cursor-pointer ${
              value === opt.val
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
