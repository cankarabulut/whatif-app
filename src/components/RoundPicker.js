// src/components/RoundPicker.js
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    Text,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

export default function RoundPicker({ rounds, round, onChange, lang }) {
  const [modalVisible, setModalVisible] = useState(false);
  const tr = lang === 'tr';

  const label = round ? `${tr ? 'Hafta' : 'Week'} ${round}` : tr ? 'Hafta' : 'Week';

  const canPrev = round != null && rounds.indexOf(round) > 0;
  const canNext =
    round != null && rounds.indexOf(round) >= 0 && rounds.indexOf(round) < rounds.length - 1;

  const handleSelectRound = (r) => {
    setModalVisible(false);
    onChange(r);
  };

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 10,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        {/* Prev button */}
        <Pressable
          onPress={() => {
            if (!canPrev) return;
            const idx = rounds.indexOf(round);
            if (idx > 0) onChange(rounds[idx - 1]);
          }}
          disabled={!canPrev}
          style={{
            width: 40,
            height: 32,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: '#111827',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: canPrev ? 1 : 0.4,
            backgroundColor: '#020617',
          }}
        >
          <Text style={{ color: '#e5e7eb', fontSize: 16 }}>{'<'}</Text>
        </Pressable>

        {/* Label + dropdown */}
        <Pressable
          onPress={() => {
            if (!rounds.length) return;
            setModalVisible(true);
          }}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            borderWidth: 1,
            borderColor: '#111827',
            backgroundColor: '#020617',
            paddingVertical: 8,
            paddingHorizontal: 16,
          }}
        >
          <Text
            style={{
              color: '#e5e7eb',
              fontSize: 14,
              marginRight: 4,
            }}
          >
            {label}
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>▼</Text>
        </Pressable>

        {/* Next button */}
        <Pressable
          onPress={() => {
            if (!canNext) return;
            const idx = rounds.indexOf(round);
            if (idx < rounds.length - 1) onChange(rounds[idx + 1]);
          }}
          disabled={!canNext}
          style={{
            width: 40,
            height: 32,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: '#111827',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: canNext ? 1 : 0.4,
            backgroundColor: '#020617',
          }}
        >
          <Text style={{ color: '#e5e7eb', fontSize: 16 }}>{'>'}</Text>
        </Pressable>
      </View>

      {/* Dropdown modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
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
                  {tr ? 'Hafta seç' : 'Select week'}
                </Text>

                <FlatList
                  data={rounds}
                  keyExtractor={(item) => String(item)}
                  renderItem={({ item }) => {
                    const isActive = item === round;
                    return (
                      <Pressable
                        onPress={() => handleSelectRound(item)}
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
                          {tr ? `Hafta ${item}` : `Week ${item}`}
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