// src/api/standings.js
import { apiGet } from './client';

export async function getStandings({ league, season }) {
  const res = await apiGet('/api/v1/standings', { league, season });
  return (res && res.data && res.data.table) || [];
}
