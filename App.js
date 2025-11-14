// App.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStateProvider, useAppState } from './src/context/AppStateContext';
import FixturesScreen from './src/screens/FixturesScreen';
import StandingsScreen from './src/screens/StandingsScreen';

const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { lang } = useAppState();
  const t = (en, tr) => (lang === 'tr' ? tr : en);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#020617', borderTopColor: '#111827' },
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: '#6b7280',
      }}
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
          <TabNavigator />
        </NavigationContainer>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}