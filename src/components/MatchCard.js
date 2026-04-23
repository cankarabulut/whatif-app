// src/components/MatchCard.js
import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import TeamLogo from './TeamLogo';

const FINISHED_STATUSES = new Set(['FINISHED', 'FT', 'AET', 'PEN']);
const LIVE_STATUSES = new Set(['IN_PLAY', 'LIVE', '1H', '2H', 'HT', 'PAUSED']);

function formatDateTime(iso, lang) {
  const d = new Date(iso);
  const locale = lang === 'tr' ? 'tr-TR' : 'en-GB';
  const date = d.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    weekday: 'short',
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return { date, time };
}

function StatusBadge({ status, lang }) {
  const s = String(status || '').toUpperCase();
  const tr = lang === 'tr';
  if (FINISHED_STATUSES.has(s)) {
    return (
      <View className="self-start px-2 py-0.5 rounded-full border border-border bg-surface-muted">
        <Text className="text-fg-muted text-[9px] font-bold tracking-wider">FT</Text>
      </View>
    );
  }
  if (LIVE_STATUSES.has(s)) {
    return (
      <View className="self-start flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-danger/20">
        <View className="h-1.5 w-1.5 rounded-full bg-danger" />
        <Text className="text-danger text-[9px] font-bold tracking-wider">LIVE</Text>
      </View>
    );
  }
  return (
    <View className="self-start px-2 py-0.5 rounded-full bg-info/15">
      <Text className="text-info text-[9px] font-bold tracking-wider">
        {tr ? 'YAKINDA' : 'UPCOMING'}
      </Text>
    </View>
  );
}

export default function MatchCard({
  fixture,
  selectedOutcome,
  score,
  lang = 'tr',
  onSelectOutcome,
  onChangeHomeScore,
  onChangeAwayScore,
}) {
  const home = fixture.home;
  const away = fixture.away;

  const statusUpper = String(fixture.status || '').toUpperCase();
  const isFinished = FINISHED_STATUSES.has(statusUpper);
  const isLive = LIVE_STATUSES.has(statusUpper);

  const scoreHomeActual = fixture.score?.fullTime?.home ?? null;
  const scoreAwayActual = fixture.score?.fullTime?.away ?? null;

  const { date, time } = formatDateTime(fixture.utcDate, lang);
  const homePred = score?.home ?? null;
  const awayPred = score?.away ?? null;

  const outcomeDisabled = homePred !== null || awayPred !== null;
  const scoreDisabled = !!selectedOutcome;

  return (
    <View
      className={`flex-row items-stretch gap-3 rounded-2xl border bg-surface p-3 mb-2.5 ${
        isLive ? 'border-danger/40' : 'border-border'
      }`}
    >
      {/* Left: date/time/status */}
      <View className="w-16 border-r border-border-subtle pr-3 justify-between">
        <View>
          <Text className="text-fg-subtle text-[10px] uppercase tracking-wider">
            {date}
          </Text>
          <Text className="text-fg text-base font-bold mt-0.5">{time}</Text>
        </View>
        <StatusBadge status={fixture.status} lang={lang} />
      </View>

      {/* Middle: teams */}
      <View className="flex-1 justify-center gap-2">
        <View className="flex-row items-center">
          <TeamLogo name={home} size={22} />
          <Text className="text-fg text-sm font-semibold flex-1" numberOfLines={1}>
            {home}
          </Text>
          {isFinished && (
            <Text className="text-fg text-base font-bold ml-2 tabular-nums min-w-[18px] text-right">
              {scoreHomeActual ?? '-'}
            </Text>
          )}
        </View>
        <View className="flex-row items-center">
          <TeamLogo name={away} size={22} />
          <Text className="text-fg text-sm font-semibold flex-1" numberOfLines={1}>
            {away}
          </Text>
          {isFinished && (
            <Text className="text-fg text-base font-bold ml-2 tabular-nums min-w-[18px] text-right">
              {scoreAwayActual ?? '-'}
            </Text>
          )}
        </View>
      </View>

      {/* Right: predictions (only if not finished) */}
      {!isFinished && (
        <View className="items-end justify-between gap-2">
          <View className="flex-row overflow-hidden rounded-lg border border-border bg-bg-elevated">
            {['1', 'X', '2'].map((opt) => {
              const isSelected = selectedOutcome === opt;
              const disabled = outcomeDisabled && !isSelected;
              return (
                <Pressable
                  key={opt}
                  disabled={disabled}
                  onPress={() => onSelectOutcome && onSelectOutcome(opt)}
                  className={`w-7 py-1 items-center ${
                    isSelected ? 'bg-brand' : ''
                  } ${disabled ? 'opacity-40' : ''}`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-white' : 'text-fg'
                    }`}
                  >
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View className="flex-row items-center gap-0.5">
            <TextInput
              className={`w-9 h-7 rounded-md border border-border bg-surface-muted text-center text-fg text-sm font-bold ${
                scoreDisabled ? 'opacity-40' : ''
              }`}
              keyboardType="numeric"
              editable={!scoreDisabled}
              value={homePred !== null ? String(homePred) : ''}
              onChangeText={(txt) => onChangeHomeScore && onChangeHomeScore(txt)}
              placeholder="—"
              placeholderTextColor="#5F6B82"
              maxLength={2}
            />
            <Text className="text-fg-subtle text-xs">:</Text>
            <TextInput
              className={`w-9 h-7 rounded-md border border-border bg-surface-muted text-center text-fg text-sm font-bold ${
                scoreDisabled ? 'opacity-40' : ''
              }`}
              keyboardType="numeric"
              editable={!scoreDisabled}
              value={awayPred !== null ? String(awayPred) : ''}
              onChangeText={(txt) => onChangeAwayScore && onChangeAwayScore(txt)}
              placeholder="—"
              placeholderTextColor="#5F6B82"
              maxLength={2}
            />
          </View>
        </View>
      )}
    </View>
  );
}
