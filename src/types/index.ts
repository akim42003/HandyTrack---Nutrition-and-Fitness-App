export interface UserProfile {
  id: string;
  name: string;
  height: number; // in cm (stored internally as metric)
  weight: number; // in kg (stored internally as metric)
  startingWeight?: number; // in kg - baseline for progress tracking
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  unitSystem: 'metric' | 'imperial'; // User's preferred unit system
  goals: {
    targetWeight: number; // in kg (stored internally as metric)
    weeklyWeightChange: number; // kg per week (stored internally as metric)
    dailyCalories: number;
    dailyProtein: number; // grams per day
  };
  biometricMeasurements: {
    fistVolume: number; // ml (stored internally as metric)
    thumbVolume: number; // ml (stored internally as metric)
    pinkyVolume: number; // ml (stored internally as metric)
  };
}

export interface BiometricMeasurement {
  type: 'fist' | 'thumb' | 'pinky' | 'palm' | 'handful';
  multiplier: number;
}

export interface Food {
  id: string;
  name: string;
  caloriesPerGram: number;
  protein: number; // per 100g
  carbs: number; // per 100g
  fat: number; // per 100g
  fiber: number; // per 100g
}

export interface FoodEntry {
  id: string;
  foodId: string;
  amount: number;
  unit: 'g' | 'ml' | 'fist' | 'thumb' | 'pinky' | 'palm' | 'handful';
  date: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  caloriesPerGram?: number; // Store calories per gram for quick calculation
  foodName?: string; // Store food name for display when API unavailable
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  notes?: string;
}

export interface ExerciseSet {
  id: string;
  reps: number;
  weight: number; // kg
  rpe?: number; // Rate of Perceived Exertion 1-10
  notes?: string;
}

export interface ExerciseEntry {
  id: string;
  exerciseId: string;
  date: string;
  sets: ExerciseSet[];
  restTime?: number; // seconds
  type: 'straight' | 'superset' | 'dropset' | 'circuit';
  supersetWith?: string[]; // exercise IDs
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  name: string;
  exercises: ExerciseEntry[];
  duration?: number; // minutes
  notes?: string;
}