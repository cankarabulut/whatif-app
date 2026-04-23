// src/screens/StandingsScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import AppHeader from '../components/AppHeader';
import LeaguePicker from '../components/LeaguePicker';
import RoundPicker from '../components/RoundPicker';
import StandingsRow from '../components/StandingsRow';
import { getFixtures } from '../api/fixtures';
import { getRounds } from '../api/rounds';
import { useAppState } from '../context/AppStateContext';
import {
  getCachedFixtures,
  getFixturePredictions,
  setCachedFixtures,
  setFixturePredictions,
} from '../storage/cache';

function getOutcomeFromScore(home, away) {
  if (home == null || away == null) return null;
  if (home > away) return '1';
  if (home < away) return '2';
  return 'X';
}

function computeActualTable(fixtures, roundLimit) {
  const teams = new Map();
  const ensureTeam = (name) => {
    if (!name) return;
    if (!teams.has(name)) {
      teams.set(name, {
        team: name,
        played: 0,
        won: 0,
        draw: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
      });
    }
  };

  fixtures.forEach((fx) => {
    ensureTeam(fx.home);
    ensureTeam(fx.away);
  });

  fixtures.forEach((fx) => {
    if (roundLimit != null && fx.round > roundLimit) return;
    if (fx.status !== 'FINISHED') return;

    const fullHome = fx.score?.fullTime?.home;
    const fullAway = fx.score?.fullTime?.away;
    if (fullHome == null || fullAway == null) return;

    const outcome = getOutcomeFromScore(fullHome, fullAway);
    const homeRow = teams.get(fx.home);
    const awayRow = teams.get(fx.away);

    homeRow.played += 1;
    awayRow.played += 1;
    homeRow.goalsFor += fullHome;
    homeRow.goalsAgainst += fullAway;
    homeRow.goalDiff = homeRow.goalsFor - homeRow.goalsAgainst;
    awayRow.goalsFor += fullAway;
    awayRow.goalsAgainst += fullHome;
    awayRow.goalDiff = awayRow.goalsFor - awayRow.goalsAgainst;

    if (outcome === '1') {
      homeRow.won += 1;
      awayRow.lost += 1;
      homeRow.points += 3;
    } else if (outcome === '2') {
      awayRow.won += 1;
      homeRow.lost += 1;
      awayRow.points += 3;
    } else if (outcome === 'X') {
      homeRow.draw += 1;
      awayRow.draw += 1;
      homeRow.points += 1;
      awayRow.points += 1;
    }
  });

  return Array.from(teams.values());
}

function computePredictionDeltas(fixtures, fixtureStates, roundLimit) {
  const totals = {};
  const add = (team, pts) => {
    if (!team || !pts) return;
    totals[team] = (totals[team] || 0) + pts;
  };

  fixtures.forEach((fx) => {
    if (roundLimit != null && fx.round > roundLimit) return;
    const st = fixtureStates[fx.id];
    if (!st) return;

    let predictedOutcome = st.outcome;
    if (
      !predictedOutcome &&
      st.home !== null &&
      st.home !== undefined &&
      st.away !== null &&
      st.away !== undefined
    ) {
      predictedOutcome = getOutcomeFromScore(st.home, st.away);
    }
    if (!predictedOutcome) return;

    let predictedHome = 0;
    let predictedAway = 0;
    if (predictedOutcome === '1') predictedHome = 3;
    else if (predictedOutcome === '2') predictedAway = 3;
    else {
      predictedHome = 1;
      predictedAway = 1;
    }

    let actualHome = 0;
    let actualAway = 0;
    const fullHome = fx.score?.fullTime?.home;
    const fullAway = fx.score?.fullTime?.away;
    const actualOutcome =
      fx.status === 'FINISHED' ? getOutcomeFromScore(fullHome, fullAway) : null;
    if (actualOutcome === '1') actualHome = 3;
    else if (actualOutcome === '2') actualAway = 3;
    else if (actualOutcome === 'X') {
      actualHome = 1;
      actualAway = 1;
    }

    add(fx.home, predictedHome - actualHome);
    add(fx.away, predictedAway - actualAway);
  });

  return totals;
}

