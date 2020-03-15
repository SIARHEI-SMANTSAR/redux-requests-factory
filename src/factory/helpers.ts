import memoize from 'lodash.memoize';
import debounce from 'lodash.debounce';

import {
  RequestFactoryConfig,
  RequestFactoryConfigWithSerialize,
  RequestActionMeta,
} from '../types';

export const actionToString = function toString(this: any) {
  return JSON.stringify({
    type: this.type,
    meta: this.meta,
    payload: this.payload,
  });
};

export const isWithSerialize = <Response, Params>(
  config: RequestFactoryConfig<Response, Params>
): config is RequestFactoryConfigWithSerialize<Response, Params> =>
  (config as RequestFactoryConfigWithSerialize<Response, Params>)
    .serializeRequestParameters !== undefined;

export const getByPath = <Value = any, Object = any>(...keys: string[]) => (
  obj: Object
): Value | null =>
  keys
    .filter(Boolean)
    .reduce<Value | null>(
      (value: any, key) => (value ? value[key] : null),
      obj as any
    );

export const getRequestKey = ({
  key,
  serializedKey,
}: RequestActionMeta): string => `${key}_${serializedKey || ''}`;

export const getSerializedKey = <Response, Params>(
  factoryConfig: RequestFactoryConfig<Response, Params>,
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
