import { getPosts } from '@/lib/posts-data';

export async function GET() {
  return Response.json(await getPosts());
}
