interface TextInputQuestionProps {
  prompt: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export default function TextInputQuestion({
  prompt,
  placeholder,
  value,
  onChange,
}: TextInputQuestionProps) {
  return (
    <div className="mb-6">
      <p className="text-lg font-medium text-gray-800 mb-4">{prompt}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:border-blue-600 transition-colors"
      />
    </div>
  );
}
