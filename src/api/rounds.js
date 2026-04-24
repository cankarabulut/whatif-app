import { apiGet } from './client';

export async function getRounds({ league, season }) {
  const res = await apiGet('/api/v1/rounds', { league, season });
  const data = res?.data || {};
  const rounds = Array.isArray(data.rounds) ? data.rounds : [];

  return {
    active: data.active ?? null,
    seasonActive: Boolean(data.seasonActive),
    rounds: rounds
      .map((r) => Number(r.round))
      .filter((r) => Number.isFinite(r))
      .sort((a, b) => a - b),
  };
}
