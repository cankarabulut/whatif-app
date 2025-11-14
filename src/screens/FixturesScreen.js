// src/screens/FixturesScreen.js
import React, { useEffect, useState } from 'react';
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
import MatchCard from '../components/MatchCard';
import RoundPicker from '../components/RoundPicker';
import { useAppState } from '../context/AppStateContext';
import {
  getCachedFixtures,
  getFixturePredictions,
  setCachedFixtures,
  setFixturePredictions,
} from '../storage/cache';

export default function FixturesScreen() {
  const { league, season, round, setLeagueSeason, setRound, lang } = useAppState();
  const [fixtures, setFixtures] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // matchId -> { outcome: '1'|'X'|'2'|null, home: number|null, away: number|null }
  const [fixtureStates, setFixtureStates] = useState({});

  const tr = lang === 'tr';

  useEffect(() => {
    load(true);
  }, [league, season]);

  async function load(initial) {
    if (initial) setLoading(true);
    try {
      const storedStates = await getFixturePredictions(league.id, season);
      setFixtureStates(storedStates || {});

      const cached = await getCachedFixtures(league.id, season);
      if (cached && initial) {
        setupRounds(cached);
        setFixtures(cached);
      }

      const fresh = await getFixtures({
        league: league.id,
        season,
        provider: league.providerForFixtures,
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

    if (round == null || !rs.includes(round)) {
      setRound(initialRound);
    }
  }

  const selectedRound = round;
  const filtered =
    selectedRound == null
      ? fixtures
      : fixtures.filter((m) => m.round === selectedRound);

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
  
    const rs = rounds;
    const finishedRounds = fixtures
      .filter((m) => m.status === 'FINISHED')
      .map((m) => m.round);
    const maxFinished = finishedRounds.length
      ? Math.max(...finishedRounds)
      : null;
  
    const leagueSeasons = league.seasons || [];
    const latestSeason = leagueSeasons[leagueSeasons.length - 1];
    const isCurrentSeason = season === latestSeason;
  
    let targetRound;
  
    if (isCurrentSeason) {
      if (maxFinished == null) {
        targetRound = rs[0];
      } else {
        const idx = rs.indexOf(maxFinished);
        if (idx >= 0 && idx < rs.length - 1) {
          targetRound = rs[idx + 1];
        } else {
          targetRound = maxFinished;
        }
      }
    } else {
      targetRound = maxFinished || rs[rs.length - 1];
    }
  
    if (targetRound != null) {
      setRound(targetRound);
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

      {/* Seçimleri temizle butonu */}
      <View
  style={{
    paddingHorizontal: 16,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  }}
>
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
              onChangeHomeScore={(txt) => handleChangeScore(item, 'home', txt)}
              onChangeAwayScore={(txt) => handleChangeScore(item, 'away', txt)}
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