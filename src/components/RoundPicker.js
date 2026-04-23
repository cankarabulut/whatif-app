// src/components/RoundPicker.js
import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PILL_WIDTH = 68;

export default function RoundPicker({ rounds, round, activeRound, onChange, lang }) {
  const tr = lang === 'tr';
  const scrollRef = useRef(null);
  const idx = rounds.indexOf(round);
  const canPrev = idx > 0;
  const canNext = idx >= 0 && idx < rounds.length - 1;
  const isAtActive = activeRound != null && round === activeRound;

  useEffect(() => {
    if (!scrollRef.current || idx < 0) return;
    const x = Math.max(0, (idx - 2) * (PILL_WIDTH + 8));
    scrollRef.current.scrollTo({ x, animated: true });
  }, [idx]);

  const go = (delta) => {
    const next = rounds[idx + delta];
    if (next != null) onChange(next);
  };

  return (
    <View className="px-4 py-2">
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => go(-1)}
          disabled={!canPrev}
          className={`h-9 w-9 rounded-full border border-border bg-surface-muted items-center justify-center ${
            canPrev ? '' : 'opacity-40'
          }`}
        >
          <Ionicons name="chevron-back" size={16} color="#E5E7EB" />
        </Pressable>

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
          className="flex-1"
        >
          {rounds.map((r) => {
            const active = r === round;
            const isActivePointer = activeRound != null && r === activeRound;
            return (
              <Pressable
                key={String(r)}
                onPress={() => onChange(r)}
                className={`min-w-[68px] px-3 py-1.5 rounded-full border items-center ${
                  active
                    ? 'bg-brand border-brand'
                    : 'border-border bg-surface-muted'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${active ? 'text-white' : 'text-fg'}`}
                >
                  {tr ? `H${r}` : `R${r}`}
                </Text>
                {isActivePointer && !active && (
                  <View className="h-1 w-1 rounded-full bg-brand mt-0.5" />
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={() => go(1)}
          disabled={!canNext}
          className={`h-9 w-9 rounded-full border border-border bg-surface-muted items-center justify-center ${
            canNext ? '' : 'opacity-40'
          }`}
        >
          <Ionicons name="chevron-forward" size={16} color="#E5E7EB" />
        </Pressable>
      </View>

      {activeRound != null && !isAtActive && (
        <Pressable
          onPress={() => onChange(activeRound)}
          className="mt-2 self-center flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-brand/15 border border-brand/30"
        >
          <Ionicons name="locate-outline" size={12} color="#F97316" />
          <Text className="text-brand text-[11px] font-semibold">
            {tr ? `Bu hafta · ${activeRound}` : `Current · ${activeRound}`}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
