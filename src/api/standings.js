
import { apiGet } from './client';

export async function getStandings({ league, season, provider }) {
  const res = await apiGet('/api/v1/standings', { league, season, provider });
  return (res && res.data && res.data.table) || [];
}
