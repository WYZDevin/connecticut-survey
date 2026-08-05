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

type SurveyAction =
  | { type: 'SET_CONSENT_INITIALS'; value: string }
  | { type: 'SET_PAYMENT_OPTOUT_INITIALS'; value: string }
  | { type: 'SET_IDENTIFIER'; value: string }
  | { type: 'SET_DEMOGRAPHIC'; questionId: string; value: string }
  | { type: 'SET_CLIMATE'; questionId: string; value: number }
  | { type: 'SET_STRESS'; questionId: string; value: number }
  | {
      type: 'SET_COMPARISON';
      questionId: string;
      value: ImageComparisonResponse;
    }
  | { type: 'SET_SESSION'; sessionId: string; pairs: ImagePair[] }
  | { type: 'COMPLETE' };

function createInitialState(): SurveyState {
  return {
    startTime: Date.now(),
    sessionId: null,
    imagePairs: [],
    consentInitials: '',
    paymentOptOutInitials: '',
    identifierResponse: '',
    demographicResponses: {},
    comparisonResponses: {},
    climateResponses: {},
    stressResponses: {},
    completed: false,
  };
}

function surveyReducer(state: SurveyState, action: SurveyAction): SurveyState {
  switch (action.type) {
    case 'SET_CONSENT_INITIALS':
      return { ...state, consentInitials: action.value };
    case 'SET_PAYMENT_OPTOUT_INITIALS':
      return { ...state, paymentOptOutInitials: action.value };
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
    case 'SET_CLIMATE':
      return {
        ...state,
        climateResponses: {
          ...state.climateResponses,
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
    case 'SET_SESSION':
      return {
        ...state,
        sessionId: action.sessionId,
        imagePairs: action.pairs,
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

  function setConsentInitials(value: string) {
    dispatch({ type: 'SET_CONSENT_INITIALS', value });
  }

  function setPaymentOptOutInitials(value: string) {
    dispatch({ type: 'SET_PAYMENT_OPTOUT_INITIALS', value });
  }

  function setIdentifierResponse(value: string) {
    dispatch({ type: 'SET_IDENTIFIER', value });
  }

  function setDemographicResponse(questionId: string, value: string) {
    dispatch({ type: 'SET_DEMOGRAPHIC', questionId, value });
  }

  function setClimateResponse(questionId: string, value: number) {
    dispatch({ type: 'SET_CLIMATE', questionId, value });
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

  function setSession(sessionId: string, pairs: ImagePair[]) {
    dispatch({ type: 'SET_SESSION', sessionId, pairs });
  }

  function completeSurvey() {
    dispatch({ type: 'COMPLETE' });
  }

  return {
    state,
    setConsentInitials,
    setPaymentOptOutInitials,
    setIdentifierResponse,
    setDemographicResponse,
    setClimateResponse,
    setStressResponse,
    setComparisonResponse,
    setSession,
    completeSurvey,
  };
}
