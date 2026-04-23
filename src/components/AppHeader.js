// src/components/AppHeader.js
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppState } from '../context/AppStateContext';

function formatSeason(season) {
  const y = parseInt(season, 10);
  if (Number.isFinite(y)) {
    const suffix = String((y + 1) % 100).padStart(2, '0');
    return `${y}/${suffix}`;
  }
  return String(season ?? '');
}

export default function AppHeader({ round, seasonActive }) {
  const { league, season, lang, toggleLang } = useAppState();
  const tr = lang === 'tr';

  const roundLabel = round != null ? `${tr ? 'Hafta' : 'Round'} ${round}` : '';

  return (
    <View className="border-b border-border-subtle bg-bg-elevated">
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
        <View className="flex-row items-center gap-3 flex-1">
          <View className="h-10 w-10 rounded-xl border border-border-strong bg-surface items-center justify-center">
            <Ionicons name="trophy" size={18} color="#F97316" />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-fg-muted text-[10px] uppercase tracking-widest">
              {tr ? 'Ne olsaydı' : 'What-if'}
            </Text>
            <Text className="text-fg text-base font-bold" numberOfLines={1}>
              {league?.name ?? ''}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-1">
              <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted border border-border">
                <Ionicons name="calendar-outline" size={10} color="#9CA7BE" />
                <Text className="text-fg-muted text-[10px] font-semibold">
                  {formatSeason(season)}
                </Text>
              </View>
              {roundLabel ? (
                <View
                  className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full border ${
                    seasonActive
                      ? 'bg-brand/15 border-brand/30'
                      : 'bg-surface-muted border-border'
                  }`}
                >
                  {seasonActive && (
                    <View className="h-1.5 w-1.5 rounded-full bg-brand" />
                  )}
                  <Text
                    className={`text-[10px] font-semibold ${
                      seasonActive ? 'text-brand' : 'text-fg-muted'
                    }`}
                  >
                    {roundLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <Pressable
          onPress={toggleLang}
          className="flex-row rounded-full border border-border bg-surface-muted p-0.5"
        >
          {['tr', 'en'].map((l) => (
            <View
              key={l}
              className={`px-2.5 py-1 rounded-full ${
                lang === l ? 'bg-brand' : ''
              }`}
            >
              <Text
                className={`text-[10px] font-bold uppercase ${
                  lang === l ? 'text-white' : 'text-fg-muted'
                }`}
              >
                {l}
              </Text>
            </View>
          ))}
        </Pressable>
      </View>
    </View>
  );
}
