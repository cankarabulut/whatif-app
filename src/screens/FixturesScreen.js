// src/screens/FixturesScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { getFixtures } from '../api/fixtures';
import LeaguePicker from '../components/LeaguePicker';
import MatchCard from '../components/MatchCard';
import RoundPicker from '../components/RoundPicker';
import { useAppState } from '../context/AppStateContext';
import {
  getCachedFixtures,
  getFixturePredictions,
  setCachedFixtures,
  setFixturePredictions,
} from '../storage/cache';

function computeTargetRound(rounds, matches, league, season) {
  if (!rounds.length || !matches.length) return null;

  const finishedRounds = matches
    .filter((m) => m.status === 'FINISHED')
    .map((m) => m.round);
  const maxFinished = finishedRounds.length
    ? Math.max(...finishedRounds)
    : null;

  const leagueSeasons = league.seasons || [];
  const latestSeason = leagueSeasons[leagueSeasons.length - 1];
  const isCurrentSeason = season === latestSeason;

  if (isCurrentSeason) {
    if (maxFinished == null) {
      // güncel sezon; hiç maç oynanmamış → ilk hafta
      return rounds[0];
    }
    const idx = rounds.indexOf(maxFinished);
    if (idx >= 0 && idx < rounds.length - 1) {
      // sıradaki aktif hafta
      return rounds[idx + 1];
    }
    // sezon bitmiş → son oynanan hafta
    return maxFinished;
  }

  // geçmiş sezon → son oynanan hafta, o da yoksa son hafta
  return maxFinished || rounds[rounds.length - 1];
}

export default function FixturesScreen() {
  const { league, season, round, setLeagueSeason, setRound, lang } =
    useAppState();

  const [fixtures, setFixtures] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // matchId -> { outcome: '1'|'X'|'2'|null, home: number|null, away: number|null }
  const [fixtureStates, setFixtureStates] = useState({});

  const tr = lang === 'tr';

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league, season]);

  // ekran fokuslandığında tahmin state'lerini yenile
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
        setupRounds(cached);
      }

      const fresh = await getFixtures({
        league: league.id,
        season,
      });

      setFixtures(fresh);
      setupRounds(fresh);
      await setCachedFixtures(league.id, season, fresh);
    } catch (e) {
      console.log('Fixtures load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function setupRounds(matches) {
    const rs = Array.from(new Set(matches.map((m) => m.round))).sort(
      (a, b) => a - b
    );
    setRounds(rs);

    if (!rs.length) {
      setRound(null);
      return;
    }

    const initialRound = computeTargetRound(rs, matches, league, season);

    if (initialRound != null && (round == null || !rs.includes(round))) {
      setRound(initialRound);
    }
  }

  const selectedRound = round;
  const filtered = useMemo(
    () =>
      selectedRound == null
        ? fixtures
        : fixtures.filter((m) => m.round === selectedRound),
    [fixtures, selectedRound]
  );

  const handleSelectOutcome = (fixture, outcome) => {
    setFixtureStates((prev) => {
      const current =
        prev[fixture.id] || { outcome: null, home: null, away: null };

      const nextOutcome = current.outcome === outcome ? null : outcome;

      const nextState = {
        outcome: nextOutcome,
        home: null,
        away: null,
      };

      const nextAll = {
        ...prev,
        [fixture.id]: nextState,
      };

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
      const nextState = {
        ...current,
        [side]: parsed,
        outcome: null,
      };

      const nextAll = {
        ...prev,
        [fixture.id]: nextState,
      };

      setFixturePredictions(league.id, season, nextAll);
      return nextAll;
    });
  };

  const handleJumpToCurrentRound = () => {
    if (!fixtures.length || !rounds.length) return;

    const targetRound = computeTargetRound(rounds, fixtures, league, season);
    if (targetRound != null) {
      setRound(targetRound); // global round
    }
  };

  const handleClearSelections = async () => {
    setFixtureStates({});
    await setFixturePredictions(league.id, season, {});
  };

  const emptyLabel = tr ? 'Maç bulunamadı.' : 'No matches found.';

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#020617' }}
      edges={['top', 'left', 'right']}
    >
      <LeaguePicker
        selectedLeague={league}
        season={season}
        onChange={setLeagueSeason}
      />

      <RoundPicker
        rounds={rounds}
        round={round}
        onChange={setRound}
        lang={lang}
      />

      <View
        style={{
          paddingHorizontal: 16,
          marginBottom: 4,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Pressable
          onPress={handleJumpToCurrentRound}
          style={({ pressed }) => [
            {
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: '#111827',
              backgroundColor: '#020617',
            },
            pressed && {
              opacity: 0.8,
              transform: [{ scale: 0.97 }],
            },
          ]}
        >
          <Text style={{ color: '#e5e7eb', fontSize: 11 }}>
            {tr ? 'Güncel haftayı getir' : 'Current week'}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleClearSelections}
          style={({ pressed }) => [
            {
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: '#111827',
              backgroundColor: '#020617',
            },
            pressed && {
              opacity: 0.8,
              transform: [{ scale: 0.97 }],
            },
          ]}
        >
          <Text style={{ color: '#e5e7eb', fontSize: 11 }}>
            {tr ? 'Temizle' : 'Clear selections'}
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
              selectedOutcome={st.outcome}
              score={{ home: st.home, away: st.away }}
              onSelectOutcome={(opt) => handleSelectOutcome(item, opt)}
              onChangeHomeScore={(txt) =>
                handleChangeScore(item, 'home', txt)
              }
              onChangeAwayScore={(txt) =>
                handleChangeScore(item, 'away', txt)
              }
            />
          );
        }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            tintColor="#f97316"
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(false);
            }}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={{ padding: 16 }}>
              <Text style={{ color: '#6b7280', textAlign: 'center' }}>
                {emptyLabel}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}