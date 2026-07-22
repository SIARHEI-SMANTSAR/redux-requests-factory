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

export const getUsers = async (): Promise<User[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return users;
};
