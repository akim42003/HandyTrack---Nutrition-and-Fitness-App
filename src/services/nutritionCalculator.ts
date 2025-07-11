import { FoodEntry, UserProfile } from '../types/index';
import { FoodItem } from '../data/foodDatabase';
import { convertBiometricToAmount } from '../utils/biometricCalculator';

export const calculateEntryCalories = (entry: FoodEntry): number => {
  // Since we can't use async getFoodById here, we'll calculate based on stored calories
  // Food entries now store calories per gram when created
  if (entry.caloriesPerGram) {
    return Math.round(entry.amount * entry.caloriesPerGram);
  }
  // Fallback for old entries without stored calorie data
  return Math.round(entry.amount * 4);
};

export const calculateEntryProtein = (entry: FoodEntry): number => {
  // Use stored calorie data to estimate protein (rough calculation)
  // This avoids async calls and uses data already stored with the entry
  if (entry.caloriesPerGram) {
    // Rough estimate: assume 20-25% of calories come from protein
    // 1g protein = 4 calories, so protein grams = (total calories * 0.22) / 4
    const totalCalories = entry.amount * entry.caloriesPerGram;
    const estimatedProtein = (totalCalories * 0.22) / 4; // 22% protein calories
    return Math.round(estimatedProtein * 10) / 10; // Round to 1 decimal
  }
  // Fallback for entries without calorie data (rough estimate)
  return Math.round(entry.amount * 0.2 * 10) / 10; // Assume 20% protein content by weight
};

export const calculateMealCalories = (entries: FoodEntry[], meal: string): number => {
  return entries
    .filter(entry => entry.meal === meal)
    .reduce((total, entry) => total + calculateEntryCalories(entry), 0);
};

export const calculateMealProtein = (entries: FoodEntry[], meal: string): number => {
  return entries
    .filter(entry => entry.meal === meal)
    .reduce((total, entry) => total + calculateEntryProtein(entry), 0);
};

export const calculateTotalCalories = (entries: FoodEntry[]): number => {
  return entries.reduce((total, entry) => total + calculateEntryCalories(entry), 0);
};

export const calculateTotalProtein = (entries: FoodEntry[]): number => {
  return entries.reduce((total, entry) => total + calculateEntryProtein(entry), 0);
};

export const calculateNutrition = (
  food: FoodItem | null, 
  amountStr: string, 
  selectedUnit: string,
  userProfile: UserProfile | null
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
} => {
  if (!food || !amountStr || !userProfile) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }

  let amountInGrams = parseFloat(amountStr);
  
  // Convert biometric measurements to grams
  if (['fist', 'thumb', 'pinky'].includes(selectedUnit)) {
    const biometricMeasurement = {
      type: selectedUnit as 'fist' | 'thumb' | 'pinky',
      multiplier: 1,
    };
    amountInGrams = convertBiometricToAmount(biometricMeasurement, amountInGrams, userProfile);
  }

  const calories = Math.round(amountInGrams * food.caloriesPerGram);
  const protein = Math.round((amountInGrams / 100) * food.protein * 10) / 10;
  const carbs = Math.round((amountInGrams / 100) * food.carbs * 10) / 10;
  const fat = Math.round((amountInGrams / 100) * food.fat * 10) / 10;
  const fiber = Math.round((amountInGrams / 100) * food.fiber * 10) / 10;

  return { calories, protein, carbs, fat, fiber };
};