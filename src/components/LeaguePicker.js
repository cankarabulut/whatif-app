import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { LEAGUES } from '../constants/leagues';
import { useAppState } from '../context/AppStateContext';

function formatSeasonLabel(season) {
  if (!season && season !== 0) return 'Season';
  if (typeof season === 'number') {
    return `${season}`;
  }
  return String(season);
}

export default function LeaguePicker({ selectedLeague, season, onChange }) {
  const [leagueModalVisible, setLeagueModalVisible] = useState(false);
  const [seasonModalVisible, setSeasonModalVisible] = useState(false);

  const { lang, toggleLang } = useAppState();
  const tr = lang === 'tr';

  const currentLeague = selectedLeague || LEAGUES[0];

  const seasons = useMemo(
    () => currentLeague.seasons || [],
    [currentLeague]
  );

  const leagueLabel =
    currentLeague.shortName || currentLeague.name || (tr ? 'Lig Seç' : 'Select league');
  const seasonLabel = formatSeasonLabel(season);

  const handleSelectLeague = (league) => {
    setLeagueModalVisible(false);

    const leagueSeasons = league.seasons || [];
    let nextSeason = season;

    if (!leagueSeasons.includes(nextSeason)) {
      nextSeason =
        leagueSeasons.length > 0
          ? leagueSeasons[leagueSeasons.length - 1]
          : null;
    }

    onChange({ league, season: nextSeason });
  };

  const handleSelectSeason = (s) => {
    setSeasonModalVisible(false);
    onChange({ league: currentLeague, season: s });
  };

  return (
    <>
      {/* Üst bar: League + Season + dil switch */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 4,
          alignItems: 'center',
        }}
      >
        {/* League dropdown */}
        <Pressable
          onPress={() => setLeagueModalVisible(true)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#020617',
            borderRadius: 999,
            borderWidth: 1,
            borderColor: '#111827',
            paddingHorizontal: 14,
            paddingVertical: 8,
            marginRight: 8,
          }}
        >
          <Text
            style={{
              color: '#e5e7eb',
              fontSize: 13,
            }}
            numberOfLines={1}
          >
            {leagueLabel}
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>▼</Text>
        </Pressable>

        {/* Season dropdown */}
        <Pressable
          onPress={() => setSeasonModalVisible(true)}
          style={{
            width: 110,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#020617',
            borderRadius: 999,
            borderWidth: 1,
            borderColor: '#111827',
            paddingHorizontal: 14,
            paddingVertical: 8,
            marginRight: 8,
          }}
        >
          <Text
            style={{
              color: '#e5e7eb',
              fontSize: 13,
            }}
          >
            {seasonLabel}
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>▼</Text>
        </Pressable>

        {/* Dil toggle */}
        <Pressable
          onPress={toggleLang}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: '#111827',
            backgroundColor: '#020617',
          }}
        >
          <Text style={{ color: '#e5e7eb', fontSize: 12 }}>
            {tr ? 'TR' : 'EN'}
          </Text>
        </Pressable>
      </View>

      {/* League seçimi için modal */}
      <Modal
        visible={leagueModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLeagueModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setLeagueModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15,23,42,0.75)',
              justifyContent: 'flex-end',
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: '#020617',
                  paddingHorizontal: 16,
                  paddingTop: 12,
                  paddingBottom: 24,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  maxHeight: '60%',
                }}
              >
                <Text
                  style={{
                    color: '#9ca3af',
                    fontSize: 13,
                    marginBottom: 8,
                  }}
                >
                  {tr ? 'Lig Seç' : 'Select League'}
                </Text>

                <FlatList
                  data={LEAGUES}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const isActive = item.id === currentLeague.id;
                    return (
                      <Pressable
                        onPress={() => handleSelectLeague(item)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: '#0f172a',
                        }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 999,
                            backgroundColor: isActive ? '#f97316' : '#4b5563',
                            marginRight: 8,
                          }}
                        />
                        <Text
                          style={{
                            color: isActive ? '#f97316' : '#e5e7eb',
                            fontSize: 14,
                          }}
                        >
                          {item.name}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Season seçimi için modal */}
      <Modal
        visible={seasonModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSeasonModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setSeasonModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15,23,42,0.75)',
              justifyContent: 'flex-end',
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: '#020617',
                  paddingHorizontal: 16,
                  paddingTop: 12,
                  paddingBottom: 24,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  maxHeight: '50%',
                }}
              >
                <Text
                  style={{
                    color: '#9ca3af',
                    fontSize: 13,
                    marginBottom: 8,
                  }}
                >
                  {tr ? 'Sezon Seç' : 'Select Season'}
                </Text>

                <FlatList
                  data={seasons.slice().sort((a, b) => b - a)}
                  keyExtractor={(item) => String(item)}
                  renderItem={({ item }) => {
                    const isActive = item === season;
                    return (
                      <Pressable
                        onPress={() => handleSelectSeason(item)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: '#0f172a',
                        }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 999,
                            backgroundColor: isActive ? '#f97316' : '#4b5563',
                            marginRight: 8,
                          }}
                        />
                        <Text
                          style={{
                            color: isActive ? '#f97316' : '#e5e7eb',
                            fontSize: 14,
                          }}
                        >
                          {formatSeasonLabel(item)}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}