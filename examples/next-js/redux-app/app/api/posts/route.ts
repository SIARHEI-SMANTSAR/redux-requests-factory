import { getPosts } from '@/lib/posts-data';

export async function GET(request: Request) {
  return Response.json(await getPosts(request.signal));
}
