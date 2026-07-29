import { abortableDelay } from '@/lib/abortable-delay';

export type User = {
  id: number;
  name: string;
  role: string;
};

const users: User[] = [
  { id: 1, name: 'Ada Lovelace', role: 'Engineer' },
  { id: 2, name: 'Grace Hopper', role: 'Computer scientist' },
  { id: 3, name: 'Margaret Hamilton', role: 'Software engineer' },
];

export const getUsers = async (signal?: AbortSignal): Promise<User[]> => {
  await abortableDelay(500, signal);

  return users;
};
