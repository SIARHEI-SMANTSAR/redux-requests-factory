import { requestsFactory, type RequestContext } from 'redux-requests-factory';

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
  { baseUrl = '' }: RequestParams = {},
  signal?: AbortSignal
): Promise<Response> => {
  const response = await fetch(`${baseUrl}${path}`, { signal });

  if (!response.ok) {
    throw new Error(`${path} failed with status ${response.status}`);
  }

  return response.json() as Promise<Response>;
};

export const {
  loadDataAction: loadStatsAction,
  responseSelector: statsSelector,
} = requestsFactory({
  request: (params: RequestParams | undefined, { signal }: RequestContext) =>
    requestJson<Stats>('/api/stats', params, signal),
  stateRequestKey: 'stats',
});

export const {
  loadDataAction: loadActivityAction,
  responseSelector: activitySelector,
} = requestsFactory({
  request: (params: RequestParams | undefined, { signal }: RequestContext) =>
    requestJson<Activity[]>('/api/activity', params, signal),
  stateRequestKey: 'activity',
  transformResponse: (response: Activity[] | undefined) => response ?? [],
});
