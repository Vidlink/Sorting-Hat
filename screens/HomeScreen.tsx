import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  title: string;
  category: 'work' | 'personal' | 'health' | 'social' | 'relationship' | 'legal' | 'routine';
  deadline?: Date;
  priorityScore: number;
  isCompleted: boolean;
  createdAt: Date;
}

// ─── Dummy data ───────────────────────────────────────────────────────────────

const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Submit quarterly tax documents',
    category: 'legal',
    deadline: new Date(Date.now() + 86_400_000),
    priorityScore: 92,
    isCompleted: false,
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Prepare slides for Monday stand-up',
    category: 'work',
    deadline: new Date(Date.now() + 2 * 86_400_000),
    priorityScore: 78,
    isCompleted: false,
    createdAt: new Date(),
  },
  {
    id: '3',
    title: 'Book dentist appointment',
    category: 'health',
    priorityScore: 55,
    isCompleted: false,
    createdAt: new Date(),
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = '#2563EB';
const RED = '#EF4444';
const GREEN = '#10B981';
const USER_NAME = 'Alex';
const MAX_VISIBLE = 5;
const FAKE_TRANSCRIPT = 'Buy groceries and call the dentist tomorrow';

const CATEGORY_COLORS: Record<Task['category'], { bg: string; text: string }> = {
  work:         { bg: '#DBEAFE', text: '#1D4ED8' },
  personal:     { bg: '#EDE9FE', text: '#6D28D9' },
  health:       { bg: '#D1FAE5', text: '#065F46' },
  social:       { bg: '#FEF3C7', text: '#92400E' },
  relationship: { bg: '#FCE7F3', text: '#9D174D' },
  legal:        { bg: '#FEE2E2', text: '#991B1B' },
  routine:      { bg: '#F1F5F9', text: '#475569' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── SwipeableTaskCard ────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  rank: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}

function SwipeableTaskCard({ task, rank, onToggle, onDelete, onArchive }: TaskCardProps) {
  const badge = CATEGORY_COLORS[task.category];
  const swipeableRef = useRef<Swipeable>(null);

  // Right action = swipe LEFT (iMessage-style delete)
  function renderRightAction() {
    return (
      <RectButton
        style={styles.swipeActionDelete}
        onPress={() => {
          swipeableRef.current?.close();
          onDelete(task.id);
        }}
      >
        <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
        <Text style={styles.swipeActionLabel}>Delete</Text>
      </RectButton>
    );
  }

  // Left action = swipe RIGHT (archive)
  function renderLeftAction() {
    return (
      <RectButton
        style={styles.swipeActionArchive}
        onPress={() => {
          swipeableRef.current?.close();
          onArchive(task.id);
        }}
      >
        <Ionicons name="archive-outline" size={22} color="#FFFFFF" />
        <Text style={styles.swipeActionLabel}>Archive</Text>
      </RectButton>
    );
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightAction}
      renderLeftActions={renderLeftAction}
      overshootLeft={false}
      overshootRight={false}
      friction={2}
      leftThreshold={80}
      rightThreshold={80}
      containerStyle={styles.swipeContainer}
    >
      <View style={[styles.card, task.isCompleted && styles.cardDimmed]}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>

        <View style={styles.cardBody}>
          <Text
            style={[styles.taskTitle, task.isCompleted && styles.taskTitleStruck]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          <View style={[styles.categoryBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.categoryText, { color: badge.text }]}>
              {task.category}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.checkbox, task.isCompleted && styles.checkboxChecked]}
          onPress={() => onToggle(task.id)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {task.isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
}

// ─── AddTaskModal ─────────────────────────────────────────────────────────────

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string) => void;
}

function AddTaskModal({ visible, onClose, onAdd }: AddTaskModalProps) {
  const [text, setText] = useState('');

  function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText('');
    onClose();
  }

  function handleClose() {
    setText('');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKAV}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Task</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="What do you need to do?"
              placeholderTextColor="#94A3B8"
              value={text}
              onChangeText={setText}
              autoFocus
              multiline
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={handleAdd}
            />

            <TouchableOpacity
              style={[styles.modalAddBtn, !text.trim() && styles.modalAddBtnDisabled]}
              onPress={handleAdd}
              disabled={!text.trim()}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.modalAddBtnText, !text.trim() && styles.modalAddBtnTextDisabled]}
              >
                Add Task
              </Text>
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
type RecordState = 'idle' | 'recording' | 'review';

