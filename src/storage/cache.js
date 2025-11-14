import AsyncStorage from '@react-native-async-storage/async-storage';

function key(prefix, league, season) {
  return `${prefix}:${league}:${season}`;
}

/**
 * FIXTURES CACHE
 */
export async function getCachedFixtures(league, season) {
  try {
    const k = key('fixtures', league, season);
    const raw = await AsyncStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setCachedFixtures(league, season, fixtures) {
  try {
    const k = key('fixtures', league, season);
    await AsyncStorage.setItem(k, JSON.stringify(fixtures));
  } catch {}
}

/**
 * STANDINGS CACHE
 */
export async function getCachedStandings(league, season) {
  try {
    const k = key('standings', league, season);
    const raw = await AsyncStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setCachedStandings(league, season, table) {
  try {
    const k = key('standings', league, season);
    await AsyncStorage.setItem(k, JSON.stringify(table));
  } catch {}
}

/**
 * TAKIM BAZLI PREDICTION DELTALARI
 * { "Liverpool FC": 6, "Arsenal FC": 2, ... }
 */
export async function getPredictions(league, season) {
  try {
    const k = key('predictions', league, season);
    const raw = await AsyncStorage.getItem(k);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function setPredictions(league, season, preds) {
  try {
    const k = key('predictions', league, season);
    await AsyncStorage.setItem(k, JSON.stringify(preds));
  } catch {}
}

/**
 * MAÇ BAZLI TAHMİNLER
 * {
 *   "537844": { outcome: "1" | "X" | "2" | null, home: 2 | null, away: 1 | null },
 *   ...
 * }
 */
export async function getFixturePredictions(league, season) {
  try {
    const k = key('fixtureSelections', league, season);
    const raw = await AsyncStorage.getItem(k);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function setFixturePredictions(league, season, selections) {
  try {
    const k = key('fixtureSelections', league, season);
    await AsyncStorage.setItem(k, JSON.stringify(selections));
  } catch {}
}