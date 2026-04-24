import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import TeamLogo from './TeamLogo';

export default function MatchCard({
  fixture,
  selectedOutcome,
  score,
  onSelectOutcome,
  onChangeHomeScore,
  onChangeAwayScore,
}) {
  const home = fixture.home;
  const away = fixture.away;

  const scoreHomeActual = fixture.score?.fullTime?.home ?? null;
  const scoreAwayActual = fixture.score?.fullTime?.away ?? null;

  const hasScore =
    fixture.status === 'FINISHED' &&
    typeof scoreHomeActual === 'number' &&
    typeof scoreAwayActual === 'number';

  const dateObj = new Date(fixture.utcDate);
  const dateStr = dateObj.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const homePred = score?.home ?? null;
  const awayPred = score?.away ?? null;

  const outcomeDisabled = homePred !== null || awayPred !== null;
  const scoreDisabled = !!selectedOutcome;

  return (
    <View
      style={{
        backgroundColor: '#020617',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#111827',
      }}
    >
      <Text style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 6 }}>{dateStr}</Text>

      <View style={{ marginBottom: 8 }}>
        {/* HOME ROW */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <TeamLogo name={home} />
          <Text style={{ color: 'white', flex: 1 }}>{home}</Text>

          <TextInput
            style={{
              width: 40,
              height: 32,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#1f2937',
              color: scoreDisabled ? '#4b5563' : '#e5e7eb',
              textAlign: 'center',
              marginLeft: 8,
            }}
            keyboardType="numeric"
            editable={!scoreDisabled}
            value={homePred !== null ? String(homePred) : ''}
            onChangeText={(txt) => onChangeHomeScore && onChangeHomeScore(txt)}
            placeholder="-"
            placeholderTextColor="#4b5563"
          />
        </View>

        {/* AWAY ROW */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TeamLogo name={away} />
          <Text style={{ color: 'white', flex: 1 }}>{away}</Text>

          <TextInput
            style={{
              width: 40,
              height: 32,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#1f2937',
              color: scoreDisabled ? '#4b5563' : '#e5e7eb',
              textAlign: 'center',
              marginLeft: 8,
            }}
            keyboardType="numeric"
            editable={!scoreDisabled}
            value={awayPred !== null ? String(awayPred) : ''}
            onChangeText={(txt) => onChangeAwayScore && onChangeAwayScore(txt)}
            placeholder="-"
            placeholderTextColor="#4b5563"
          />
        </View>
      </View>

      {/* Gerçek skor (varsa) sadece bilgi amaçlı */}
      {hasScore && (
        <Text
          style={{
            color: '#f97316',
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 4,
          }}
        >
          Final score: {scoreHomeActual} - {scoreAwayActual}
        </Text>
      )}

      {/* 1 / X / 2 tahmin butonları, her zaman göster */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 4,
        }}
      >
        {['1', 'X', '2'].map((opt) => {
          const isSelected = selectedOutcome === opt;
          const disabled = outcomeDisabled && !isSelected;
          return (
            <Pressable
              key={opt}
              disabled={disabled}
              onPress={() => {
                if (!onSelectOutcome) return;
                onSelectOutcome(opt);
              }}
              style={{
                backgroundColor: isSelected ? '#f97316' : '#111827',
                opacity: disabled ? 0.4 : 1,
                paddingVertical: 6,
                paddingHorizontal: 18,
                borderRadius: 999,
              }}
            >
              <Text
                style={{
                  color: isSelected ? '#0f172a' : '#E5E7EB',
                  fontSize: 15,
                  fontWeight: isSelected ? '700' : '400',
                }}
              >
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}