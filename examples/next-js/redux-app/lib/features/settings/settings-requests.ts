import { requestsFactory, type RequestContext } from 'redux-requests-factory';

import { getSettings, type Settings } from '@/lib/settings-data';

export type { Settings };

const loadSettingsRequest = async (
  _params: undefined,
  { signal }: RequestContext
): Promise<Settings> => {
  if (typeof window === 'undefined') {
    return getSettings(signal);
  }

  const response = await fetch('/api/settings', { signal });

  if (!response.ok) {
    throw new Error('Failed to load settings');
  }

  return response.json() as Promise<Settings>;
};

export const {
  isLoadingSelector: settingsLoadingSelector,
  loadDataAction: loadSettingsAction,
  responseSelector: settingsSelector,
} = requestsFactory({
  request: loadSettingsRequest,
  stateRequestKey: 'settings',
});
