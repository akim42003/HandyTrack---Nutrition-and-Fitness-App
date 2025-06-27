import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { CalendarPicker } from '../../src/components/CalendarPicker';
import { ExerciseEntry, ExerciseSet, WorkoutSession, UserProfile } from '../../src/types';
import { getExerciseEntries, getWorkoutSessions, saveExerciseEntry, saveWorkoutSession, updateWorkoutSession, deleteWorkoutSession, getUserProfile } from '../../src/utils/storage';
import { formatWeight, parseWeight, getDisplayWeight } from '../../src/utils/unitConversions';

export default function ExerciseScreen() {
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutSession | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutSession | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showWorkoutTitleModal, setShowWorkoutTitleModal] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState('');

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const sessions = await getWorkoutSessions();
      setWorkoutSessions(sessions);
      
      const profile = await getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading workouts:', error);
    }
  };

  const openWorkoutTitleModal = () => {
    const defaultTitle = `Workout ${new Date().toLocaleDateString()}`;
    setWorkoutTitle(defaultTitle);
    setShowWorkoutTitleModal(true);
  };

  const startNewWorkout = () => {
    if (!workoutTitle.trim()) {
      Alert.alert('Error', 'Please enter a workout title');
      return;
    }
    
    const newWorkout: WorkoutSession = {
      id: Date.now().toString(),
      date: selectedDate,
      name: workoutTitle.trim(),
      exercises: [],
    };
    setCurrentWorkout(newWorkout);
    setShowWorkoutTitleModal(false);
    setWorkoutTitle('');
  };

  const addExerciseToWorkout = () => {
    if (!currentWorkout || !newExerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    const newExercise: ExerciseEntry = {
      id: Date.now().toString(),
      exerciseId: newExerciseName.toLowerCase().replace(/\s+/g, '_'),
      date: selectedDate,
      sets: [],
      type: 'straight',
    };

    setCurrentWorkout({
      ...currentWorkout,
      exercises: [...currentWorkout.exercises, newExercise],
    });

    setNewExerciseName('');
    setShowAddExercise(false);
  };

  const addSetToExercise = (exerciseIndex: number) => {
    if (!currentWorkout) return;

    const newSet: ExerciseSet = {
      id: Date.now().toString(),
      reps: 0,
      weight: 0,
    };

    const updatedExercises = [...currentWorkout.exercises];
    updatedExercises[exerciseIndex].sets.push(newSet);

    setCurrentWorkout({
      ...currentWorkout,
      exercises: updatedExercises,
    });
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight' | 'rpe', value: string) => {
    if (!currentWorkout) return;

    const updatedExercises = [...currentWorkout.exercises];
    const numValue = parseFloat(value) || 0;
    
    if (field === 'reps') {
      updatedExercises[exerciseIndex].sets[setIndex].reps = Math.floor(numValue);
    } else if (field === 'weight') {
      // Convert weight from imperial to kg for storage
      const weightInKg = parseWeight(value, 'imperial');
      updatedExercises[exerciseIndex].sets[setIndex].weight = weightInKg;
    } else if (field === 'rpe') {
      updatedExercises[exerciseIndex].sets[setIndex].rpe = Math.min(10, Math.max(1, numValue));
    }

    setCurrentWorkout({
      ...currentWorkout,
      exercises: updatedExercises,
    });
  };

  const finishWorkout = async () => {
    if (!currentWorkout) return;

    try {
      if (editingWorkout) {
        // Update existing workout
        await updateWorkoutSession(currentWorkout);
        const sessions = await getWorkoutSessions();
        setWorkoutSessions(sessions);
        setEditingWorkout(null);
        Alert.alert('Success', 'Workout updated!');
      } else {
        // Save new workout
        await saveWorkoutSession(currentWorkout);
        setWorkoutSessions([...workoutSessions, currentWorkout]);
        Alert.alert('Success', 'Workout saved!');
      }
      setCurrentWorkout(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to save workout');
    }
  };

  const editWorkout = (workout: WorkoutSession) => {
    setEditingWorkout(workout);
    setCurrentWorkout(workout);
  };

  const confirmDeleteWorkout = (workoutId: string) => {
    setShowDeleteConfirm(workoutId);
  };

  const deleteWorkoutConfirmed = async () => {
    if (!showDeleteConfirm) return;
    
    try {
      await deleteWorkoutSession(showDeleteConfirm);
      const sessions = await getWorkoutSessions();
      setWorkoutSessions(sessions);
      setShowDeleteConfirm(null);
      Alert.alert('Success', 'Workout deleted');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete workout');
    }
  };

  const cancelCurrentWorkout = () => {
    setCurrentWorkout(null);
    setEditingWorkout(null);
  };

  const renderCurrentWorkout = () => {
    if (!currentWorkout) return null;

    return (
      <View style={styles.currentWorkout}>
        <View style={styles.workoutHeader}>
          <TextInput
            style={styles.workoutTitleInput}
            value={currentWorkout.name}
            onChangeText={(text) => setCurrentWorkout({...currentWorkout, name: text})}
            placeholder="Enter workout title"
            placeholderTextColor="#999"
          />
          <View style={styles.workoutActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelCurrentWorkout}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.finishButton} onPress={finishWorkout}>
              <Text style={styles.finishButtonText}>
                {editingWorkout ? 'Update' : 'Finish'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {currentWorkout.exercises.map((exercise, exerciseIndex) => (
          <View key={exercise.id} style={styles.exerciseSection}>
            <Text style={styles.exerciseName}>{exercise.exerciseId.replace(/_/g, ' ').toUpperCase()}</Text>
            
            {exercise.sets.map((set, setIndex) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={styles.setNumber}>{setIndex + 1}</Text>
                <TextInput
                  style={styles.setInput}
                  placeholder="Weight (lbs)"
                  value={set.weight > 0 ? getDisplayWeight(set.weight, 'imperial') : ''}
                  onChangeText={(value) => updateSet(exerciseIndex, setIndex, 'weight', value)}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.setLabel}>lbs</Text>
                <TextInput
                  style={styles.setInput}
                  placeholder="Reps"
                  value={set.reps > 0 ? set.reps.toString() : ''}
                  onChangeText={(value) => updateSet(exerciseIndex, setIndex, 'reps', value)}
                  keyboardType="numeric"
                />
                <Text style={styles.setLabel}>reps</Text>
                <TextInput
                  style={[styles.setInput, styles.rpeInput]}
                  placeholder="RPE"
                  value={set.rpe ? set.rpe.toString() : ''}
                  onChangeText={(value) => updateSet(exerciseIndex, setIndex, 'rpe', value)}
                  keyboardType="numeric"
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.addSetButton}
              onPress={() => addSetToExercise(exerciseIndex)}
            >
              <Text style={styles.addSetText}>+ Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addExerciseButton}
          onPress={() => setShowAddExercise(true)}
        >
          <Text style={styles.addExerciseText}>+ Add Exercise</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Exercise Tracking</Text>
            <TouchableOpacity 
              style={styles.calendarButton}
              onPress={() => setShowCalendar(true)}
            >
              <Text style={styles.calendarButtonText}>📅</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowCalendar(true)}
          >
            <Text style={styles.date}>{new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</Text>
          </TouchableOpacity>
          <Text style={styles.subtitle}>Advanced Manual Entry</Text>
        </View>

        {currentWorkout ? (
          renderCurrentWorkout()
        ) : (
          <View style={styles.startWorkoutContainer}>
            <TouchableOpacity style={styles.startWorkoutButton} onPress={openWorkoutTitleModal}>
              <Text style={styles.startWorkoutText}>Start New Workout</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Recent Workouts</Text>
          {workoutSessions.slice(-10).reverse().map((session) => (
            <View key={session.id} style={styles.historyItem}>
              <View style={styles.historyItemLeft}>
                <Text style={styles.historyDate}>{session.date}</Text>
                <Text style={styles.historyName}>{session.name}</Text>
                <Text style={styles.historyExercises}>
                  {session.exercises.length} exercises
                </Text>
              </View>
              <View style={styles.historyActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => editWorkout(session)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => confirmDeleteWorkout(session.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <CalendarPicker
        visible={showCalendar}
        selectedDate={selectedDate}
        onDateSelect={(date) => {
          setSelectedDate(date);
          setShowCalendar(false);
        }}
        onClose={() => setShowCalendar(false)}
      />

      <Modal visible={showWorkoutTitleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Workout</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Workout Title</Text>
              <TextInput
                style={styles.modalInput}
                value={workoutTitle}
                onChangeText={setWorkoutTitle}
                placeholder="Enter workout name"
                placeholderTextColor="#999"
                autoFocus
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]} 
                onPress={() => setShowWorkoutTitleModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.addButton]} onPress={startNewWorkout}>
                <Text style={styles.addButtonText}>Start Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddExercise} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Exercise name (e.g., Bench Press)"
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowAddExercise(false);
                  setNewExerciseName('');
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addExerciseToWorkout}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!showDeleteConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.deleteConfirmModal}>
            <Text style={styles.deleteConfirmTitle}>Delete Workout</Text>
            <Text style={styles.deleteConfirmText}>
              Are you sure you want to delete this workout session? This action cannot be undone.
            </Text>
            <View style={styles.deleteConfirmButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowDeleteConfirm(null)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmDeleteButton]}
                onPress={deleteWorkoutConfirmed}
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3c3c3c',
  },
  header: {
    backgroundColor: '#4a4a4a',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#6a6a6a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#c5c5c5',
  },
  startWorkoutContainer: {
    padding: 20,
    alignItems: 'center',
  },
  startWorkoutButton: {
    backgroundColor: '#a82828',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  startWorkoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  currentWorkout: {
    margin: 15,
    backgroundColor: '#4a4a4a',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 10,
  },
  finishButton: {
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  finishButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  exerciseSection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#6a6a6a',
    paddingBottom: 15,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  setNumber: {
    width: 30,
    fontSize: 16,
    fontWeight: '600',
  },
  setInput: {
    borderWidth: 1,
    borderColor: '#6a6a6a',
    borderRadius: 5,
    padding: 8,
    marginHorizontal: 5,
    textAlign: 'center',
    flex: 1,
  },
  rpeInput: {
    flex: 0.5,
  },
  setLabel: {
    fontSize: 12,
    color: '#c5c5c5',
    marginRight: 10,
  },
  addSetButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  addSetText: {
    color: '#a82828',
    fontWeight: '600',
  },
  addExerciseButton: {
    backgroundColor: '#a82828',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  addExerciseText: {
    color: '#fff',
    fontWeight: '600',
  },
  historySection: {
    margin: 15,
    backgroundColor: '#4a4a4a',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#6a6a6a',
  },
  historyItemLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    color: '#c5c5c5',
  },
  historyName: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  historyExercises: {
    fontSize: 12,
    color: '#c5c5c5',
    marginTop: 2,
  },
  historyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#a82828',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#4a4a4a',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#6a6a6a',
    borderRadius: 5,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
  },
  modalCancelButtonText: {
    color: '#c5c5c5',
  },
  addButton: {
    backgroundColor: '#a82828',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  deleteConfirmModal: {
    backgroundColor: '#4a4a4a',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  deleteConfirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#ff3b30',
  },
  deleteConfirmText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#ffffff',
    lineHeight: 22,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  confirmDeleteButton: {
    backgroundColor: '#ff3b30',
  },
  confirmDeleteText: {
    color: '#fff',
    fontWeight: '600',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calendarButton: {
    backgroundColor: '#a82828',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  calendarButtonText: {
    fontSize: 20,
  },
  dateButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#4a4a4a',
    borderRadius: 6,
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#c5c5c5',
    textAlign: 'center',
  },
  workoutTitleInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#4a4a4a',
    borderWidth: 1,
    borderColor: '#6a6a6a',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#ffffff',
  },
});