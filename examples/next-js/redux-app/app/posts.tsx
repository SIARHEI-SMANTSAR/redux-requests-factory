'use client';

import { useEffect } from 'react';

import {
  loadPostsAction,
  postsLoadingSelector,
  postsSelector,
} from '@/lib/features/posts/posts-requests';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';

export default function Posts() {
  const dispatch = useAppDispatch();
  const posts = useAppSelector(postsSelector) ?? [];
  const isLoading = useAppSelector(postsLoadingSelector);

  useEffect(() => {
    dispatch(loadPostsAction());
  }, [dispatch]);

  return (
    <section className="w-full rounded-2xl border border-black/10 bg-white p-8 text-left shadow-sm dark:border-white/15 dark:bg-zinc-900">
      <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
        Posts request
      </p>
      <h2 className="mt-1 text-2xl font-semibold">Posts</h2>

      {isLoading ? <p className="mt-4 text-zinc-500">Loading posts…</p> : null}

      <ul className="mt-4 list-inside list-disc space-y-2">
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </section>
  );
}
