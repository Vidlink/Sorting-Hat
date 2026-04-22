import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sorting Hat</Text>
      <Text style={styles.subtitle}>Your voice-first task manager</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f1a',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f5c842',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#8888aa',
    marginTop: 8,
  },
});