export default function HomeScreen({ navigation: _navigation }: Props) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Inline voice-capture state
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [transcribedText, setTranscribedText] = useState('');
  const recordingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef<Animated.CompositeAnimation | null>(null);

  const isOverlayVisible = recordState !== 'idle';
  const isRecording = recordState === 'recording';

  // Fade overlay in/out
  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: isOverlayVisible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isOverlayVisible, overlayOpacity]);

  // Pulse while recording
  useEffect(() => {
    if (isRecording) {
      pulseAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.18, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulseAnim.current.start();
    } else {
      pulseAnim.current?.stop();
      Animated.timing(pulseScale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
    return () => pulseAnim.current?.stop();
  }, [isRecording, pulseScale]);

  // Timer cleanup
  useEffect(() => {
    return () => {
      if (recordingTimer.current) clearTimeout(recordingTimer.current);
    };
  }, []);

  const topTasks = [...tasks]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, MAX_VISIBLE);

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
    );
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function archiveTask(id: string) {
    // TODO: wire to a real archive store; for now mark completed
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted: true } : t))
    );
  }

  function addTypedTask(title: string) {
    setTasks((prev) => [
      ...prev,
      {
        id: generateId(),
        title,
        category: 'personal',
        priorityScore: 0,
        isCompleted: false,
        createdAt: new Date(),
      },
    ]);
  }

  // ── Voice-capture handlers ──
  function startRecording() {
    setTranscribedText('');
    setRecordState('recording');
    // Simulate a 3-second recording
    recordingTimer.current = setTimeout(() => {
      setTranscribedText(FAKE_TRANSCRIPT);
      setRecordState('review');
    }, 3000);
  }

  function stopRecording() {
    if (recordingTimer.current) clearTimeout(recordingTimer.current);
    setTranscribedText(FAKE_TRANSCRIPT);
    setRecordState('review');
  }

  function cancelRecording() {
    if (recordingTimer.current) clearTimeout(recordingTimer.current);
    setTranscribedText('');
    setRecordState('idle');
  }

  function saveRecording() {
    if (!transcribedText.trim()) return;
    addTypedTask(transcribedText.trim());
    setTranscribedText('');
    setRecordState('idle');
  }

  function handleMicPress() {
    if (recordState === 'idle') startRecording();
    else if (recordState === 'recording') stopRecording();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <FlatList
        data={topTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.greeting}>
                {greeting()}, {USER_NAME} 👋
              </Text>
              <Text style={styles.date}>{formattedDate()}</Text>
            </View>
            <Text style={styles.sectionHeading}>Today's Top Priorities</Text>
          </>
        }
        renderItem={({ item, index }) => (
          <SwipeableTaskCard
            task={item}
            rank={index + 1}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onArchive={archiveTask}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              No tasks yet. Tap the mic to add your first task.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* ── Bottom bar (hidden while overlay is open) ── */}
      {!isOverlayVisible && (
        <View style={styles.bottomBar} pointerEvents="box-none">
          {/* Bigger grey mic button — centre — opens inline record overlay */}
          <TouchableOpacity
            style={styles.micBtn}
            onPress={startRecording}
            activeOpacity={0.8}
          >
            <Ionicons name="mic-outline" size={30} color="#475569" />
          </TouchableOpacity>

          {/* Blue + FAB — right — opens type-to-add modal */}
          <TouchableOpacity
            style={styles.plusFab}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Inline record overlay (dims page, transcript at top) ── */}
      {isOverlayVisible && (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.recordOverlay, { opacity: overlayOpacity }]}
        >
          {/* Dim — tap outside to cancel */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={recordState === 'review' ? cancelRecording : undefined}
          />

          {/* Transcript box at top */}
          <SafeAreaView style={styles.overlayTop} pointerEvents="box-none">
            <View style={styles.transcriptCard} pointerEvents="auto">
              <View style={styles.transcriptHeader}>
                {isRecording && <View style={styles.recDot} />}
                <Text style={styles.transcriptHeading}>
                  {isRecording ? 'Listening…' : 'Transcript'}
                </Text>
              </View>
              <Text style={[styles.transcriptText, !transcribedText && styles.transcriptPlaceholder]}>
                {transcribedText || (isRecording ? 'Speak now…' : '')}
              </Text>

              {recordState === 'review' && (
                <View style={styles.reviewButtons}>
                  <TouchableOpacity
                    style={styles.reviewBtnSecondary}
                    onPress={cancelRecording}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.reviewBtnSecondaryText}>Discard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.reviewBtnPrimary}
                    onPress={saveRecording}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.reviewBtnPrimaryText}>Save Task</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </SafeAreaView>

          {/* Recording controls — stop button in the same spot as the mic */}
          {isRecording && (
            <View style={styles.overlayBottom} pointerEvents="box-none">
              <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
                <TouchableOpacity
                  style={styles.stopBtn}
                  onPress={stopRecording}
                  activeOpacity={0.85}
                >
                  <Ionicons name="stop" size={30} color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.View>
              <Text style={styles.stopLabel}>Tap to stop</Text>
            </View>
          )}
        </Animated.View>
      )}

      <AddTaskModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={addTypedTask}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },

  // Header
  header: {
    paddingTop: 28,
    paddingBottom: 4,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  date: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '400',
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 28,
    marginBottom: 14,
    letterSpacing: 0.1,
  },

  // Swipe wrapper — keeps rounded corners & spacing consistent
  swipeContainer: {
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },

  // Swipe actions
  swipeActionDelete: {
    backgroundColor: RED,
    justifyContent: 'center',
    alignItems: 'center',
    width: 92,
    flexDirection: 'column',
    gap: 2,
  },
  swipeActionArchive: {
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    width: 92,
    flexDirection: 'column',
    gap: 2,
  },
  swipeActionLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Cards
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardDimmed: {
    opacity: 0.45,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cardBody: {
    flex: 1,
    gap: 6,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 21,
  },
  taskTitleStruck: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 260,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  plusFab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },

  // Inline record overlay
  recordOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  overlayTop: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  transcriptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: RED,
  },
  transcriptHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  transcriptText: {
    fontSize: 17,
    color: '#0F172A',
    lineHeight: 26,
    fontWeight: '500',
    minHeight: 52,
  },
  transcriptPlaceholder: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  reviewButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  reviewBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  reviewBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  reviewBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: ACCENT,
    alignItems: 'center',
  },
  reviewBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
  },
  stopBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: RED,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  stopLabel: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Add-task modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalKAV: {
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalAddBtn: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalAddBtnDisabled: {
    backgroundColor: '#F1F5F9',
    shadowOpacity: 0,
    elevation: 0,
  },
  modalAddBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalAddBtnTextDisabled: {
    color: '#94A3B8',
  },
});
