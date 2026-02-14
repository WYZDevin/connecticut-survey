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
  YesNoResponse,
  LikertResponse,
  ImageComparisonResponse,
} from '../types/survey';

type SurveyAction =
  | {
      type: 'SET_DEMOGRAPHIC';
      questionId: string;
      value: YesNoResponse | LikertResponse;
    }
  | {
      type: 'SET_COMPARISON';
      questionId: string;
      value: ImageComparisonResponse;
    }
  | { type: 'COMPLETE' };

const initialState: SurveyState = {
  demographicResponses: {},
  comparisonResponses: {},
  completed: false,
};

function surveyReducer(state: SurveyState, action: SurveyAction): SurveyState {
  switch (action.type) {
    case 'SET_DEMOGRAPHIC':
      return {
        ...state,
        demographicResponses: {
          ...state.demographicResponses,
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
  const [state, dispatch] = useReducer(surveyReducer, initialState);
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

  function setDemographicResponse(
    questionId: string,
    value: YesNoResponse | LikertResponse,
  ) {
    dispatch({ type: 'SET_DEMOGRAPHIC', questionId, value });
  }

  function setComparisonResponse(
    questionId: string,
    value: ImageComparisonResponse,
  ) {
    dispatch({ type: 'SET_COMPARISON', questionId, value });
  }

  function completeSurvey() {
    dispatch({ type: 'COMPLETE' });
  }

  return {
    state,
    setDemographicResponse,
    setComparisonResponse,
    completeSurvey,
  };
}
