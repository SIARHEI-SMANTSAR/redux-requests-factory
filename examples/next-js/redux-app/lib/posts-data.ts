import { abortableDelay } from '@/lib/abortable-delay';

export type Post = {
  id: number;
  title: string;
};

const posts: Post[] = [
  { id: 1, title: 'Using Redux with React Server Components' },
  { id: 2, title: 'Hydrating request state in the App Router' },
  { id: 3, title: 'Streaming independent server components' },
];

export const getPosts = async (signal?: AbortSignal): Promise<Post[]> => {
  await abortableDelay(700, signal);

  return posts;
};
