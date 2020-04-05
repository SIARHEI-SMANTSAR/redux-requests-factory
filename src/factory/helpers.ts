import memoize from 'lodash.memoize';
import debounce from 'lodash.debounce';

import {
  RequestFactoryConfig,
  RequestActionMeta,
  RequestsStatuses,
  PreparedConfig,
  RequestFactoryConfigWithParamsWithSerialize,
  RequestFactoryConfigWithTransformResponse,
  DoRequestMapByKey,
} from '../types';
import registerRequestKey from './register-request-key';
import { RESPONSES_STATE_KEY } from '../constants';

export const actionToString = function toString(this: any) {
  return JSON.stringify({
    type: this.type,
    meta: this.meta,
    payload: this.payload,
  });
};

export const isWithSerialize = <Resp, Err, Params, State, TransformedResp>(
  config: RequestFactoryConfig<Resp, Err, Params, State, TransformedResp>
): config is RequestFactoryConfigWithParamsWithSerialize<
  Resp,
  Err,
  Params,
  State
> =>
  (config as RequestFactoryConfigWithParamsWithSerialize<
    Resp,
    Err,
    Params,
    State
  >).serializeRequestParameters !== undefined;

export const isWithTransformResponse = <
  Resp,
  Err,
  Params,
  State,
  TransformedResp
>(
  config: RequestFactoryConfig<Resp, Err, Params, State, TransformedResp>
): config is RequestFactoryConfigWithTransformResponse<
  Resp,
  Err,
  Params,
  State,
  TransformedResp
> =>
  (config as RequestFactoryConfigWithTransformResponse<
    Resp,
    Err,
    Params,
    State,
    TransformedResp
  >).transformResponse !== undefined;

export const getByPath = <Value = any, Object = any>(
  ...keys: (string | undefined)[]
) => (obj: Object): Value | undefined =>
  keys
    .filter(Boolean)
    .reduce<Value | undefined>(
      (value: any, key) => (value ? value[key as string] : undefined),
      obj as any
    );

export const getRequestKey = ({
  key,
  serializedKey,
}: RequestActionMeta): string => `${key}_${serializedKey || ''}`;

export const getSerializedKey = <Resp, Err, Params, State, TransformedResp>(
  factoryConfig: RequestFactoryConfig<
    Resp,
    Err,
    Params,
    State,
    TransformedResp
  >,
  params: Params
): string | undefined =>
  isWithSerialize(factoryConfig)
    ? factoryConfig.serializeRequestParameters(params)
    : undefined;

export const isFactoryAction = (type: string) =>
  /^@@REDUX_REQUESTS_FACTORY\//.test(type);

export const memoizeDebounce = function<
  Func extends (this: any, ...args: any) => any
>(func: Func, wait = 0, options: any = {}): Func {
  var mem = memoize(function() {
    return debounce(func, wait, options);
  }, options.resolver);

  return function() {
    // @ts-ignore
    mem.apply(this, arguments).apply(this, arguments);
  } as Func;
};

export const patchConfig = <Resp, Err, Params, State, TransformedResp>(
  config: RequestFactoryConfig<Resp, Err, Params, State, TransformedResp>
): RequestFactoryConfig<Resp, Err, Params, State, TransformedResp> => ({
  ...config,
  stateRequestKey: registerRequestKey(config.stateRequestKey),
});

export const isNeedLoadData = <State, Key extends string>(
  { stateRequestsKey }: PreparedConfig<Key>,
  { key, serializedKey }: RequestActionMeta,
  state: State
) => {
  const status = getByPath<RequestsStatuses, State>(
    stateRequestsKey,
    RESPONSES_STATE_KEY,
    key,
    serializedKey,
    'status'
  )(state);

  return !(
    status === RequestsStatuses.Loading || status === RequestsStatuses.Success
  );
};

export const identity = <T>(a: T): T => a;

export const setNewRequestToMap = (
  doRequestMapByKey: DoRequestMapByKey,
  requestKey: string,
  requestNumber: number
) => {
  if (doRequestMapByKey.has(requestKey)) {
    doRequestMapByKey.get(requestKey)?.set(requestNumber, { canceled: false });
  } else {
    doRequestMapByKey.set(
      requestKey,
      new Map([[requestNumber, { canceled: false }]])
    );
  }
};

export const isRequestCanceled = (
  doRequestMapByKey: DoRequestMapByKey,
  requestKey: string,
  requestNumber: number
) => doRequestMapByKey.get(requestKey)!.get(requestNumber)!.canceled;

export const deleteRequestFromMap = (
  doRequestMapByKey: DoRequestMapByKey,
  requestKey: string,
  requestNumber: number
) => {
  doRequestMapByKey.get(requestKey)?.delete(requestNumber);
};

export const cancelRequestInMap = (
  doRequestMapByKey: DoRequestMapByKey,
  requestKey: string
) => {
  if (doRequestMapByKey.has(requestKey)) {
    const doRequestMap = doRequestMapByKey.get(requestKey);
    if (doRequestMap) {
      const entries = Array.from(doRequestMap);
      if (entries.length > 0) {
        const [requestNumber] = entries[entries.length - 1];
        const statusObj = doRequestMap.get(requestNumber);
        if (statusObj && statusObj.canceled === false) {
          statusObj.canceled = true;

          return true;
        }
      }
    }
  }
  return false;
};
