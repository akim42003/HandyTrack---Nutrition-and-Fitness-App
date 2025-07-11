import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { FoodEntry } from '../types/index';
import { foodScreenStyles as styles } from '../styles/foodScreenStyles';

interface MealSectionProps {
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  entries: FoodEntry[];
  mealCalories: number;
  mealProtein: number;
  onAddFood: (meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  onEditEntry: (entry: FoodEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  calculateEntryCalories: (entry: FoodEntry) => number;
  calculateEntryProtein: (entry: FoodEntry) => number;
}

export const MealSection: React.FC<MealSectionProps> = ({
  meal,
  entries,
  mealCalories,
  mealProtein,
  onAddFood,
  onEditEntry,
  onDeleteEntry,
  calculateEntryCalories,
  calculateEntryProtein,
}) => {
  return (
    <View style={styles.mealSection}>
      <View style={styles.mealHeader}>
        <Text style={styles.mealTitle}>
          {meal.charAt(0).toUpperCase() + meal.slice(1)}
        </Text>
        <View style={styles.mealNutrition}>
          <Text style={styles.mealCalories}>
            {Math.round(mealCalories)} cal
          </Text>
          <Text style={styles.mealProtein}>
            {Math.round(mealProtein * 10) / 10}g protein
          </Text>
        </View>
      </View>
      
      {entries.length === 0 ? (
        <Text style={styles.noEntries}>No entries yet</Text>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={styles.foodEntry}>
            <View style={styles.foodEntryLeft}>
              <Text style={styles.foodName}>
                {entry.foodName || entry.foodId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <Text style={styles.foodDetails}>
                {Math.round(entry.amount)}g ({entry.unit}) • {calculateEntryCalories(entry)} cal • {Math.round(calculateEntryProtein(entry) * 10) / 10}g protein
              </Text>
            </View>
            <View style={styles.foodEntryActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => onEditEntry(entry)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onDeleteEntry(entry.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => onAddFood(meal)}
      >
        <Text style={styles.addButtonText}>+ Add Food</Text>
      </TouchableOpacity>
    </View>
  );
};