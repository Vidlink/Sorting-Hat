import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const ACCENT = '#2563EB';

export default function OnboardingScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.hat}>🎩</Text>
        <Text style={styles.title}>Sorting Hat</Text>
        <Text style={styles.tagline}>
          Speak your tasks. We handle the rest.
        </Text>

        <View style={styles.infoList}>
          <InfoLine
            icon="mic-outline"
            title="Capture tasks by voice"
            body="Just talk — no typing, no forms, no friction."
          />
          <InfoLine
            icon="sparkles-outline"
            title="AI understands context"
            body="Each task is sorted and scored automatically."
          />
          <InfoLine
            icon="flash-outline"
            title="Always know what matters"
            body="Your top priorities surface at the top of the list."
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace('ConnectAccounts')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── InfoLine ─────────────────────────────────────────────────────────────────

interface InfoLineProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
}

function InfoLine({ icon, title, body }: InfoLineProps) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={22} color={ACCENT} style={styles.infoIcon} />
      <View style={styles.infoText}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoBody}>{body}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'space-between',
  },
  content: {
    paddingHorizontal: 32,
    paddingTop: 40,
    alignItems: 'center',
  },
  hat: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  tagline: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
  },
  infoList: {
    marginTop: 48,
    gap: 28,
    alignSelf: 'stretch',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingHorizontal: 4,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  infoBody: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },

  footer: {
    paddingHorizontal: 28,
    paddingBottom: 28,
  },
  button: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
