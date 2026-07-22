import { requestsFactory } from 'redux-requests-factory';

import { getSettings, type Settings } from '@/lib/settings-data';

export type { Settings };

const loadSettingsRequest = async (): Promise<Settings> => {
  if (typeof window === 'undefined') {
    return getSettings();
  }

  const response = await fetch('/api/settings');

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
