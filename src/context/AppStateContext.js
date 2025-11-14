// src/context/AppStateContext.js
import React, { createContext, useContext, useState } from 'react';
import { DEFAULT_LEAGUE } from '../constants/leagues';

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [league, internalSetLeague] = useState(DEFAULT_LEAGUE);
  const [season, internalSetSeason] = useState(
    DEFAULT_LEAGUE.seasons[DEFAULT_LEAGUE.seasons.length - 1]
  );
  const [round, setRound] = useState(null); // ortak "hafta"
  const [lang, setLang] = useState('en'); // 'en' | 'tr'

  const setLeagueSeason = ({ league: lg, season: s }) => {
    const nextLeague = lg || league;
    const seasons = nextLeague.seasons || [];
    const nextSeason =
      s != null
        ? s
        : seasons.length > 0
        ? seasons[seasons.length - 1]
        : null;

    internalSetLeague(nextLeague);
    internalSetSeason(nextSeason);
    // Lig veya sezon değişince haftayı yeniden belirleyeceğiz
    setRound(null);
  };

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'tr' : 'en'));
  };

  const value = {
    league,
    season,
    round,
    lang,
    setLeagueSeason,
    setRound,
    setLang,
    toggleLang,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}