import type {
  DemographicQuestion,
  ImageComparisonQuestion,
} from '../types/survey';

export const demographicQuestions: DemographicQuestion[] = [
  {
    id: 'experienced-disaster',
    type: 'yes-no',
    prompt:
      'Have you ever personally experienced a natural disaster (e.g., flood, hurricane, tornado)?',
  },
  {
    id: 'flood-risk-belief',
    type: 'likert',
    prompt:
      'How likely do you believe it is that your community will experience significant flooding in the next 10 years?',
    lowLabel: 'Very unlikely',
    highLabel: 'Very likely',
  },
];

export const comparisonQuestions: ImageComparisonQuestion[] = [
  {
    id: 'comparison-1',
    type: 'image-comparison',
    prompt: 'Which area looks more likely to flood?',
    imageA: { src: '/img1.jpg', label: 'Left' },
    imageB: { src: '/img2.jpg', label: 'Right' },
  },
  {
    id: 'comparison-2',
    type: 'image-comparison',
    prompt: 'Which area looks more likely to flood?',
    imageA: { src: '/img2.jpg', label: 'Left' },
    imageB: { src: '/img1.jpg', label: 'Right' },
  },
  {
    id: 'comparison-3',
    type: 'image-comparison',
    prompt: 'Which area looks more likely to flood?',
    imageA: { src: '/img1.jpg', label: 'Left' },
    imageB: { src: '/img2.jpg', label: 'Right' },
  },
  {
    id: 'comparison-4',
    type: 'image-comparison',
    prompt: 'Which area looks more likely to flood?',
    imageA: { src: '/img2.jpg', label: 'Left' },
    imageB: { src: '/img1.jpg', label: 'Right' },
  },
  {
    id: 'comparison-5',
    type: 'image-comparison',
    prompt: 'Which area looks more likely to flood?',
    imageA: { src: '/img1.jpg', label: 'Left' },
    imageB: { src: '/img2.jpg', label: 'Right' },
  },
];
