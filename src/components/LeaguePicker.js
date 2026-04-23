// src/components/LeaguePicker.js
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LEAGUES } from '../constants/leagues';
import { useAppState } from '../context/AppStateContext';

function formatSeasonLabel(season) {
  if (season == null) return 'Season';
  const y = parseInt(season, 10);
  if (Number.isFinite(y)) {
    return `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
  }
  return String(season);
}

export default function LeaguePicker({ selectedLeague, season, onChange }) {
  const [leagueModalVisible, setLeagueModalVisible] = useState(false);
  const [seasonModalVisible, setSeasonModalVisible] = useState(false);

  const { lang } = useAppState();
  const tr = lang === 'tr';

  const currentLeague = selectedLeague || LEAGUES[0];
  const seasons = useMemo(() => currentLeague.seasons || [], [currentLeague]);

  const handleSelectLeague = (league) => {
    setLeagueModalVisible(false);
    const leagueSeasons = league.seasons || [];
    let nextSeason = season;
    if (!leagueSeasons.includes(nextSeason)) {
      nextSeason =
        leagueSeasons.length > 0 ? leagueSeasons[leagueSeasons.length - 1] : null;
    }
    onChange({ league, season: nextSeason });
  };

  const handleSelectSeason = (s) => {
    setSeasonModalVisible(false);
    onChange({ league: currentLeague, season: s });
  };

  return (
    <>
      <View className="flex-row px-4 py-2 gap-2">
        <Pressable
          onPress={() => setLeagueModalVisible(true)}
          className="flex-[2] flex-row items-center justify-between rounded-xl border border-border bg-surface-muted px-3 py-2.5 active:bg-surface-hover"
        >
          <View className="flex-row items-center gap-2 flex-1">
            <Ionicons name="football-outline" size={14} color="#9CA7BE" />
            <Text className="text-fg text-sm font-semibold flex-1" numberOfLines={1}>
              {currentLeague.name}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={14} color="#9CA7BE" />
        </Pressable>

        <Pressable
          onPress={() => setSeasonModalVisible(true)}
          className="w-[110px] flex-row items-center justify-between rounded-xl border border-border bg-surface-muted px-3 py-2.5 active:bg-surface-hover"
        >
          <Text className="text-fg text-sm font-semibold">
            {formatSeasonLabel(season)}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#9CA7BE" />
        </Pressable>
      </View>

      <PickerModal
        visible={leagueModalVisible}
        title={tr ? 'Lig Seç' : 'Select League'}
        onClose={() => setLeagueModalVisible(false)}
        data={LEAGUES}
        keyExtractor={(item) => item.id}
        renderLabel={(item) => item.name}
        isActive={(item) => item.id === currentLeague.id}
        onSelect={handleSelectLeague}
      />

      <PickerModal
        visible={seasonModalVisible}
        title={tr ? 'Sezon Seç' : 'Select Season'}
        onClose={() => setSeasonModalVisible(false)}
        data={seasons.slice().sort((a, b) => b - a)}
        keyExtractor={(item) => String(item)}
        renderLabel={(item) => formatSeasonLabel(item)}
        isActive={(item) => item === season}
        onSelect={handleSelectSeason}
      />
    </>
  );
}

function PickerModal({
  visible,
  title,
  onClose,
  data,
  keyExtractor,
  renderLabel,
  isActive,
  onSelect,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/70 justify-end">
          <TouchableWithoutFeedback>
            <View className="bg-surface rounded-t-3xl border-t border-border-strong px-4 pt-3 pb-8 max-h-[60%]">
              <View className="h-1 w-10 rounded-full bg-border-strong self-center mb-3" />
              <Text className="text-fg-muted text-xs uppercase tracking-widest mb-2">
                {title}
              </Text>
              <FlatList
                data={data}
                keyExtractor={keyExtractor}
                renderItem={({ item }) => {
                  const active = isActive(item);
                  return (
                    <Pressable
                      onPress={() => onSelect(item)}
                      className={`flex-row items-center justify-between py-3 px-3 rounded-xl mb-1 ${
                        active ? 'bg-brand/15 border border-brand/30' : 'border border-transparent'
                      }`}
                    >
                      <Text
                        className={`text-sm ${active ? 'text-brand font-semibold' : 'text-fg'}`}
                      >
                        {renderLabel(item)}
                      </Text>
                      {active && <Ionicons name="checkmark" size={16} color="#F97316" />}
                    </Pressable>
                  );
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
