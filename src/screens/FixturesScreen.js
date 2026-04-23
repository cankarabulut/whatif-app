// src/screens/FixturesScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import AppHeader from '../components/AppHeader';
import LeaguePicker from '../components/LeaguePicker';
import MatchCard from '../components/MatchCard';
import RoundPicker from '../components/RoundPicker';
import { getFixtures } from '../api/fixtures';
import { getRounds } from '../api/rounds';
import { useAppState } from '../context/AppStateContext';
import {
  getCachedFixtures,
  getFixturePredictions,
  setCachedFixtures,
  setFixturePredictions,
} from '../storage/cache';

export default function FixturesScreen() {
  const {
    league,
    season,
    round,
    activeRound,
    seasonActive,
    lang,
    setLeagueSeason,
    setRound,
    setActiveRound,
    setSeasonActive,
  } = useAppState();

  const [fixtures, setFixtures] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fixtureStates, setFixtureStates] = useState({});

  const tr = lang === 'tr';

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league, season]);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      (async () => {
        try {
          const storedStates = await getFixturePredictions(league.id, season);
          if (!active) return;
          setFixtureStates(storedStates || {});
        } catch (e) {
          console.log('Fixtures predictions refresh error', e);
        }
      })();
      return () => {
        active = false;
      };
    }, [league.id, season])
  );

  async function load(initial) {
    if (initial) setLoading(true);

    try {
      const storedStates = await getFixturePredictions(league.id, season);
      setFixtureStates(storedStates || {});

      const cached = await getCachedFixtures(league.id, season);
      if (cached && initial) {
        setFixtures(cached);
        syncRoundsFromMatches(cached);
      }

      const [fresh, roundsRes] = await Promise.all([
        getFixtures({ league: league.id, season }),
        getRounds({ league: league.id, season }),
      ]);

      setFixtures(fresh);
      await setCachedFixtures(league.id, season, fresh);

      setRounds(roundsRes.rounds);
      setActiveRound(roundsRes.activeRound);
      setSeasonActive(roundsRes.seasonActive);

      // İlk yüklemede veya round context'i geçersizse varsayılanı ayarla
      if (
        roundsRes.activeRound != null &&
        roundsRes.rounds.includes(roundsRes.activeRound) &&
        (round == null || !roundsRes.rounds.includes(round))
      ) {
        setRound(roundsRes.activeRound);
      } else if (round != null && !roundsRes.rounds.includes(round) && roundsRes.rounds.length) {
        setRound(
          roundsRes.activeRound ?? roundsRes.rounds[roundsRes.rounds.length - 1]
        );
      }
    } catch (e) {
      console.log('Fixtures load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Offline fallback: API erişilemezse fixture listesinden round set'i üret
  function syncRoundsFromMatches(matches) {
    const rs = Array.from(new Set(matches.map((m) => m.round))).sort(
      (a, b) => a - b
    );
    setRounds((prev) => (prev.length ? prev : rs));
  }

  const filtered = useMemo(
    () => (round == null ? fixtures : fixtures.filter((m) => m.round === round)),
    [fixtures, round]
  );

  const handleSelectOutcome = (fixture, outcome) => {
    setFixtureStates((prev) => {
      const current =
        prev[fixture.id] || { outcome: null, home: null, away: null };
      const nextOutcome = current.outcome === outcome ? null : outcome;
      const nextState = { outcome: nextOutcome, home: null, away: null };
      const nextAll = { ...prev, [fixture.id]: nextState };
      setFixturePredictions(league.id, season, nextAll);
      return nextAll;
    });
  };

  const handleChangeScore = (fixture, side, text) => {
    const parsed =
      text === ''
        ? null
        : Number.isNaN(parseInt(text, 10))
        ? null
        : parseInt(text, 10);

    setFixtureStates((prev) => {
      const current =
        prev[fixture.id] || { outcome: null, home: null, away: null };
      const nextState = { ...current, [side]: parsed, outcome: null };
      const nextAll = { ...prev, [fixture.id]: nextState };
      setFixturePredictions(league.id, season, nextAll);
      return nextAll;
    });
  };

  const handleClearSelections = async () => {
    setFixtureStates({});
    await setFixturePredictions(league.id, season, {});
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right']}>
      <AppHeader round={round} seasonActive={seasonActive} />

      <LeaguePicker
        selectedLeague={league}
        season={season}
        onChange={setLeagueSeason}
      />

      <RoundPicker
        rounds={rounds}
        round={round}
        activeRound={activeRound}
        onChange={setRound}
        lang={lang}
      />

      <View className="flex-row justify-center gap-2 px-4 pb-1">
        <Pressable
          onPress={handleClearSelections}
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface-muted active:bg-surface-hover"
        >
          <Ionicons name="refresh-circle-outline" size={12} color="#9CA7BE" />
          <Text className="text-fg-muted text-[11px] font-semibold">
            {tr ? 'Seçimleri temizle' : 'Clear selections'}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const st =
            fixtureStates[item.id] || { outcome: null, home: null, away: null };
          return (
            <MatchCard
              fixture={item}
              lang={lang}
              selectedOutcome={st.outcome}
              score={{ home: st.home, away: st.away }}
              onSelectOutcome={(opt) => handleSelectOutcome(item, opt)}
              onChangeHomeScore={(txt) => handleChangeScore(item, 'home', txt)}
              onChangeAwayScore={(txt) => handleChangeScore(item, 'away', txt)}
            />
          );
        }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            tintColor="#F97316"
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(false);
            }}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="calendar-outline" size={28} color="#5F6B82" />
              <Text className="text-fg-muted text-sm mt-2">
                {tr ? 'Maç bulunamadı.' : 'No matches found.'}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
