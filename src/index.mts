export * from './index.js';

declare const createReduxRequestsFactory: typeof import('./index.js').default;
export default createReduxRequestsFactory;
