import { abortableDelay } from '@/lib/abortable-delay';

export type Settings = {
  language: string;
  notifications: boolean;
  theme: string;
};

const settings: Settings = {
  language: 'English',
  notifications: true,
  theme: 'System',
};

export const getSettings = async (signal?: AbortSignal): Promise<Settings> => {
  await abortableDelay(300, signal);

  return settings;
};
