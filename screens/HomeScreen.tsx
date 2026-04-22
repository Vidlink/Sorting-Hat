import React, { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
const USER_NAME = 'Alex';
const MAX_VISIBLE = 5;

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

// ─── Sub-components ───────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface TaskCardProps {
  task: Task;
  rank: number;
  onToggle: (id: string) => void;
}

function TaskCard({ task, rank, onToggle }: TaskCardProps) {
  const badge = CATEGORY_COLORS[task.category];

  return (
    <View style={[styles.card, task.isCompleted && styles.cardDimmed]}>
      {/* Rank */}
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>

      {/* Content */}
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

      {/* Checkbox */}
      <TouchableOpacity
        style={[styles.checkbox, task.isCompleted && styles.checkboxChecked]}
        onPress={() => onToggle(task.id)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {task.isCompleted && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: Props) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  const topTasks = [...tasks]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, MAX_VISIBLE);

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
    );
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
            {/* Greeting */}
            <View style={styles.header}>
              <Text style={styles.greeting}>
                {greeting()}, {USER_NAME} 👋
              </Text>
              <Text style={styles.date}>{formattedDate()}</Text>
            </View>

            {/* Section heading */}
            <Text style={styles.sectionHeading}>Today's Top Priorities</Text>
          </>
        }
        renderItem={({ item, index }) => (
          <TaskCard task={item} rank={index + 1} onToggle={toggleTask} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎙️</Text>
            <Text style={styles.emptyText}>
              No tasks yet. Tap the mic to add your first task.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating mic button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Record')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>🎙️</Text>
      </TouchableOpacity>
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
    paddingBottom: 100,
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

  // Section
  sectionHeading: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 28,
    marginBottom: 14,
    letterSpacing: 0.1,
  },

  // Cards
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
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

  // Checkbox
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
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 260,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 36,
    right: 24,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 26,
  },
});
