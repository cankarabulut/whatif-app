// src/screens/StandingsScreen.js
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getFixtures } from '../api/fixtures';
import LeaguePicker from '../components/LeaguePicker';
import RoundPicker from '../components/RoundPicker';
import TeamLogo from '../components/TeamLogo';
import { useAppState } from '../context/AppStateContext';
import {
  getCachedFixtures,
  getFixturePredictions,
  setCachedFixtures,
  setFixturePredictions,
} from '../storage/cache';

// Yardımcı: skor -> outcome
function getOutcomeFromScore(home, away) {
  if (home == null || away == null) return null;
  if (home > away) return '1';
  if (home < away) return '2';
  return 'X';
}

// Seçili haftaya kadar GERÇEK puan durumu hesapla
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

    const home = fx.home;
    const away = fx.away;
    const fullHome = fx.score?.fullTime?.home;
    const fullAway = fx.score?.fullTime?.away;

    if (fullHome == null || fullAway == null) return;

    const outcome = getOutcomeFromScore(fullHome, fullAway);

    const homeRow = teams.get(home);
    const awayRow = teams.get(away);

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

// Tahminlerden DELTA puan hesapla (seçili haftaya kadar)
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

    const home = fx.home;
    const away = fx.away;

    // 1) Tahmin outcome'u
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

    // 2) Tahmine göre puanlar
    let predictedHome = 0;
    let predictedAway = 0;
    if (predictedOutcome === '1') {
      predictedHome = 3;
    } else if (predictedOutcome === '2') {
      predictedAway = 3;
    } else if (predictedOutcome === 'X') {
      predictedHome = 1;
      predictedAway = 1;
    }

    // 3) gerçek puanlar (sadece oynanmış ise)
    let actualHome = 0;
    let actualAway = 0;

    const fullHome = fx.score?.fullTime?.home;
    const fullAway = fx.score?.fullTime?.away;
    const actualOutcome =
      fx.status === 'FINISHED'
        ? getOutcomeFromScore(fullHome, fullAway)
        : null;

    if (actualOutcome) {
      if (actualOutcome === '1') {
        actualHome = 3;
      } else if (actualOutcome === '2') {
        actualAway = 3;
      } else if (actualOutcome === 'X') {
        actualHome = 1;
        actualAway = 1;
      }
    }

    const deltaHome = predictedHome - actualHome;
    const deltaAway = predictedAway - actualAway;

    add(home, deltaHome);
    add(away, deltaAway);
  });

  return totals;
}

function computeInitialRound(matches, league, season, currentRound) {
  const rs = Array.from(new Set(matches.map((m) => m.round))).sort(
    (a, b) => a - b
  );
  if (!rs.length) return null;

  const finishedRounds = matches
    .filter((m) => m.status === 'FINISHED')
    .map((m) => m.round);
  const maxFinished = finishedRounds.length
    ? Math.max(...finishedRounds)
    : null;

  const leagueSeasons = league.seasons || [];
  const latestSeason = leagueSeasons[leagueSeasons.length - 1];
  const isCurrentSeason = season === latestSeason;

  let initialRound;

  if (isCurrentSeason) {
    if (maxFinished == null) {
      initialRound = rs[0];
    } else {
      const idx = rs.indexOf(maxFinished);
      if (idx >= 0 && idx < rs.length - 1) {
        initialRound = rs[idx + 1]; // sıradaki aktif hafta
      } else {
        initialRound = maxFinished; // sezon bitmiş
      }
    }
  } else {
    // geçmiş sezon → son oynanan hafta
    initialRound = maxFinished || rs[rs.length - 1];
  }

  return initialRound;
}

