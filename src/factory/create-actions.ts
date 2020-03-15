import { Dispatch } from 'redux';

import {
  RequestsFactoryItemActions,
  PreparedConfig,
  RequestFactoryConfig,
  RequestActionMeta,
  FactoryActionTypes,
  DoRequestAction,
  CancelRequestAction,
  GetActionConfig,
} from '../types';
import {
  commonRequestStartAction,
  commonRequestSuccessAction,
  commonRequestErrorAction,
  commonRequestCancelAction,
} from '../actions';
import {
  actionToString,
  getRequestKey,
  getSerializedKey,
  memoizeDebounce,
} from './helpers';

const createActions = <Response, Error, Params, State>(
  _config: PreparedConfig,
  factoryConfig: RequestFactoryConfig<Response, Params>
): RequestsFactoryItemActions<Response, Error, Params> => {
  const {
    request,
    stateRequestKey,
    useDebounce = false,
    debounceWait = 500,
    debounceOptions,
    stringifyParamsForDebounce = JSON.stringify,
  } = factoryConfig;

  const cancelMapByKey: { [key: string]: boolean } = {};
  const doRequestMapByKey: { [key: string]: boolean } = {};

  const doRequest = async ({
    params,
    dispatch,
    meta,
    requestKey,
  }: {
    params?: Params;
    dispatch: Dispatch;
    meta: RequestActionMeta;
    requestKey: string;
  }) => {
    dispatch(commonRequestStartAction(meta));
    try {
      const response = await request(params);
      if (!cancelMapByKey[requestKey]) {
        dispatch(commonRequestSuccessAction(meta, response));
      }
    } catch (error) {
      if (!cancelMapByKey[requestKey]) {
        dispatch(commonRequestErrorAction(meta, error));
      }
    } finally {
      doRequestMapByKey[requestKey] = false;
    }
  };

  const memoizedDoRequest = memoizeDebounce(doRequest, debounceWait, {
    leading: true,
    trailing: false,
    maxWait: debounceWait,
    ...debounceOptions,
    resolver: ({ params }: { params?: Params }) => {
      try {
        return stringifyParamsForDebounce(params);
      } catch (error) {
        return params;
      }
    },
  });

  const getDoRequestAction = ({
    params,
    meta,
    requestKey,
  }: GetActionConfig<Params>) => {
    cancelMapByKey[requestKey] = false;
    doRequestMapByKey[requestKey] = true;

    return async (dispatch: Dispatch, _getState: () => State) =>
      await (useDebounce ? memoizedDoRequest : doRequest)({
        params,
        dispatch,
        meta,
        requestKey,
      });
  };

  const createAction = <Action = any>(
    type: string,
    getAction: (config: GetActionConfig<Params>) => any
  ) => {
    const doRequestAction = (params?: Params): Action => {
      const meta: RequestActionMeta = {
        key: stateRequestKey,
        serializedKey: getSerializedKey<Response, Params>(
          factoryConfig,
          params
        ),
      };
      const requestKey = getRequestKey(meta);

      const action = getAction({
        params,
        meta,
        requestKey,
      });

      action.type = type;
      action.meta = meta;
      action.payload = params;

      action.toString = actionToString;

      return action as Action;
    };

    doRequestAction.type = type;
    doRequestAction.toString = () => type;

    return doRequestAction;
  };

  return {
    doRequestAction: createAction<DoRequestAction<Params>>(
      `${FactoryActionTypes.DoRequest}/${stateRequestKey}`,
      getDoRequestAction
    ),
    cancelRequestAction: createAction<CancelRequestAction<Params>>(
      `${FactoryActionTypes.CancelRequest}/${stateRequestKey}`,
      ({ meta, requestKey }: GetActionConfig<Params>) => {
        if (doRequestMapByKey[requestKey]) {
          cancelMapByKey[requestKey] = true;
        }

        return async (dispatch: Dispatch) => {
          if (doRequestMapByKey[requestKey]) {
            dispatch(commonRequestCancelAction(meta));
          }
        };
      }
    ),
  };
};

export default createActions;
