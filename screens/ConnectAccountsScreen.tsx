import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ConnectAccounts'>;

type ConnectionId = 'email' | 'calendar';

const ACCENT = '#2563EB';

export default function ConnectAccountsScreen({ navigation }: Props) {
  const [connected, setConnected] = useState<Record<ConnectionId, boolean>>({
    email: false,
    calendar: false,
  });

  function toggleConnection(id: ConnectionId) {
    // TODO: trigger real OAuth flow (e.g. Gmail / Google Calendar / Outlook)
    setConnected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function finish() {
    navigation.replace('Home');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>Connect your accounts</Text>
        <Text style={styles.subtitle}>
          Sync your email and calendar so Sorting Hat can prioritise based on what's actually
          coming up in your life.
        </Text>

        <View style={styles.cards}>
          <ConnectRow
            icon="mail-outline"
            label="Connect Email"
            description="We'll scan for commitments and deadlines"
            connected={connected.email}
            onPress={() => toggleConnection('email')}
          />
          <ConnectRow
            icon="calendar-outline"
            label="Connect Calendar"
            description="Upcoming events inform task urgency"
            connected={connected.calendar}
            onPress={() => toggleConnection('calendar')}
          />
        </View>

        <View style={styles.privacyBox}>
          <Ionicons name="lock-closed-outline" size={16} color="#64748B" />
          <Text style={styles.privacyText}>
            We only read metadata. Your content never leaves your device unencrypted.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={finish} activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>
            {connected.email || connected.calendar ? 'Continue' : 'Skip for now'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── ConnectRow ───────────────────────────────────────────────────────────────

interface ConnectRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  description: string;
  connected: boolean;
  onPress: () => void;
}

function ConnectRow({ icon, label, description, connected, onPress }: ConnectRowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, connected && styles.rowConnected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.rowIcon, connected && styles.rowIconConnected]}>
        <Ionicons name={icon} size={22} color={connected ? '#FFFFFF' : ACCENT} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      {connected ? (
        <Ionicons name="checkmark-circle" size={24} color={ACCENT} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      )}
    </TouchableOpacity>
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
    paddingHorizontal: 28,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    marginTop: 10,
  },

  cards: {
    marginTop: 32,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowConnected: {
    borderColor: ACCENT,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconConnected: {
    backgroundColor: ACCENT,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  rowDesc: {
    fontSize: 13,
    color: '#94A3B8',
  },

  privacyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 4,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },

  footer: {
    padding: 28,
  },
  continueBtn: {
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
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
