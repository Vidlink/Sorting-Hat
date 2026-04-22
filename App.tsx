import { StatusBar } from 'expo-status-bar';
import AppNavigator from './navigation/AppNavigator';
import { initSupabase } from './services/supabaseService';

initSupabase();

export default function App() {
  return (
    <>
      <AppNavigator />
      <StatusBar style="light" />
    </>
  );
}
