import { use } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  RequestsStatuses,
  type AsyncRequestFactoryAction,
} from 'redux-requests-factory';

import {
  loadActivityAction,
  loadStatsAction,
  activityStatusSelector,
  statsStatusSelector,
} from '../dashboard-requests';
import { useRequestBaseUrl } from '../request-base-url';
import type { AppDispatch } from '../store';
import {
  loadUsersAction,
  usersStatusSelector,
} from '../users-request';

type RequestParams = {
  baseUrl?: string;
};

type LoadAction = (params?: RequestParams) => AsyncRequestFactoryAction;

const useRequest = (
  status: RequestsStatuses,
  loadAction: LoadAction
) => {
  const dispatch = useDispatch<AppDispatch>();
  const baseUrl = useRequestBaseUrl();

  if (
    status === RequestsStatuses.None ||
    status === RequestsStatuses.Loading
  ) {
    use(dispatch(loadAction({ baseUrl })));
  }
};

export const useUsersRequest = () =>
  useRequest(useSelector(usersStatusSelector), loadUsersAction);

export const useStatsRequest = () =>
  useRequest(useSelector(statsStatusSelector), loadStatsAction);

export const useActivityRequest = () =>
  useRequest(
    useSelector(activityStatusSelector),
    loadActivityAction
  );
