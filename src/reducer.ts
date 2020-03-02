import { PreparedConfig } from './types';

export const createRequestsReducer = ({ stateRequestsKey }: PreparedConfig) => {
  console.log('redux-requests-reducer', stateRequestsKey);
};
