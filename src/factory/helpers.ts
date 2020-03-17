import memoize from 'lodash.memoize';
import debounce from 'lodash.debounce';

import {
  RequestFactoryConfig,
  RequestFactoryConfigWithSerialize,
  RequestActionMeta,
  RequestsStatuses,
  PreparedConfig,
} from '../types';
import registerRequestKey from './register-request-key';

export const actionToString = function toString(this: any) {
  return JSON.stringify({
    type: this.type,
    meta: this.meta,
    payload: this.payload,
  });
};

export const isWithSerialize = <Resp, Params>(
  config: RequestFactoryConfig<Resp, Params>
): config is RequestFactoryConfigWithSerialize<Resp, Params> =>
  (config as RequestFactoryConfigWithSerialize<Resp, Params>)
    .serializeRequestParameters !== undefined;

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

export const getSerializedKey = <Resp, Params>(
  factoryConfig: RequestFactoryConfig<Resp, Params>,
  params?: Params
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

export const patchConfig = <
  Resp,
  Params,
  Config extends RequestFactoryConfig<Resp, Params>
>(
  config: Config
): Config => ({
  ...config,
  stateRequestKey: registerRequestKey(config.stateRequestKey),
});

export const isNeedLoadData = <State>(
  { stateRequestsKey }: PreparedConfig,
  { key, serializedKey }: RequestActionMeta,
  state: State
) => {
  const status = getByPath<RequestsStatuses, State>(
    stateRequestsKey,
    key,
    serializedKey,
    'status'
  )(state);

  return !(
    status === RequestsStatuses.Loading || status === RequestsStatuses.Success
  );
};

export const identity = <T>(a: T): T => a;
