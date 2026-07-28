import { requestsFactory } from 'redux-requests-factory';

type RequestParams = {
  baseUrl?: string;
};

export type Stats = {
  projects: number;
  requestsToday: number;
  successRate: string;
};

export type Activity = {
  id: number;
  message: string;
};

const requestJson = async <Response>(
  path: string,
  { baseUrl = '' }: RequestParams = {}
): Promise<Response> => {
  const response = await fetch(`${baseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`${path} failed with status ${response.status}`);
  }

  return response.json() as Promise<Response>;
};

export const {
  loadDataAction: loadStatsAction,
  responseSelector: statsSelector,
} = requestsFactory({
  request: (params?: RequestParams) => requestJson<Stats>('/api/stats', params),
  stateRequestKey: 'stats',
});

export const {
  loadDataAction: loadActivityAction,
  responseSelector: activitySelector,
} = requestsFactory({
  request: (params?: RequestParams) =>
    requestJson<Activity[]>('/api/activity', params),
  stateRequestKey: 'activity',
  transformResponse: (response: Activity[] | undefined) => response ?? [],
});
