import type { ImageComparisonResponse } from '../types/survey';

interface ImageCardProps {
  src: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

function ImageCard({ src, label, selected, onClick }: ImageCardProps) {
  const isColor = src.startsWith('#');

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl border-3 overflow-hidden transition-all cursor-pointer ${
        selected
          ? 'border-blue-600 ring-2 ring-blue-300'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      {isColor ? (
        <div
          className="w-full aspect-video"
          style={{ backgroundColor: src }}
        />
      ) : (
        <img src={src} alt={label} className="w-full aspect-video object-cover" />
      )}
      <div className="py-3 px-4 text-center font-medium text-gray-700 bg-white">
        {label}
      </div>
    </button>
  );
}

interface ImageComparisonQuestionProps {
  prompt: string;
  imageA: { src: string; label: string };
  imageB: { src: string; label: string };
  value: ImageComparisonResponse | undefined;
  onSelect: (value: ImageComparisonResponse) => void;
}

export default function ImageComparisonQuestion({
  prompt,
  imageA,
  imageB,
  value,
  onSelect,
}: ImageComparisonQuestionProps) {
  return (
    <div>
      <p className="text-xl font-medium text-gray-800 mb-6 text-center">
        {prompt}
      </p>
      <div className="flex flex-col md:flex-row gap-6">
        <ImageCard
          src={imageA.src}
          label={imageA.label}
          selected={value === 'A'}
          onClick={() => onSelect('A')}
        />
        <ImageCard
          src={imageB.src}
          label={imageB.label}
          selected={value === 'B'}
          onClick={() => onSelect('B')}
        />
      </div>
    </div>
  );
}
