import { PreparedConfig } from './types';

export const createRequestsFactory = ({ stateRequestsKey }: PreparedConfig) => {
  console.log('redux-requests-factory', stateRequestsKey);
};
