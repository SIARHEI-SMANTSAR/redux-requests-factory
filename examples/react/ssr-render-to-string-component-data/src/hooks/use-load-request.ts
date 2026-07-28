import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AsyncRequestFactoryAction } from 'redux-requests-factory';

import { loadActivityAction, loadStatsAction } from '../dashboard-requests';
import { useRequestEnvironment } from '../request-environment';
import type { AppDispatch } from '../store';
import { loadUsersAction } from '../users-request';

type RequestParams = {
  baseUrl?: string;
};

type LoadAction = (params?: RequestParams) => AsyncRequestFactoryAction;

const useLoadRequest = (loadAction: LoadAction) => {
  const dispatch = useDispatch<AppDispatch>();
  const { serverBaseUrl } = useRequestEnvironment();

  // Effects do not run during renderToString, so the discovery render starts
  // the request synchronously. A normal cached action is safe on pass two.
  if (serverBaseUrl !== null) {
    void dispatch(loadAction({ baseUrl: serverBaseUrl }));
  }

  // In the browser the same action starts only after mount or navigation.
  useEffect(() => {
    void dispatch(loadAction());
  }, [dispatch, loadAction]);
};

export const useLoadUsers = () => useLoadRequest(loadUsersAction);
export const useLoadStats = () => useLoadRequest(loadStatsAction);
export const useLoadActivity = () => useLoadRequest(loadActivityAction);
