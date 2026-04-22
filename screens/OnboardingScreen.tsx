import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.hat}>🎩</Text>
      <Text style={styles.title}>Sorting Hat</Text>
      <Text style={styles.tagline}>Speak your tasks.{'\n'}We handle the rest.</Text>

      <View style={styles.features}>
        <FeatureRow icon="🎙️" text="Record tasks by voice in seconds" />
        <FeatureRow icon="🤖" text="AI scores and prioritises for you" />
        <FeatureRow icon="⚡" text="Always know what to tackle next" />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace('Home')}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  hat: {
    fontSize: 72,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#f5c842',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 18,
    color: '#c0c0d8',
    textAlign: 'center',
    lineHeight: 28,
    marginTop: 8,
    marginBottom: 24,
  },
  features: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1c1c2e',
    borderRadius: 12,
    padding: 14,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 15,
    color: '#c0c0d8',
    flex: 1,
  },
  button: {
    backgroundColor: '#f5c842',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f0f1a',
  },
});
