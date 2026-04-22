import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getOrCreateAnonymousUser, createTask as createTaskInDB } from '../services/supabaseService';

// ─── Types ────────────────────────────────────────────────────────────────────

type RecordingState = 'idle' | 'recording';

type Props = NativeStackScreenProps<RootStackParamList, 'Record'>;

// ─── Constants ────────────────────────────────────────────────────────────────

const BLUE = '#2563EB';
const RED = '#EF4444';
const FAKE_TRANSCRIPT = 'Buy groceries and call the dentist tomorrow';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RecordScreen({ navigation }: Props) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcribedText, setTranscribedText] = useState('');

  const isRecording = recordingState === 'recording';

  // Pulse animation refs
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const recordingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start / stop pulse
  useEffect(() => {
    if (isRecording) {
      pulseAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.current.start();
    } else {
      pulseAnimation.current?.stop();
      Animated.timing(pulseScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      pulseAnimation.current?.stop();
    };
  }, [isRecording, pulseScale]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimer.current) clearTimeout(recordingTimer.current);
    };
  }, []);

  function handleMicPress() {
    if (recordingState === 'idle') {
      setTranscribedText('');
      setRecordingState('recording');

      // Simulate a 3-second recording then auto-stop
      recordingTimer.current = setTimeout(() => {
        setTranscribedText(FAKE_TRANSCRIPT);
        setRecordingState('idle');
      }, 3000);
    } else {
      // Manual stop before the timer fires
      if (recordingTimer.current) clearTimeout(recordingTimer.current);
      setTranscribedText(FAKE_TRANSCRIPT);
      setRecordingState('idle');
    }
  }

  async function handleSave() {
    const title = transcribedText.trim();
    if (!title) return;
    console.log('[RecordScreen] handleSave — transcript:', title);

    try {
      const user = await getOrCreateAnonymousUser();
      const row = await createTaskInDB({
        user_id: user.id,
        title,
        category: 'personal',
        deadline: null,
        priority_score: 0,
        is_completed: false,
        notes: null,
      });
      console.log('[RecordScreen] ✅ Task saved to Supabase — id:', row.id);
    } catch (e) {
      console.error('[RecordScreen] ❌ Supabase save failed:', e);
    }

    navigation.navigate('Home');
  }

  const hasText = transcribedText.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Transcription box ── */}
      <View style={styles.transcriptBox}>
        <Text style={[styles.transcriptText, !hasText && !isRecording && styles.placeholder]}>
          {isRecording && !transcribedText
            ? 'Listening…'
            : transcribedText || 'Tap to record your task…'}
        </Text>
      </View>

      {/* ── Centre section ── */}
      <View style={styles.centre}>
        {/* Outer glow ring (only while recording) */}
        {isRecording && (
          <Animated.View
            style={[
              styles.glowRing,
              { transform: [{ scale: pulseScale }] },
            ]}
          />
        )}

        {/* Mic button */}
        <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
          <TouchableOpacity
            style={[styles.micButton, isRecording && styles.micButtonRecording]}
            onPress={handleMicPress}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={48}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Label */}
        <Text style={styles.tapLabel}>
          {isRecording ? 'Tap to stop' : 'Tap to start'}
        </Text>
      </View>

      {/* ── Save button ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, !hasText && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasText}
          activeOpacity={0.85}
        >
          <Text style={[styles.saveButtonText, !hasText && styles.saveButtonTextDisabled]}>
            Save Task
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },

  // Transcript
  transcriptBox: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    minHeight: 120,
    justifyContent: 'center',
  },
  transcriptText: {
    fontSize: 17,
    color: '#F1F5F9',
    lineHeight: 26,
    fontWeight: '500',
  },
  placeholder: {
    color: '#475569',
    fontWeight: '400',
  },

  // Centre
  centre: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  glowRing: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  micButtonRecording: {
    backgroundColor: RED,
    shadowColor: RED,
  },
  tapLabel: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Footer
  footer: {
    paddingTop: 8,
  },
  saveButton: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#1E293B',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  saveButtonTextDisabled: {
    color: '#334155',
  },
});
