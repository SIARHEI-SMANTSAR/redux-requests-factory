import memoize from 'lodash.memoize';
import debounce from 'lodash.debounce';

import {
  RequestFactoryConfig,
  RequestActionMeta,
  RequestsStatuses,
  PreparedConfig,
  RequestFactoryConfigWithParamsWithSerialize,
  RequestFactoryConfigWithTransformResponse,
} from '../../types';
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
) => (obj: Object): Value | null =>
  keys
    .filter(Boolean)
    .reduce<Value | null>(
      (value: any, key) => (value ? value[key as string] : null),
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
