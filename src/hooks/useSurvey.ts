import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { createElement } from 'react';
import type {
  SurveyState,
  ImagePair,
  ImageComparisonResponse,
} from '../types/survey';
import { generateRandomPair } from '../data/questions';

type SurveyAction =
  | { type: 'SET_IDENTIFIER'; value: string }
  | { type: 'SET_DEMOGRAPHIC'; questionId: string; value: string }
  | { type: 'SET_STRESS'; questionId: string; value: number }
  | {
      type: 'SET_COMPARISON';
      questionId: string;
      value: ImageComparisonResponse;
    }
  | { type: 'ADD_PAIR'; pair: ImagePair }
  | { type: 'COMPLETE' };

function createInitialState(): SurveyState {
  return {
    startTime: Date.now(),
    imagePairs: [generateRandomPair(0)],
    identifierResponse: '',
    demographicResponses: {},
    comparisonResponses: {},
    stressResponses: {},
    completed: false,
  };
}

function surveyReducer(state: SurveyState, action: SurveyAction): SurveyState {
  switch (action.type) {
    case 'SET_IDENTIFIER':
      return { ...state, identifierResponse: action.value };
    case 'SET_DEMOGRAPHIC':
      return {
        ...state,
        demographicResponses: {
          ...state.demographicResponses,
          [action.questionId]: action.value,
        },
      };
    case 'SET_STRESS':
      return {
        ...state,
        stressResponses: {
          ...state.stressResponses,
          [action.questionId]: action.value,
        },
      };
    case 'SET_COMPARISON':
      return {
        ...state,
        comparisonResponses: {
          ...state.comparisonResponses,
          [action.questionId]: action.value,
        },
      };
    case 'ADD_PAIR':
      return {
        ...state,
        imagePairs: [...state.imagePairs, action.pair],
      };
    case 'COMPLETE':
      return { ...state, completed: true };
    default:
      return state;
  }
}

const SurveyContext = createContext<{
  state: SurveyState;
  dispatch: Dispatch<SurveyAction>;
} | null>(null);

export function SurveyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(surveyReducer, null, createInitialState);
  return createElement(
    SurveyContext.Provider,
    { value: { state, dispatch } },
    children,
  );
}

export function useSurvey() {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error('useSurvey must be used within a SurveyProvider');
  }

  const { state, dispatch } = context;

  function setIdentifierResponse(value: string) {
    dispatch({ type: 'SET_IDENTIFIER', value });
  }

  function setDemographicResponse(questionId: string, value: string) {
    dispatch({ type: 'SET_DEMOGRAPHIC', questionId, value });
  }

  function setStressResponse(questionId: string, value: number) {
    dispatch({ type: 'SET_STRESS', questionId, value });
  }

  function setComparisonResponse(
    questionId: string,
    value: ImageComparisonResponse,
  ) {
    dispatch({ type: 'SET_COMPARISON', questionId, value });
  }

  function addPair(pair: ImagePair) {
    dispatch({ type: 'ADD_PAIR', pair });
  }

  function completeSurvey() {
    dispatch({ type: 'COMPLETE' });
  }

  return {
    state,
    setIdentifierResponse,
    setDemographicResponse,
    setStressResponse,
    setComparisonResponse,
    addPair,
    completeSurvey,
  };
}
