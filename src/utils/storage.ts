import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, FoodEntry, ExerciseEntry, WorkoutSession, Food, Exercise } from '../types';

const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  FOOD_ENTRIES: 'food_entries',
  EXERCISE_ENTRIES: 'exercise_entries',
  WORKOUT_SESSIONS: 'workout_sessions',
  FOODS: 'foods',
  EXERCISES: 'exercises',
};

// User Profile
export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    console.log('Storage: Attempting to save profile:', profile);
    const profileString = JSON.stringify(profile);
    console.log('Storage: Profile serialized, length:', profileString.length);
    
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, profileString);
    console.log('Storage: Profile saved successfully to key:', STORAGE_KEYS.USER_PROFILE);
    
    // Verify the save worked
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    console.log('Storage: Verification - saved data exists:', !!saved);
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Food Entries
export const saveFoodEntry = async (entry: FoodEntry): Promise<void> => {
  try {
    const existingEntries = await getFoodEntries();
    const updatedEntries = [...existingEntries, entry];
    await AsyncStorage.setItem(STORAGE_KEYS.FOOD_ENTRIES, JSON.stringify(updatedEntries));
  } catch (error) {
    console.error('Error saving food entry:', error);
    throw error;
  }
};

export const updateFoodEntry = async (updatedEntry: FoodEntry): Promise<void> => {
  try {
    const existingEntries = await getFoodEntries();
    const updatedEntries = existingEntries.map(entry => 
      entry.id === updatedEntry.id ? updatedEntry : entry
    );
    await AsyncStorage.setItem(STORAGE_KEYS.FOOD_ENTRIES, JSON.stringify(updatedEntries));
  } catch (error) {
    console.error('Error updating food entry:', error);
    throw error;
  }
};

export const deleteFoodEntry = async (entryId: string): Promise<void> => {
  try {
    const existingEntries = await getFoodEntries();
    const updatedEntries = existingEntries.filter(entry => entry.id !== entryId);
    await AsyncStorage.setItem(STORAGE_KEYS.FOOD_ENTRIES, JSON.stringify(updatedEntries));
  } catch (error) {
    console.error('Error deleting food entry:', error);
    throw error;
  }
};

export const getFoodEntries = async (date?: string): Promise<FoodEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FOOD_ENTRIES);
    const entries: FoodEntry[] = data ? JSON.parse(data) : [];
    
    if (date) {
      return entries.filter(entry => entry.date === date);
    }
    
    return entries;
  } catch (error) {
    console.error('Error getting food entries:', error);
    return [];
  }
};

// Exercise Entries
export const saveExerciseEntry = async (entry: ExerciseEntry): Promise<void> => {
  try {
    const existingEntries = await getExerciseEntries();
    const updatedEntries = [...existingEntries, entry];
    await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_ENTRIES, JSON.stringify(updatedEntries));
  } catch (error) {
    console.error('Error saving exercise entry:', error);
    throw error;
  }
};

export const updateExerciseEntry = async (updatedEntry: ExerciseEntry): Promise<void> => {
  try {
    const existingEntries = await getExerciseEntries();
    const updatedEntries = existingEntries.map(entry => 
      entry.id === updatedEntry.id ? updatedEntry : entry
    );
    await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_ENTRIES, JSON.stringify(updatedEntries));
  } catch (error) {
    console.error('Error updating exercise entry:', error);
    throw error;
  }
};

export const deleteExerciseEntry = async (entryId: string): Promise<void> => {
  try {
    const existingEntries = await getExerciseEntries();
    const updatedEntries = existingEntries.filter(entry => entry.id !== entryId);
    await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_ENTRIES, JSON.stringify(updatedEntries));
  } catch (error) {
    console.error('Error deleting exercise entry:', error);
    throw error;
  }
};

export const getExerciseEntries = async (date?: string): Promise<ExerciseEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.EXERCISE_ENTRIES);
    const entries: ExerciseEntry[] = data ? JSON.parse(data) : [];
    
    if (date) {
      return entries.filter(entry => entry.date === date);
    }
    
    return entries;
  } catch (error) {
    console.error('Error getting exercise entries:', error);
    return [];
  }
};

// Workout Sessions
export const saveWorkoutSession = async (session: WorkoutSession): Promise<void> => {
  try {
    const existingSessions = await getWorkoutSessions();
    const updatedSessions = [...existingSessions, session];
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_SESSIONS, JSON.stringify(updatedSessions));
  } catch (error) {
    console.error('Error saving workout session:', error);
    throw error;
  }
};

export const updateWorkoutSession = async (updatedSession: WorkoutSession): Promise<void> => {
  try {
    const existingSessions = await getWorkoutSessions();
    const updatedSessions = existingSessions.map(session => 
      session.id === updatedSession.id ? updatedSession : session
    );
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_SESSIONS, JSON.stringify(updatedSessions));
  } catch (error) {
    console.error('Error updating workout session:', error);
    throw error;
  }
};

export const deleteWorkoutSession = async (sessionId: string): Promise<void> => {
  try {
    const existingSessions = await getWorkoutSessions();
    const updatedSessions = existingSessions.filter(session => session.id !== sessionId);
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_SESSIONS, JSON.stringify(updatedSessions));
  } catch (error) {
    console.error('Error deleting workout session:', error);
    throw error;
  }
};

export const getWorkoutSessions = async (): Promise<WorkoutSession[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_SESSIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting workout sessions:', error);
    return [];
  }
};

// Foods Database
export const saveFood = async (food: Food): Promise<void> => {
  try {
    const existingFoods = await getFoods();
    const updatedFoods = [...existingFoods, food];
    await AsyncStorage.setItem(STORAGE_KEYS.FOODS, JSON.stringify(updatedFoods));
  } catch (error) {
    console.error('Error saving food:', error);
    throw error;
  }
};

export const getFoods = async (): Promise<Food[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FOODS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting foods:', error);
    return [];
  }
};

// Exercises Database
export const saveExercise = async (exercise: Exercise): Promise<void> => {
  try {
    const existingExercises = await getExercises();
    const updatedExercises = [...existingExercises, exercise];
    await AsyncStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(updatedExercises));
  } catch (error) {
    console.error('Error saving exercise:', error);
    throw error;
  }
};

export const getExercises = async (): Promise<Exercise[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.EXERCISES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting exercises:', error);
    return [];
  }
};

// Clear all data (for testing/reset)
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};