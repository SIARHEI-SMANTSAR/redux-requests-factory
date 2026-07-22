import { getSettings } from '@/lib/settings-data';

export async function GET() {
  return Response.json(await getSettings());
}
