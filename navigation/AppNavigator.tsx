import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import RecordScreen from '../screens/RecordScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ConnectAccountsScreen from '../screens/ConnectAccountsScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';

/**
 * Strongly-typed param list for every screen in the stack.
 * Import this type in screens to get typed `route.params` and `navigation`.
 */
export type RootStackParamList = {
  Onboarding: undefined;
  ConnectAccounts: undefined;
  Home: undefined;
  Record: undefined;
  TaskDetail: { taskId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const defaultScreenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: '#F8FAFC' },
  headerTintColor: '#0F172A',
  headerTitleStyle: { fontWeight: '600' },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: '#F8FAFC' },
  animation: 'slide_from_right',
};

export default function AppNavigator() {
  /**
   * Replace this boolean with a persisted value (e.g. AsyncStorage) once
   * you add a real onboarding flow. Flip to `true` to skip onboarding during
   * development.
   */
  const [hasOnboarded] = useState<boolean>(false);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={hasOnboarded ? 'Home' : 'Onboarding'}
        screenOptions={defaultScreenOptions}
      >
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConnectAccounts"
          component={ConnectAccountsScreen}
          options={{ title: '', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Record"
          component={RecordScreen}
          options={{
            title: 'New Task',
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#94A3B8',
            headerTitleStyle: { color: '#F1F5F9', fontWeight: '600' },
            contentStyle: { backgroundColor: '#0F172A' },
          }}
        />
        <Stack.Screen
          name="TaskDetail"
          component={TaskDetailScreen}
          options={{ title: 'Task Detail' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
