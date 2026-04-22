import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Task } from '../models';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
}

export default function TaskCard({ task, onToggleComplete }: TaskCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, task.isCompleted && styles.completed]}
      onPress={() => onToggleComplete(task.id)}
      activeOpacity={0.8}
    >
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: categoryColor(task.category) }]} />
        <Text style={[styles.title, task.isCompleted && styles.strikethrough]}>
          {task.title}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.meta}>{task.category}</Text>
        {task.deadline && (
          <Text style={styles.meta}>
            {new Date(task.deadline).toLocaleDateString()}
          </Text>
        )}
        <Text style={styles.score}>⚡ {task.priorityScore}</Text>
      </View>
    </TouchableOpacity>
  );
}

function categoryColor(category: Task['category']): string {
  const colors: Record<Task['category'], string> = {
    work: '#4f8ef7',
    personal: '#a78bfa',
    health: '#34d399',
    social: '#fb923c',
    relationship: '#f472b6',
    legal: '#f87171',
    routine: '#94a3b8',
  };
  return colors[category];
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1c1c2e',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    gap: 8,
  },
  completed: {
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e2f0',
    flex: 1,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#555577',
  },
  meta: {
    fontSize: 12,
    color: '#8888aa',
    textTransform: 'capitalize',
  },
  score: {
    fontSize: 12,
    color: '#f5c842',
    marginLeft: 'auto',
  },
});
