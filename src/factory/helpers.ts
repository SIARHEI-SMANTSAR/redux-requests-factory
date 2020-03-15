import {
  RequestFactoryConfig,
  RequestFactoryConfigWithSerialize,
} from '../types';

export const actionToString = function toString(this: any) {
  return JSON.stringify({ ...this });
};

export const isWithSerialize = <Response, Params>(
  config: RequestFactoryConfig<Response, Params>
): config is RequestFactoryConfigWithSerialize<Response, Params> =>
  (config as RequestFactoryConfigWithSerialize<Response, Params>)
    .serializeRequestParameters !== undefined;

export const getByPath = <Value = any, Object = any>(...keys: string[]) => (
  obj: Object
): Value | null =>
  keys.reduce<Value | null>(
    (value: any, key) => (value ? value[key] : null),
    obj as any
  );

export const getRequestKey = <Response, Params>(
  factoryConfig: RequestFactoryConfig<Response, Params>,
  params?: Params
): string =>
  isWithSerialize(factoryConfig)
    ? `${
        factoryConfig.stateRequestKey
      }_${factoryConfig.serializeRequestParameters(params)}`
    : factoryConfig.stateRequestKey;
