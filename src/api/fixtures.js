
import { apiGet } from './client';

export async function getFixtures({ league, season, provider }) {
  const res = await apiGet('/api/v1/fixtures', { league, season, provider });
  return (res && res.data && res.data.matches) || [];
}
