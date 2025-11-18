// src/storage/cache.js
import AsyncStorage from '@react-native-async-storage/async-storage';

function makeKey(prefix, league, season) {
  return `${prefix}:${league}:${season}`;
}

async function getJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function setJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sessiz geçiyoruz; cache hatası app'i bozmamalı
  }
}

/**
 * FIXTURES CACHE
 */
export async function getCachedFixtures(league, season) {
  const k = makeKey('fixtures', league, season);
  return getJson(k, null);
}

export async function setCachedFixtures(league, season, fixtures) {
  const k = makeKey('fixtures', league, season);
  return setJson(k, fixtures);
}

/**
 * STANDINGS CACHE
 */
export async function getCachedStandings(league, season) {
  const k = makeKey('standings', league, season);
  return getJson(k, null);
}

export async function setCachedStandings(league, season, table) {
  const k = makeKey('standings', league, season);
  return setJson(k, table);
}

/**
 * TAKIM BAZLI PREDICTION DELTALARI
 * { "Liverpool FC": 6, "Arsenal FC": 2, ... }
 */
export async function getPredictions(league, season) {
  const k = makeKey('predictions', league, season);
  return getJson(k, {});
}

export async function setPredictions(league, season, preds) {
  const k = makeKey('predictions', league, season);
  return setJson(k, preds);
}

/**
 * MAÇ BAZLI TAHMİNLER
 * {
 *   "537844": { outcome: "1" | "X" | "2" | null, home: 2 | null, away: 1 | null },
 *   ...
 * }
 */
export async function getFixturePredictions(league, season) {
  const k = makeKey('fixtureSelections', league, season);
  return getJson(k, {});
}

export async function setFixturePredictions(league, season, selections) {
  const k = makeKey('fixtureSelections', league, season);
  return setJson(k, selections);
}