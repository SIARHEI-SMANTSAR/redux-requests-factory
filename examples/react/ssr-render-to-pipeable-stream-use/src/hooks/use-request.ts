import { use } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AsyncRequestFactoryAction } from 'redux-requests-factory';

import {
  loadActivityAction,
  loadStatsAction,
  activityRequestVersionSelector,
  statsRequestVersionSelector,
} from '../dashboard-requests';
import { useRequestBaseUrl } from '../request-base-url';
import type { AppDispatch, RootState } from '../store';
import {
  loadUsersAction,
  usersRequestVersionSelector,
} from '../users-request';

type RequestParams = {
  baseUrl?: string;
};

type LoadAction = (params?: RequestParams) => AsyncRequestFactoryAction;

const useRequest = (
  loadAction: LoadAction,
  requestVersionSelector: (state: RootState) => number
) => {
  const dispatch = useDispatch<AppDispatch>();
  const baseUrl = useRequestBaseUrl();
  // Each real request start replaces the Promise cached by loadDataAction.
  // Subscribe to its version so this render reads that Promise through use().
  useSelector(requestVersionSelector);

  use(dispatch(loadAction({ baseUrl })));
};

export const useUsersRequest = () =>
  useRequest(loadUsersAction, usersRequestVersionSelector);

export const useStatsRequest = () =>
  useRequest(loadStatsAction, statsRequestVersionSelector);

export const useActivityRequest = () =>
  useRequest(loadActivityAction, activityRequestVersionSelector);
