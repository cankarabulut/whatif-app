// App.js
import './global.css';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { AppStateProvider, useAppState } from './src/context/AppStateContext';
import FixturesScreen from './src/screens/FixturesScreen';
import StandingsScreen from './src/screens/StandingsScreen';

const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { lang } = useAppState();
  const t = (en, tr) => (lang === 'tr' ? tr : en);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F1522',
          borderTopColor: '#1F2A3C',
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#5F6B82',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, focused }) => {
          const name =
            route.name === 'Fixtures'
              ? focused
                ? 'football'
                : 'football-outline'
              : focused
              ? 'podium'
              : 'podium-outline';
          return <Ionicons name={name} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Fixtures"
        component={FixturesScreen}
        options={{ tabBarLabel: t('Fixtures', 'Fikstür') }}
      />
      <Tab.Screen
        name="Standings"
        component={StandingsScreen}
        options={{ tabBarLabel: t('Standings', 'Puan Durumu') }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <TabNavigator />
        </NavigationContainer>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