export default function StandingsScreen() {
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
  const [fixtureStates, setFixtureStates] = useState({});
  const [rounds, setRounds] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState('actual');

  const tr = lang === 'tr';

  useEffect(() => {
    loadAll(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league, season]);

  async function loadAll(initial) {
    if (initial) setRefreshing(true);
    try {
      const cached = await getCachedFixtures(league.id, season);
      if (cached) {
        setFixtures(cached);
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

      const storedStates = await getFixturePredictions(league.id, season);
      setFixtureStates(storedStates || {});
    } catch (e) {
      console.log('Standings load error', e);
    } finally {
      setRefreshing(false);
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      (async () => {
        try {
          const storedStates = await getFixturePredictions(league.id, season);
          if (!active) return;
          const state = storedStates || {};
          setFixtureStates(state);
          const hasAnyPrediction = Object.keys(state).length > 0;
          setMode(hasAnyPrediction ? 'predicted' : 'actual');
        } catch (e) {
          console.log('Predictions refresh error', e);
        }
      })();
      return () => {
        active = false;
      };
    }, [league.id, season])
  );

  const actualTable = useMemo(
    () => computeActualTable(fixtures, round),
    [fixtures, round]
  );
  const predDeltas = useMemo(
    () => computePredictionDeltas(fixtures, fixtureStates, round),
    [fixtures, fixtureStates, round]
  );
  const actualSorted = useMemo(
    () =>
      [...actualTable].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        return b.goalsFor - a.goalsFor;
      }),
    [actualTable]
  );
  const predictedWithPoints = useMemo(
    () =>
      actualTable.map((row) => {
        const delta = predDeltas[row.team] ?? 0;
        return { ...row, predictedPoints: row.points + delta };
      }),
    [actualTable, predDeltas]
  );
  const predictedSorted = useMemo(
    () =>
      [...predictedWithPoints].sort((a, b) => {
        if (b.predictedPoints !== a.predictedPoints) {
          return b.predictedPoints - a.predictedPoints;
        }
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        return b.goalsFor - a.goalsFor;
      }),
    [predictedWithPoints]
  );

  const actualRankByTeam = useMemo(() => {
    const m = {};
    actualSorted.forEach((t, idx) => {
      m[t.team] = idx + 1;
    });
    return m;
  }, [actualSorted]);

  const predictedRankByTeam = useMemo(() => {
    const m = {};
    predictedSorted.forEach((t, idx) => {
      m[t.team] = idx + 1;
    });
    return m;
  }, [predictedSorted]);

  const hasMeaningfulPredictions = useMemo(() => {
    if (!Object.keys(predDeltas).length) return false;
    return Object.keys(predictedRankByTeam).some((team) => {
      const a = actualRankByTeam[team];
      const p = predictedRankByTeam[team];
      return a && p && a !== p;
    });
  }, [predDeltas, actualRankByTeam, predictedRankByTeam]);

  const showMovementColumn = mode === 'predicted' && hasMeaningfulPredictions;
  const data = mode === 'actual' ? actualSorted : predictedSorted;
  const total = data.length;

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

      {/* Mode toggle + Clear */}
      <View className="flex-row items-center justify-between px-4 pb-2">
        <View className="flex-row rounded-full border border-border bg-surface-muted p-0.5">
          {['actual', 'predicted'].map((m) => {
            const active = mode === m;
            const label =
              m === 'actual'
                ? tr
                  ? 'Gerçek'
                  : 'Actual'
                : tr
                ? 'Tahminlerim'
                : 'Predicted';
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                className={`px-3 py-1 rounded-full ${active ? 'bg-brand' : ''}`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    active ? 'text-white' : 'text-fg-muted'
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleClearSelections}
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface-muted active:bg-surface-hover"
        >
          <Ionicons name="refresh-circle-outline" size={12} color="#9CA7BE" />
          <Text className="text-fg-muted text-[11px] font-semibold">
            {tr ? 'Temizle' : 'Clear'}
          </Text>
        </Pressable>
      </View>

      {/* Table header */}
      <View className="flex-row items-center px-2 py-2 bg-surface-muted border-y border-border-subtle">
        <Text className="w-6 text-fg-subtle text-[10px] uppercase tracking-widest">
          #
        </Text>
        {showMovementColumn && (
          <Text className="w-8 text-fg-subtle text-[10px] uppercase tracking-widest text-center">
            {tr ? 'Eski' : 'From'}
          </Text>
        )}
        <View className="w-[22px]" />
        <Text className="flex-1 text-fg-subtle text-[10px] uppercase tracking-widest">
          {tr ? 'Takım' : 'Team'}
        </Text>
        <Text className="w-7 text-right text-fg-subtle text-[10px] uppercase">
          O
        </Text>
        <Text className="w-7 text-right text-fg-subtle text-[10px] uppercase">
          G
        </Text>
        <Text className="w-7 text-right text-fg-subtle text-[10px] uppercase">
          B
        </Text>
        <Text className="w-7 text-right text-fg-subtle text-[10px] uppercase">
          M
        </Text>
        <Text className="w-9 text-right text-fg-subtle text-[10px] uppercase">
          AV
        </Text>
        <Text className="w-10 text-right text-fg-subtle text-[10px] uppercase">
          {mode === 'actual' ? 'P' : 'T'}
        </Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.team}
        renderItem={({ item }) => {
          const baseRank = actualRankByTeam[item.team] ?? 0;
          const predRank = predictedRankByTeam[item.team] ?? baseRank;
          const currentRank = mode === 'actual' ? baseRank : predRank;
          const previousRank = mode === 'predicted' ? baseRank : null;
          const pointsToShow =
            mode === 'actual'
              ? item.points
              : item.predictedPoints ?? item.points;

          return (
            <StandingsRow
              item={item}
              rank={currentRank}
              previousRank={previousRank}
              pointsToShow={pointsToShow}
              total={total}
              league={league.id}
              showMovement={showMovementColumn}
            />
          );
        }}
        refreshControl={
          <RefreshControl
            tintColor="#F97316"
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAll(false);
            }}
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}