export default function StandingsScreen() {
  const {
    league,
    season,
    round,
    setLeagueSeason,
    setRound,
    lang,
  } = useAppState();

  const [fixtures, setFixtures] = useState([]);
  const [fixtureStates, setFixtureStates] = useState({});
  const [rounds, setRounds] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState('actual'); // 'actual' | 'predicted'

  const tr = lang === 'tr';

  useEffect(() => {
    loadAll(true);
  }, [league, season]);

  async function loadAll(initial) {
    if (initial) setRefreshing(true);
    try {
      // Fikstürleri cache'ten oku
      const cached = await getCachedFixtures(league.id, season);
      if (cached) {
        setFixtures(cached);
        setupRounds(cached);
      }

      // Fikstürleri API'den çek
      const fresh = await getFixtures({
        league: league.id,
        season,
      });
      setFixtures(fresh);
      await setCachedFixtures(league.id, season, fresh);
      setupRounds(fresh);

      // Tahmin state'lerini oku
      const storedStates = await getFixturePredictions(league.id, season);
      setFixtureStates(storedStates || {});
    } catch (e) {
      console.log('Standings load error', e);
    } finally {
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
  
    const initialRound = computeInitialRound(matches, league, season, round);
  
    // İlk yüklemede veya invalid durumda güncel haftaya al
    if (round == null || !rs.includes(round)) {
      setRound(initialRound);
    }
  }  

  // Ekran fokuslandığında tahmin state'lerini yenile
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

  // Seçili haftaya göre gerçek tablo
  const actualTable = useMemo(
    () => computeActualTable(fixtures, round),
    [fixtures, round]
  );

  // Tahmin delta'ları (seçili haftaya kadar)
  const predDeltas = useMemo(
    () => computePredictionDeltas(fixtures, fixtureStates, round),
    [fixtures, fixtureStates, round]
  );

  // Gerçek sıralama
  const actualSorted = useMemo(
    () =>
      [...actualTable].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        return b.goalsFor - a.goalsFor;
      }),
    [actualTable]
  );

  // Tahminli puanlar
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

  // Sadece anlamlı tahmin varsa (ve sıralama değişmişse) hareket sütununu göster
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

  const handleClearSelections = async () => {
    setFixtureStates({});
    await setFixturePredictions(league.id, season, {});
  };

  const handleJumpToCurrentRound = () => {
    if (!fixtures.length) return;
    const initialRound = computeInitialRound(fixtures, league, season, round);
    if (initialRound != null) {
      setRound(initialRound); // mevcut round ne olursa olsun zorla güncel haftaya dön
    }
  };  

  const renderItem = ({ item }) => {
    const baseRank = actualRankByTeam[item.team] ?? 0; // gerçek sıra
    const predRank =
      mode === 'predicted' ? predictedRankByTeam[item.team] ?? baseRank : baseRank;

    const predictedPts =
      mode === 'predicted' ? item.predictedPoints ?? item.points : item.points;

    const currentRank = mode === 'actual' ? baseRank : predRank;

    let arrow = null;
    let arrowColor = '#9ca3af';

    if (mode === 'predicted' && showMovementColumn) {
      if (predRank < baseRank) {
        arrow = '↑';
        arrowColor = '#22c55e';
      } else if (predRank > baseRank) {
        arrow = '↓';
        arrowColor = '#ef4444';
      }
    }

    return (
      <View
        style={{
          flexDirection: 'row',
          paddingVertical: 6,
          paddingHorizontal: 8,
          borderBottomWidth: 1,
          borderColor: '#0b1120',
          alignItems: 'center',
        }}
      >
        {/* soldaki sıra: mod'a göre */}
        <Text style={{ width: 24, color: '#9ca3af', fontSize: 12 }}>
          {currentRank}
        </Text>

        {/* Ok + eski sıra (her zaman gerçek), sadece anlamlı tahmin varsa */}
        <View
          style={{
            width: showMovementColumn ? 34 : 0,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: showMovementColumn ? 4 : 0,
          }}
        >
          {mode === 'predicted' && showMovementColumn && arrow && (
            <>
              <Text
                style={{
                  color: arrowColor,
                  fontSize: 12,
                  fontWeight: '700',
                  marginRight: 2,
                }}
              >
                {arrow}
              </Text>
              <Text
                style={{
                  color: '#e5e7eb',
                  fontSize: 11,
                  fontWeight: '600',
                }}
              >
                {baseRank}
              </Text>
            </>
          )}
        </View>

        <TeamLogo name={item.team} size={22} />
        <Text style={{ flex: 1, color: '#e5e7eb', fontSize: 13 }}>
          {item.team}
        </Text>

        <Text style={{ width: 26, textAlign: 'right', color: '#9ca3af', fontSize: 11 }}>
          {item.played}
        </Text>
        <Text style={{ width: 26, textAlign: 'right', color: '#9ca3af', fontSize: 11 }}>
          {item.won}
        </Text>
        <Text style={{ width: 26, textAlign: 'right', color: '#9ca3af', fontSize: 11 }}>
          {item.draw}
        </Text>
        <Text style={{ width: 26, textAlign: 'right', color: '#9ca3af', fontSize: 11 }}>
          {item.lost}
        </Text>
        <Text style={{ width: 30, textAlign: 'right', color: '#9ca3af', fontSize: 11 }}>
          {item.goalsFor}
        </Text>
        <Text style={{ width: 30, textAlign: 'right', color: '#9ca3af', fontSize: 11 }}>
          {item.goalsAgainst}
        </Text>
        <Text style={{ width: 30, textAlign: 'right', color: '#9ca3af', fontSize: 11 }}>
          {item.goalDiff}
        </Text>

        <Text
          style={{
            width: 40,
            textAlign: 'right',
            color: '#f97316',
            fontSize: 12,
            fontWeight: '700',
          }}
        >
          {mode === 'actual' ? item.points : predictedPts}
        </Text>
      </View>
    );
  };

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

      {/* Mode toggle + butonlar satırı */}
      <View
        style={{
          paddingHorizontal: 16,
          marginBottom: 4,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Mode toggle */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#020617',
            borderRadius: 999,
            borderWidth: 1,
            borderColor: '#111827',
            overflow: 'hidden',
          }}
        >
          <Pressable
            onPress={() => setMode('actual')}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              backgroundColor: mode === 'actual' ? '#1d4ed8' : 'transparent',
            }}
          >
            <Text style={{ color: 'white', fontSize: 13 }}>
              {tr ? 'Gerçek' : 'Actual'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('predicted')}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              backgroundColor: mode === 'predicted' ? '#15803d' : 'transparent',
            }}
          >
            <Text style={{ color: 'white', fontSize: 13 }}>
              {tr ? 'Tahminlerim' : 'My Predictions'}
            </Text>
          </Pressable>
        </View>

        {/* Sağdaki mini butonlar */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={handleJumpToCurrentRound}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: '#111827',
              backgroundColor: '#020617',
            }}
          >
            <Text style={{ color: '#e5e7eb', fontSize: 11 }}>
              {tr ? 'Güncel haftayı getir' : 'Current week'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleClearSelections}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: '#111827',
              backgroundColor: '#020617',
            }}
          >
            <Text style={{ color: '#e5e7eb', fontSize: 11 }}>
              {tr ? 'Seçimleri temizle' : 'Clear'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 8,
          paddingVertical: 6,
          borderBottomWidth: 1,
          borderColor: '#111827',
        }}
      >
        <Text style={{ width: 24, color: '#6b7280', fontSize: 11 }}>#</Text>
        <Text
          style={{
            width: showMovementColumn ? 34 : 0,
            color: '#6b7280',
            fontSize: 11,
          }}
        >
          {showMovementColumn ? (tr ? 'Eski' : 'From') : ''}
        </Text>
        <Text style={{ width: 22 }} />
        <Text style={{ flex: 1, color: '#6b7280', fontSize: 11 }}>
          {tr ? 'Takım' : 'Team'}
        </Text>
        <Text style={{ width: 26, textAlign: 'right', color: '#6b7280', fontSize: 11 }}>
          P
        </Text>
        <Text style={{ width: 26, textAlign: 'right', color: '#6b7280', fontSize: 11 }}>
          W
        </Text>
        <Text style={{ width: 26, textAlign: 'right', color: '#6b7280', fontSize: 11 }}>
          D
        </Text>
        <Text style={{ width: 26, textAlign: 'right', color: '#6b7280', fontSize: 11 }}>
          L
        </Text>
        <Text style={{ width: 30, textAlign: 'right', color: '#6b7280', fontSize: 11 }}>
          GF
        </Text>
        <Text style={{ width: 30, textAlign: 'right', color: '#6b7280', fontSize: 11 }}>
          GA
        </Text>
        <Text style={{ width: 30, textAlign: 'right', color: '#6b7280', fontSize: 11 }}>
          GD
        </Text>
        <Text style={{ width: 40, textAlign: 'right', color: '#6b7280', fontSize: 11 }}>
          {mode === 'actual' ? (tr ? 'Puan' : 'Pts') : (tr ? 'Tah.' : 'Pred')}
        </Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.team}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            tintColor="#f97316"
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