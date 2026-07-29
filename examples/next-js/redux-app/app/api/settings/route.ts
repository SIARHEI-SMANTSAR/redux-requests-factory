import { getSettings } from '@/lib/settings-data';

export async function GET(request: Request) {
  return Response.json(await getSettings(request.signal));
}
