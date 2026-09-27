import { getPilotWeather } from '@/infrastructure/weather/open-meteo';
export async function GET() {
  try {
    return Response.json(await getPilotWeather(), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Vädertjänsten kunde inte nås. Försök igen om en stund. Inga gamla betyg visas.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
