interface SingleChoiceQuestionProps {
  prompt: string;
  options: string[];
  value: string | undefined;
  onChange: (value: string) => void;
}

export default function SingleChoiceQuestion({
  prompt,
  options,
  value,
  onChange,
}: SingleChoiceQuestionProps) {
  return (
    <div className="mb-6">
      <p className="text-lg font-medium text-gray-800 mb-4">{prompt}</p>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`w-full text-left py-3 px-4 rounded-lg border-2 font-medium transition-colors cursor-pointer ${
              value === option
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
