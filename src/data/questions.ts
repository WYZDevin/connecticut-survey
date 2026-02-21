import type {
  TextInputQuestion,
  DemographicQuestion,
  ImagePair,
  FrequencyQuestion,
  AgreementQuestion,
} from '../types/survey';

// --- Section 0: Identifier ---

export const identifierQuestions: Record<1 | 2, TextInputQuestion> = {
  1: {
    id: 'Q0-A',
    type: 'text-input',
    prompt: 'Please enter your email address.',
    placeholder: 'you@example.com',
  },
  2: {
    id: 'Q0-B',
    type: 'text-input',
    prompt: 'Please enter your Prolific ID.',
    placeholder: 'e.g. 5f3a2b1c...',
  },
};

// --- Section 1: Demographics (Q1-Q3) ---

export const demographicQuestions: DemographicQuestion[] = [
  {
    id: 'Q1',
    type: 'single-choice',
    prompt: 'What is your age group?',
    options: [
      '18–24',
      '25–34',
      '35–44',
      '45–54',
      '55–64',
      '65 or older',
    ],
  },
  {
    id: 'Q2',
    type: 'single-choice',
    prompt: 'What is your gender?',
    options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
  },
  {
    id: 'Q3',
    type: 'single-choice',
    prompt: 'What is the highest level of education you have completed?',
    options: [
      'Less than high school',
      'High school diploma or GED',
      'Some college / Associate degree',
      "Bachelor's degree",
      'Graduate or professional degree',
    ],
  },
];

// --- Image pairs (randomized at runtime, generated one at a time) ---

export const IMAGE_POOL_SIZE = 1000;

function randomInt(max: number): number {
  return Math.floor(Math.random() * max) + 1;
}

/** Generate a single random image pair with two distinct images. */
export function generateRandomPair(index: number): ImagePair {
  const idA = randomInt(IMAGE_POOL_SIZE);
  let idB = randomInt(IMAGE_POOL_SIZE);
  while (idB === idA) {
    idB = randomInt(IMAGE_POOL_SIZE);
  }
  return {
    id: `comparison-${index + 1}`,
    imageA: { src: `/svi/${idA}.jpg`, label: 'Image A' },
    imageB: { src: `/svi/${idB}.jpg`, label: 'Image B' },
  };
}

// --- Perceived Stress (Q10-Q14, asked once before comparisons) ---

export const stressQuestions: (FrequencyQuestion | AgreementQuestion)[] = [
  {
    id: 'Q10',
    type: 'frequency',
    prompt:
      'How often have you felt unable to control the important things in your life?',
  },
  {
    id: 'Q11',
    type: 'frequency',
    prompt:
      'How often have you felt confident about your ability to handle your personal problems?',
  },
  {
    id: 'Q12',
    type: 'frequency',
    prompt:
      'How often have you felt that things were going your way?',
  },
  {
    id: 'Q13',
    type: 'frequency',
    prompt:
      'How often have you felt difficulties were piling up so high that you could not overcome them?',
  },
  {
    id: 'Q14',
    type: 'agreement',
    prompt:
      'To confirm you are reading carefully, please select "Agree."',
  },
];
