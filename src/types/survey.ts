export interface YesNoQuestion {
  id: string;
  type: 'yes-no';
  prompt: string;
}

export interface LikertQuestion {
  id: string;
  type: 'likert';
  prompt: string;
  lowLabel: string;
  highLabel: string;
}

export interface ImageComparisonQuestion {
  id: string;
  type: 'image-comparison';
  prompt: string;
  imageA: { src: string; label: string };
  imageB: { src: string; label: string };
}

export type DemographicQuestion = YesNoQuestion | LikertQuestion;

export type YesNoResponse = 'yes' | 'no';
export type LikertResponse = 1 | 2 | 3 | 4 | 5;
export type ImageComparisonResponse = 'A' | 'B';

export interface SurveyState {
  demographicResponses: Record<string, YesNoResponse | LikertResponse>;
  comparisonResponses: Record<string, ImageComparisonResponse>;
  completed: boolean;
}
