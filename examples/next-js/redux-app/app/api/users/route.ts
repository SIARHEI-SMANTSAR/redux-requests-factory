import { getUsers } from '@/lib/users-data';

export async function GET() {
  return Response.json(await getUsers());
}
