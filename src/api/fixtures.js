// src/api/fixtures.js
import { apiGet } from './client';

export async function getFixtures({ league, season }) {
  const res = await apiGet('/api/v1/fixtures', { league, season });
  return (res && res.data && res.data.matches) || [];
}
