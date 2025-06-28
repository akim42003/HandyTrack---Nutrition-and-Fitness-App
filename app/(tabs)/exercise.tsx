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
  Platform,
} from 'react-native';
import { CalendarPicker } from '../../src/components/CalendarPicker';
import { ExerciseEntry, ExerciseSet, WorkoutSession, UserProfile } from '../../src/types';
import { getExerciseEntries, getWorkoutSessions, saveExerciseEntry, saveWorkoutSession, updateWorkoutSession, deleteWorkoutSession, getUserProfile } from '../../src/utils/storage';
import { formatWeight, parseWeight, getDisplayWeight } from '../../src/utils/unitConversions';
import { colors, getElevationStyle } from '../../src/styles/colors';

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
  const [showSetNotesModal, setShowSetNotesModal] = useState<{exerciseIndex: number; setIndex: number} | null>(null);
  const [showExerciseNotesModal, setShowExerciseNotesModal] = useState<number | null>(null);
  const [showWorkoutNotesModal, setShowWorkoutNotesModal] = useState(false);
  const [tempNotes, setTempNotes] = useState('');
  const [viewingWorkout, setViewingWorkout] = useState<WorkoutSession | null>(null);
  const [editingExerciseName, setEditingExerciseName] = useState<number | null>(null);
  const [tempExerciseName, setTempExerciseName] = useState('');

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

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight' | 'rpe' | 'notes', value: string) => {
    if (!currentWorkout) return;

    const updatedExercises = [...currentWorkout.exercises];
    
    if (field === 'notes') {
      updatedExercises[exerciseIndex].sets[setIndex].notes = value;
    } else {
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
    }

    setCurrentWorkout({
      ...currentWorkout,
      exercises: updatedExercises,
    });
  };

  const updateExerciseNotes = (exerciseIndex: number, notes: string) => {
    if (!currentWorkout) return;

    const updatedExercises = [...currentWorkout.exercises];
    updatedExercises[exerciseIndex].notes = notes;

    setCurrentWorkout({
      ...currentWorkout,
      exercises: updatedExercises,
    });
  };

  const updateWorkoutNotes = (notes: string) => {
    if (!currentWorkout) return;

    setCurrentWorkout({
      ...currentWorkout,
      notes,
    });
  };

  const openSetNotesModal = (exerciseIndex: number, setIndex: number) => {
    const currentNotes = currentWorkout?.exercises[exerciseIndex]?.sets[setIndex]?.notes || '';
    setTempNotes(currentNotes);
    setShowSetNotesModal({exerciseIndex, setIndex});
  };

  const openExerciseNotesModal = (exerciseIndex: number) => {
    const currentNotes = currentWorkout?.exercises[exerciseIndex]?.notes || '';
    setTempNotes(currentNotes);
    setShowExerciseNotesModal(exerciseIndex);
  };

  const openWorkoutNotesModal = () => {
    const currentNotes = currentWorkout?.notes || '';
    setTempNotes(currentNotes);
    setShowWorkoutNotesModal(true);
  };

  const saveSetNotes = () => {
    if (showSetNotesModal) {
      updateSet(showSetNotesModal.exerciseIndex, showSetNotesModal.setIndex, 'notes', tempNotes);
      setShowSetNotesModal(null);
      setTempNotes('');
    }
  };

  const saveExerciseNotes = () => {
    if (showExerciseNotesModal !== null) {
      updateExerciseNotes(showExerciseNotesModal, tempNotes);
      setShowExerciseNotesModal(null);
      setTempNotes('');
    }
  };

  const saveWorkoutNotes = () => {
    updateWorkoutNotes(tempNotes);
    setShowWorkoutNotesModal(false);
    setTempNotes('');
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

  const viewWorkoutDetails = (workout: WorkoutSession) => {
    setViewingWorkout(workout);
  };

  const deleteExercise = (exerciseIndex: number) => {
    if (!currentWorkout) return;

    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise and all its sets?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedExercises = currentWorkout.exercises.filter((_, index) => index !== exerciseIndex);
            setCurrentWorkout({
              ...currentWorkout,
              exercises: updatedExercises,
            });
          },
        },
      ]
    );
  };

  const deleteSet = (exerciseIndex: number, setIndex: number) => {
    if (!currentWorkout) return;

    const updatedExercises = [...currentWorkout.exercises];
    updatedExercises[exerciseIndex].sets = updatedExercises[exerciseIndex].sets.filter((_, index) => index !== setIndex);

    setCurrentWorkout({
      ...currentWorkout,
      exercises: updatedExercises,
    });
  };

  const startEditingExerciseName = (exerciseIndex: number) => {
    if (!currentWorkout) return;
    setTempExerciseName(currentWorkout.exercises[exerciseIndex].exerciseId.replace(/_/g, ' '));
    setEditingExerciseName(exerciseIndex);
  };

  const saveExerciseName = () => {
    if (!currentWorkout || editingExerciseName === null) return;

    const updatedExercises = [...currentWorkout.exercises];
    updatedExercises[editingExerciseName].exerciseId = tempExerciseName.toLowerCase().replace(/\s+/g, '_');

    setCurrentWorkout({
      ...currentWorkout,
      exercises: updatedExercises,
    });

    setEditingExerciseName(null);
    setTempExerciseName('');
  };

  const cancelEditingExerciseName = () => {
    setEditingExerciseName(null);
    setTempExerciseName('');
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
        
        <View style={styles.workoutNotesSection}>
          <TouchableOpacity
            style={styles.workoutNotesButton}
            onPress={openWorkoutNotesModal}
          >
            <Text style={styles.workoutNotesButtonText}>
              {currentWorkout.notes ? '💬' : '💭'} Workout Notes
            </Text>
          </TouchableOpacity>
          {currentWorkout.notes && (
            <View style={styles.workoutNotesPreview}>
              <Text style={styles.workoutNotesPreviewText}>{currentWorkout.notes}</Text>
            </View>
          )}
        </View>

        {currentWorkout.exercises.map((exercise, exerciseIndex) => (
          <View key={exercise.id} style={styles.exerciseSection}>
            <View style={styles.exerciseHeader}>
              {editingExerciseName === exerciseIndex ? (
                <View style={styles.exerciseNameEdit}>
                  <TextInput
                    style={styles.exerciseNameInput}
                    value={tempExerciseName}
                    onChangeText={setTempExerciseName}
                    autoFocus
                    placeholder="Exercise name"
                    placeholderTextColor="#999"
                    onSubmitEditing={saveExerciseName}
                    blurOnSubmit={false}
                  />
                  <TouchableOpacity style={styles.saveExerciseNameButton} onPress={saveExerciseName}>
                    <Text style={styles.saveExerciseNameText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelExerciseNameButton} onPress={cancelEditingExerciseName}>
                    <Text style={styles.cancelExerciseNameText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => startEditingExerciseName(exerciseIndex)}>
                  <Text style={styles.exerciseName}>{exercise.exerciseId.replace(/_/g, ' ').toUpperCase()}</Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.exerciseActions}>
                <TouchableOpacity
                  style={styles.notesButton}
                  onPress={() => openExerciseNotesModal(exerciseIndex)}
                >
                  <Text style={styles.notesButtonText}>
                    {exercise.notes ? '💬' : '💭'} Notes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteExerciseButton}
                  onPress={() => deleteExercise(exerciseIndex)}
                >
                  <Text style={styles.deleteExerciseButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {exercise.notes && (
              <View style={styles.notesPreview}>
                <Text style={styles.notesPreviewText}>{exercise.notes}</Text>
              </View>
            )}
            
            {exercise.sets.map((set, setIndex) => (
              <View key={set.id}>
                <View style={styles.setRow}>
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
                  <TouchableOpacity
                    style={styles.setNotesButton}
                    onPress={() => openSetNotesModal(exerciseIndex, setIndex)}
                  >
                    <Text style={styles.setNotesButtonText}>
                      {set.notes ? '💬' : '💭'}
                    </Text>
                  </TouchableOpacity>
                  {exercise.sets.length > 1 && (
                    <TouchableOpacity
                      style={styles.deleteSetButton}
                      onPress={() => deleteSet(exerciseIndex, setIndex)}
                    >
                      <Text style={styles.deleteSetButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {set.notes && (
                  <View style={styles.setNotesPreview}>
                    <Text style={styles.setNotesPreviewText}>{set.notes}</Text>
                  </View>
                )}
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
              <TouchableOpacity 
                style={styles.historyItemLeft}
                onPress={() => viewWorkoutDetails(session)}
                activeOpacity={0.7}
              >
                <Text style={styles.historyDate}>{session.date}</Text>
                <Text style={styles.historyName}>{session.name}</Text>
                <Text style={styles.historyExercises}>
                  {session.exercises.length} exercises
                </Text>
                <Text style={styles.tapToViewHint}>Tap to view details</Text>
              </TouchableOpacity>
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

      {/* Set Notes Modal */}
      <Modal visible={!!showSetNotesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView 
            contentContainerStyle={styles.notesModalScrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            keyboardDismissMode="interactive"
            contentInsetAdjustmentBehavior="automatic"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Notes</Text>
              <Text style={styles.notesModalSubtitle}>
                Add insights about this set (form, difficulty, etc.)
              </Text>
              <TextInput
                style={styles.notesTextInput}
                placeholder="e.g., Good form, felt heavy, perfect tempo..."
                value={tempNotes}
                onChangeText={setTempNotes}
                multiline
                numberOfLines={4}
                autoFocus
                placeholderTextColor="#999"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    setShowSetNotesModal(null);
                    setTempNotes('');
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.addButton]}
                  onPress={saveSetNotes}
                >
                  <Text style={styles.addButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Exercise Notes Modal */}
      <Modal visible={showExerciseNotesModal !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView 
            contentContainerStyle={styles.notesModalScrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            keyboardDismissMode="interactive"
            contentInsetAdjustmentBehavior="automatic"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Exercise Notes</Text>
              <Text style={styles.notesModalSubtitle}>
                Add notes about this exercise (technique, progression, etc.)
              </Text>
              <TextInput
                style={styles.notesTextInput}
                placeholder="e.g., Focus on slow eccentric, increase weight next week..."
                value={tempNotes}
                onChangeText={setTempNotes}
                multiline
                numberOfLines={4}
                autoFocus
                placeholderTextColor="#999"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    setShowExerciseNotesModal(null);
                    setTempNotes('');
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.addButton]}
                  onPress={saveExerciseNotes}
                >
                  <Text style={styles.addButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Workout Notes Modal */}
      <Modal visible={showWorkoutNotesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView 
            contentContainerStyle={styles.notesModalScrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            keyboardDismissMode="interactive"
            contentInsetAdjustmentBehavior="automatic"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Workout Notes</Text>
              <Text style={styles.notesModalSubtitle}>
                Add overall notes about this workout session
              </Text>
              <TextInput
                style={styles.notesTextInput}
                placeholder="e.g., Great energy today, felt strong, need more sleep..."
                value={tempNotes}
                onChangeText={setTempNotes}
                multiline
                numberOfLines={4}
                autoFocus
                placeholderTextColor="#999"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    setShowWorkoutNotesModal(false);
                    setTempNotes('');
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.addButton]}
                  onPress={saveWorkoutNotes}
                >
                  <Text style={styles.addButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Workout Details View Modal */}
      <Modal visible={!!viewingWorkout} transparent animationType="slide">
        <SafeAreaView style={styles.workoutDetailsModalOverlay}>
          <ScrollView 
            contentContainerStyle={styles.workoutDetailsScrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.workoutDetailsModalContent}>
              <View style={styles.workoutDetailsHeader}>
                <Text style={styles.modalTitle}>{viewingWorkout?.name}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setViewingWorkout(null)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.workoutDetailsInfo}>
                <Text style={styles.workoutDetailsDate}>
                  📅 {viewingWorkout ? new Date(viewingWorkout.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : ''}
                </Text>
                <Text style={styles.workoutDetailsExerciseCount}>
                  💪 {viewingWorkout?.exercises.length} exercises
                </Text>
                {viewingWorkout?.duration && (
                  <Text style={styles.workoutDetailsDuration}>
                    ⏱️ {viewingWorkout.duration} minutes
                  </Text>
                )}
              </View>

              {viewingWorkout?.notes && (
                <View style={styles.workoutDetailsNotes}>
                  <Text style={styles.workoutDetailsNotesTitle}>📝 Workout Notes</Text>
                  <Text style={styles.workoutDetailsNotesText}>{viewingWorkout.notes}</Text>
                </View>
              )}

              <View style={styles.workoutDetailsExercises}>
                <Text style={styles.workoutDetailsExercisesTitle}>Exercises</Text>
                {viewingWorkout?.exercises.map((exercise, exerciseIndex) => (
                  <View key={exercise.id} style={styles.workoutDetailsExerciseSection}>
                    <Text style={styles.workoutDetailsExerciseName}>
                      {exercise.exerciseId.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    
                    {exercise.notes && (
                      <View style={styles.workoutDetailsExerciseNotes}>
                        <Text style={styles.workoutDetailsExerciseNotesText}>
                          💭 {exercise.notes}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.workoutDetailsSetsHeader}>
                      <Text style={styles.workoutDetailsSetsHeaderText}>Set</Text>
                      <Text style={styles.workoutDetailsSetsHeaderText}>Weight</Text>
                      <Text style={styles.workoutDetailsSetsHeaderText}>Reps</Text>
                      <Text style={styles.workoutDetailsSetsHeaderText}>RPE</Text>
                    </View>
                    
                    {exercise.sets.map((set, setIndex) => (
                      <View key={set.id}>
                        <View style={styles.workoutDetailsSetRow}>
                          <Text style={styles.workoutDetailsSetNumber}>{setIndex + 1}</Text>
                          <Text style={styles.workoutDetailsSetValue}>
                            {set.weight > 0 ? `${getDisplayWeight(set.weight, 'imperial')} lbs` : '-'}
                          </Text>
                          <Text style={styles.workoutDetailsSetValue}>
                            {set.reps > 0 ? set.reps : '-'}
                          </Text>
                          <Text style={styles.workoutDetailsSetValue}>
                            {set.rpe ? set.rpe : '-'}
                          </Text>
                        </View>
                        {set.notes && (
                          <View style={styles.workoutDetailsSetNotes}>
                            <Text style={styles.workoutDetailsSetNotesText}>
                              💭 {set.notes}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
              
              <View style={styles.workoutDetailsActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.addButton]}
                  onPress={() => {
                    if (viewingWorkout) {
                      setViewingWorkout(null);
                      editWorkout(viewingWorkout);
                    }
                  }}
                >
                  <Text style={styles.addButtonText}>Edit Workout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.select({
      ios: 100, // Extra padding for iOS tab bar
      android: 80,
      default: 80,
    }),
  },
  header: {
    backgroundColor: colors.surface.level1,
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
    ...colors.shadows.small,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  startWorkoutContainer: {
    padding: 20,
    alignItems: 'center',
  },
  startWorkoutButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    ...colors.shadows.button,
  },
  startWorkoutText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  currentWorkout: {
    margin: 15,
    ...getElevationStyle(2),
    borderRadius: 12,
    padding: 15,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 15,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    color: colors.text.primary,
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  finishButton: {
    backgroundColor: colors.accent.green,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
    ...colors.shadows.small,
  },
  finishButtonText: {
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  cancelButton: {
    backgroundColor: colors.surface.level3,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.secondary,
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontWeight: '600',
    fontSize: 13,
  },
  exerciseSection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
    paddingBottom: 15,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: colors.text.primary,
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
    color: colors.text.primary,
  },
  setInput: {
    borderWidth: 1,
    borderColor: colors.border.secondary,
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 5,
    textAlign: 'center',
    flex: 1,
    backgroundColor: colors.surface.level1,
    color: colors.text.primary,
  },
  rpeInput: {
    flex: 0.5,
  },
  setLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginRight: 10,
  },
  addSetButton: {
    backgroundColor: colors.surface.level2,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  addSetText: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  addExerciseButton: {
    backgroundColor: colors.primary[500],
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    ...colors.shadows.button,
  },
  addExerciseText: {
    color: colors.text.primary,
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
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseNameEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  exerciseNameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#3c3c3c',
    borderWidth: 1,
    borderColor: '#6a6a6a',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  saveExerciseNameButton: {
    backgroundColor: '#28a745',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginRight: 4,
  },
  saveExerciseNameText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelExerciseNameButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  cancelExerciseNameText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteExerciseButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  deleteExerciseButtonText: {
    fontSize: 14,
  },
  deleteSetButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginLeft: 4,
  },
  deleteSetButtonText: {
    fontSize: 12,
  },
  notesButton: {
    backgroundColor: '#4a4a4a',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6a6a6a',
  },
  notesButtonText: {
    color: '#c5c5c5',
    fontSize: 12,
    fontWeight: '500',
  },
  setNotesButton: {
    backgroundColor: '#4a4a4a',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#6a6a6a',
  },
  setNotesButtonText: {
    fontSize: 16,
  },
  notesPreview: {
    backgroundColor: '#3c3c3c',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#a82828',
  },
  notesPreviewText: {
    color: '#e0e0e0',
    fontSize: 12,
    fontStyle: 'italic',
  },
  setNotesPreview: {
    backgroundColor: '#3c3c3c',
    padding: 6,
    borderRadius: 4,
    marginLeft: 35,
    marginBottom: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#6a6a6a',
  },
  setNotesPreviewText: {
    color: '#c5c5c5',
    fontSize: 11,
    fontStyle: 'italic',
  },
  workoutNotesSection: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#6a6a6a',
  },
  workoutNotesButton: {
    backgroundColor: '#4a4a4a',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6a6a6a',
  },
  workoutNotesButtonText: {
    color: '#c5c5c5',
    fontSize: 14,
    fontWeight: '500',
  },
  workoutNotesPreview: {
    backgroundColor: '#3c3c3c',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#a82828',
  },
  workoutNotesPreviewText: {
    color: '#e0e0e0',
    fontSize: 13,
    fontStyle: 'italic',
  },
  notesTextInput: {
    borderWidth: 1,
    borderColor: '#6a6a6a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#4a4a4a',
    color: '#ffffff',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  notesModalSubtitle: {
    fontSize: 14,
    color: '#c5c5c5',
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  notesModalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 150, // Extra bottom padding for keyboard
    paddingHorizontal: 10,
  },
  tapToViewHint: {
    fontSize: 11,
    color: '#a82828',
    marginTop: 4,
    fontStyle: 'italic',
  },
  workoutDetailsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  workoutDetailsScrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  workoutDetailsModalContent: {
    backgroundColor: '#4a4a4a',
    borderRadius: 12,
    padding: 20,
    minHeight: '80%',
  },
  workoutDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#6a6a6a',
    paddingBottom: 15,
  },
  workoutDetailsInfo: {
    backgroundColor: '#3c3c3c',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  workoutDetailsDate: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
    fontWeight: '500',
  },
  workoutDetailsExerciseCount: {
    fontSize: 14,
    color: '#c5c5c5',
    marginBottom: 4,
  },
  workoutDetailsDuration: {
    fontSize: 14,
    color: '#c5c5c5',
  },
  workoutDetailsNotes: {
    backgroundColor: '#3c3c3c',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#a82828',
  },
  workoutDetailsNotesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  workoutDetailsNotesText: {
    fontSize: 14,
    color: '#e0e0e0',
    lineHeight: 20,
  },
  workoutDetailsExercises: {
    marginBottom: 20,
  },
  workoutDetailsExercisesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 15,
  },
  workoutDetailsExerciseSection: {
    backgroundColor: '#3c3c3c',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  workoutDetailsExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a82828',
    marginBottom: 10,
  },
  workoutDetailsExerciseNotes: {
    backgroundColor: '#2c2c2c',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#6a6a6a',
  },
  workoutDetailsExerciseNotesText: {
    fontSize: 12,
    color: '#c5c5c5',
    fontStyle: 'italic',
  },
  workoutDetailsSetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#6a6a6a',
    marginBottom: 8,
  },
  workoutDetailsSetsHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c5c5c5',
    flex: 1,
    textAlign: 'center',
  },
  workoutDetailsSetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#555555',
  },
  workoutDetailsSetNumber: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    fontWeight: '500',
  },
  workoutDetailsSetValue: {
    fontSize: 14,
    color: '#e0e0e0',
    flex: 1,
    textAlign: 'center',
  },
  workoutDetailsSetNotes: {
    backgroundColor: '#2c2c2c',
    padding: 6,
    borderRadius: 4,
    marginLeft: 10,
    marginBottom: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#555555',
  },
  workoutDetailsSetNotesText: {
    fontSize: 11,
    color: '#c5c5c5',
    fontStyle: 'italic',
  },
  workoutDetailsActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
});