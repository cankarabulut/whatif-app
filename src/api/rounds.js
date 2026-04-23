// src/api/rounds.js
import { apiGet } from './client';

/**
 * GET /api/v1/rounds
 * Döndürür: { rounds: number[], activeRound: number|null, seasonActive: boolean, roundInfo: RoundInfo[] }
 */
export async function getRounds({ league, season }) {
  const res = await apiGet('/api/v1/rounds', { league, season });
  const data = (res && res.data) || {};
  const roundInfo = Array.isArray(data.rounds) ? data.rounds : [];
  const rounds = roundInfo
    .map((r) => Number(r.round))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  return {
    rounds,
    activeRound: data.activeRound ?? null,
    seasonActive: Boolean(data.seasonActive),
    roundInfo,
  };
}
