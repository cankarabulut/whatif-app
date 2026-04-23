// src/components/StandingsRow.js
import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TeamLogo from './TeamLogo';

function zoneBorderClass(league, rank, total) {
  if (!league || league === 'CL') return 'border-l-transparent';
  if (rank <= 4) return 'border-l-zone-ucl';
  if (rank === 5) return 'border-l-zone-uel';
  if (rank === 6) return 'border-l-zone-uec';
  if (rank > total - 3) return 'border-l-zone-relegate';
  return 'border-l-transparent';
}

export default function StandingsRow({
  item,
  rank,
  previousRank,
  pointsToShow,
  total,
  league,
  showMovement,
}) {
  const accent = zoneBorderClass(league, rank, total);

  let arrow = null;
  let arrowColor = '#9CA7BE';
  if (showMovement && previousRank != null) {
    if (rank < previousRank) {
      arrow = 'arrow-up';
      arrowColor = '#22C55E';
    } else if (rank > previousRank) {
      arrow = 'arrow-down';
      arrowColor = '#EF4444';
    }
  }

  const gdColor =
    item.goalDiff > 0
      ? 'text-success'
      : item.goalDiff < 0
      ? 'text-danger'
      : 'text-fg-muted';

  return (
    <View
      className={`flex-row items-center py-2 px-2 border-b border-border-subtle border-l-2 ${accent}`}
    >
      <Text className="w-6 text-fg-muted text-xs font-semibold tabular-nums">
        {rank}
      </Text>

      {showMovement ? (
        <View className="w-8 flex-row items-center justify-center">
          {arrow ? (
            <>
              <Ionicons name={arrow} size={10} color={arrowColor} />
              <Text className="text-fg text-[10px] font-semibold ml-0.5 tabular-nums">
                {previousRank}
              </Text>
            </>
          ) : null}
        </View>
      ) : null}

      <TeamLogo name={item.team} size={22} />
      <Text className="text-fg text-xs font-medium flex-1" numberOfLines={1}>
        {item.team}
      </Text>

      <Text className="w-7 text-right text-fg-muted text-[11px] tabular-nums">
        {item.played}
      </Text>
      <Text className="w-7 text-right text-fg-muted text-[11px] tabular-nums">
        {item.won}
      </Text>
      <Text className="w-7 text-right text-fg-muted text-[11px] tabular-nums">
        {item.draw}
      </Text>
      <Text className="w-7 text-right text-fg-muted text-[11px] tabular-nums">
        {item.lost}
      </Text>
      <Text className={`w-9 text-right text-[11px] tabular-nums ${gdColor}`}>
        {item.goalDiff > 0 ? `+${item.goalDiff}` : item.goalDiff}
      </Text>
      <Text className="w-10 text-right text-fg text-xs font-bold tabular-nums">
        {pointsToShow}
      </Text>
    </View>
  );
}
