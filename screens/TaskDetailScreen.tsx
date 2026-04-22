import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskDetail'>;

export default function TaskDetailScreen({ route, navigation }: Props) {
  const { taskId } = route.params;

  // TODO: look up full task from taskService.getTasks() by taskId
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Task ID</Text>
        <Text style={styles.value}>{taskId}</Text>
        <Text style={styles.placeholder}>Full task details coming soon.</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    padding: 24,
    gap: 20,
  },
  card: {
    backgroundColor: '#1c1c2e',
    borderRadius: 16,
    padding: 20,
    gap: 8,
    marginTop: 16,
  },
  label: {
    fontSize: 12,
    color: '#8888aa',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: 16,
    color: '#e2e2f0',
    fontWeight: '600',
  },
  placeholder: {
    fontSize: 14,
    color: '#555577',
    marginTop: 8,
  },
  button: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1c1c2e',
    borderRadius: 10,
  },
  buttonText: {
    color: '#f5c842',
    fontSize: 15,
    fontWeight: '600',
  },
});
