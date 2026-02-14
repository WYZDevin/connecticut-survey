import type { LikertResponse } from '../types/survey';

interface LikertQuestionProps {
  prompt: string;
  lowLabel: string;
  highLabel: string;
  value: LikertResponse | undefined;
  onChange: (value: LikertResponse) => void;
}

const POINTS: LikertResponse[] = [1, 2, 3, 4, 5];

export default function LikertQuestion({
  prompt,
  lowLabel,
  highLabel,
  value,
  onChange,
}: LikertQuestionProps) {
  return (
    <div className="mb-6">
      <p className="text-lg font-medium text-gray-800 mb-4">{prompt}</p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 w-24 text-right shrink-0">
          {lowLabel}
        </span>
        <div className="flex gap-2 flex-1 justify-center">
          {POINTS.map((point) => (
            <button
              key={point}
              type="button"
              onClick={() => onChange(point)}
              className={`w-12 h-12 rounded-full border-2 text-lg font-medium transition-colors cursor-pointer ${
                value === point
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {point}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500 w-24 shrink-0">{highLabel}</span>
      </div>
    </div>
  );
}
