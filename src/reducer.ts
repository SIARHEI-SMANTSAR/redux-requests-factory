import {
  PreparedConfig,
  CommonActionTypes,
  RequestsState,
  RequestsStatuses,
  RequestActionMeta,
  RequestState,
  RequestsReducer,
  GlobalActionTypes,
  Actions,
} from './types';
import {
  RESPONSES_STATE_KEY,
  IS_SOMETHING_LOADING_STATE_KEY,
} from './constants';

const initialState: RequestsState = {
  [IS_SOMETHING_LOADING_STATE_KEY]: {
    count: 0,
  },
  [RESPONSES_STATE_KEY]: {},
};

const getNewRequestsState = (
  state: RequestsState,
  { key, serializedKey }: RequestActionMeta,
  data: RequestState
): RequestsState =>
  serializedKey !== undefined
    ? {
        ...state,
        [RESPONSES_STATE_KEY]: {
          ...state[RESPONSES_STATE_KEY],
          [key]: {
            ...state[RESPONSES_STATE_KEY][key],
            [serializedKey]: {
              ...(state[RESPONSES_STATE_KEY][key]
                ? (state[RESPONSES_STATE_KEY][key] as any)[serializedKey]
                : {}),
              ...data,
            },
          },
        },
      }
    : {
        ...state,
        [RESPONSES_STATE_KEY]: {
          ...state[RESPONSES_STATE_KEY],
          [key]: {
            ...state[RESPONSES_STATE_KEY][key],
            ...data,
          },
        },
      };

const isRequestState = (
  value: RequestState | { [serializedKey: string]: RequestState } | undefined
): value is RequestState =>
  typeof value === 'object' &&
  value !== null &&
  'status' in value &&
  typeof value.status === 'string';

const mergeHydratedResponses = (
  current: RequestsState[typeof RESPONSES_STATE_KEY],
  hydrated: RequestsState[typeof RESPONSES_STATE_KEY]
): RequestsState[typeof RESPONSES_STATE_KEY] =>
  Object.keys(hydrated).reduce<RequestsState[typeof RESPONSES_STATE_KEY]>(
    (responses, key) => {
      const currentRequest = responses[key];
      const hydratedRequest = hydrated[key];

      responses[key] =
        isRequestState(hydratedRequest) || isRequestState(currentRequest)
          ? hydratedRequest
          : {
              ...currentRequest,
              ...hydratedRequest,
            };

      return responses;
    },
    { ...current }
  );

export const createRequestsReducer =
  <Key>(config: PreparedConfig<Key>): RequestsReducer =>
  (state = initialState, action) => {
    const factoryAction = action as Actions;

    switch (factoryAction.type) {
      case CommonActionTypes.RequestStart:
        return getNewRequestsState(state, factoryAction.meta, {
          status: RequestsStatuses.Loading,
        });
      case CommonActionTypes.RequestSuccess:
        return getNewRequestsState(state, factoryAction.meta, {
          status: RequestsStatuses.Success,
          response: factoryAction.payload.response,
          error: undefined,
        });
      case CommonActionTypes.RequestError:
        return getNewRequestsState(state, factoryAction.meta, {
          status: RequestsStatuses.Failed,
          error: factoryAction.payload.error,
        });
      case CommonActionTypes.RequestCancel:
        return getNewRequestsState(state, factoryAction.meta, {
          status: RequestsStatuses.Canceled,
        });
      case CommonActionTypes.RequestReset:
        return getNewRequestsState(state, factoryAction.meta, {
          status: RequestsStatuses.None,
          response: undefined,
          error: undefined,
        });

      case GlobalActionTypes.LoadingIncrement:
        return {
          ...state,
          [IS_SOMETHING_LOADING_STATE_KEY]: {
            ...state[IS_SOMETHING_LOADING_STATE_KEY],
            count: state[IS_SOMETHING_LOADING_STATE_KEY].count + 1,
          },
        };
      case GlobalActionTypes.LoadingDecrement:
        return {
          ...state,
          [IS_SOMETHING_LOADING_STATE_KEY]: {
            ...state[IS_SOMETHING_LOADING_STATE_KEY],
            count: state[IS_SOMETHING_LOADING_STATE_KEY].count - 1,
          },
        };
      case GlobalActionTypes.HydrateRequests:
        if (factoryAction.meta.stateRequestsKey !== config.stateRequestsKey) {
          return state;
        }

        return {
          ...state,
          [RESPONSES_STATE_KEY]: mergeHydratedResponses(
            state[RESPONSES_STATE_KEY],
            factoryAction.payload[RESPONSES_STATE_KEY]
          ),
        };

      default:
        return state;
    }
  };
