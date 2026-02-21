// --- Question types ---

export interface TextInputQuestion {
  id: string;
  type: 'text-input';
  prompt: string;
  placeholder?: string;
}

export interface SingleChoiceQuestion {
  id: string;
  type: 'single-choice';
  prompt: string;
  options: string[];
}

export interface MultiChoiceQuestion {
  id: string;
  type: 'multi-choice';
  prompt: string;
  options: string[];
  hasOther?: boolean;
}

export interface LikertQuestion {
  id: string;
  type: 'likert';
  prompt: string;
  lowLabel: string;
  highLabel: string;
}

export interface AgreementQuestion {
  id: string;
  type: 'agreement';
  prompt: string;
}

export interface FrequencyQuestion {
  id: string;
  type: 'frequency';
  prompt: string;
}

export interface ImageComparisonQuestion {
  id: string;
  type: 'image-comparison';
  prompt: string;
  imageA: { src: string; label: string };
  imageB: { src: string; label: string };
}

export type SurveyQuestion =
  | TextInputQuestion
  | SingleChoiceQuestion
  | MultiChoiceQuestion
  | LikertQuestion
  | AgreementQuestion
  | FrequencyQuestion
  | ImageComparisonQuestion;

export type DemographicQuestion = SingleChoiceQuestion;

export type StressQuestion = FrequencyQuestion | AgreementQuestion;

// --- Response types ---

export type LikertResponse = 1 | 2 | 3 | 4 | 5;
export type AgreementResponse = 1 | 2 | 3 | 4 | 5;
export type FrequencyResponse = 0 | 1 | 2 | 3 | 4;
export type ImageComparisonResponse = 'A' | 'B';

export interface MultiChoiceResponseValue {
  selected: string[];
  otherText?: string;
}

// --- State ---

export interface ImagePair {
  id: string;
  imageA: { src: string; label: string };
  imageB: { src: string; label: string };
}

export interface SurveyState {
  startTime: number;
  imagePairs: ImagePair[];
  identifierResponse: string;
  demographicResponses: Record<string, string>;
  comparisonResponses: Record<string, ImageComparisonResponse>;
  stressResponses: Record<string, number>;
  completed: boolean;
}
