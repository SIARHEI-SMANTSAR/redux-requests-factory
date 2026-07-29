import { getUsers } from '@/lib/users-data';

export async function GET(request: Request) {
  return Response.json(await getUsers(request.signal));
}
