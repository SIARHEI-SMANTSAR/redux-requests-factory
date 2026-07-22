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

export const getSettings = async (): Promise<Settings> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return settings;
};
