// src/components/TeamLogo.js
import React from 'react';
import { View, Text } from 'react-native';

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickColor(name) {
  const colors = ['#f97316', '#22c55e', '#3b82f6', '#eab308', '#ec4899', '#a855f7'];
  const h = hashString(name);
  return colors[h % colors.length];
}

export default function TeamLogo({ name, size = 26 }) {
  // Bazı provider'lar takım ismini göndermeyebilir; crash olmaması için guard
  const safeName =
    typeof name === 'string' && name.trim().length > 0 ? name : '?';

  const initials = safeName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const bg = pickColor(safeName);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
      }}
    >
      <Text
        style={{
          color: '#0f172a',
          fontSize: size * 0.45,
          fontWeight: '700',
        }}
      >
        {initials}
      </Text>
    </View>
  );
}