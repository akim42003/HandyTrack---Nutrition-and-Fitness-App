import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { FoodEntry, UserProfile } from '../../src/types';
import { getFoodEntries, getUserProfile, saveFoodEntry, updateFoodEntry, deleteFoodEntry } from '../../src/utils/storage';
import { getMeasurementEquivalents, convertBiometricToAmount } from '../../src/utils/biometricCalculator';
import { searchFoods, getFoodById, getPopularFoods, isUSDAApiReady, getApiStatus, FoodItem } from '../../src/data/foodDatabase';
import { formatVolume } from '../../src/utils/unitConversions';
import { CalendarPicker } from '../../src/components/CalendarPicker';
import { FoodCamera } from '../../src/components/FoodCamera';
import { colors, getElevationStyle } from '../../src/styles/colors';

export default function FoodScreen() {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddFood, setShowAddFood] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<'g' | 'ml' | 'fist' | 'thumb' | 'pinky'>('g');
  const [calculatedCalories, setCalculatedCalories] = useState(0);
  const [calculatedNutrition, setCalculatedNutrition] = useState({
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<{ configured: boolean; message: string }>({ configured: false, message: '' });
  const [isSearching, setIsSearching] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showFoodCamera, setShowFoodCamera] = useState(false);

  useEffect(() => {
    loadData();
    checkApiStatus();
  }, [selectedDate]);

  const checkApiStatus = () => {
    const status = getApiStatus();
    setApiStatus(status);
    
    // Load popular foods if API is ready and no search results
    if (status.configured && searchResults.length === 0 && !searchQuery) {
      loadPopularFoods();
    }
  };

  const loadPopularFoods = async () => {
    try {
      const popular = await getPopularFoods();
      setSearchResults(popular);
    } catch (error) {
      console.log('Could not load popular foods');
    }
  };

  const calculateEntryCalories = (entry: FoodEntry) => {
    // Since we can't use async getFoodById here, we'll calculate based on stored calories
    // Food entries now store calories per gram when created
    if (entry.caloriesPerGram) {
      return Math.round(entry.amount * entry.caloriesPerGram);
    }
    // Fallback for old entries without stored calorie data
    return Math.round(entry.amount * 4);
  };

  const calculateEntryProtein = (entry: FoodEntry) => {
    // Calculate protein based on stored food data or fallback
    const food = getFoodById(entry.foodId);
    if (food && food.protein) {
      return Math.round((entry.amount / 100) * food.protein * 10) / 10; // Round to 1 decimal
    }
    // Fallback for entries without food data (rough estimate)
    return Math.round(entry.amount * 0.2 * 10) / 10; // Assume 20% protein content
  };

  const loadData = async () => {
    try {
      const profile = await getUserProfile();
      const entries = await getFoodEntries(selectedDate);
      setUserProfile(profile);
      setFoodEntries(entries);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getMealEntries = (meal: string) => {
    return foodEntries.filter(entry => entry.meal === meal);
  };

  const calculateMealCalories = (meal: string) => {
    return getMealEntries(meal).reduce((total, entry) => {
      return total + calculateEntryCalories(entry);
    }, 0);
  };

  const calculateMealProtein = (meal: string) => {
    return getMealEntries(meal).reduce((total, entry) => {
      return total + calculateEntryProtein(entry);
    }, 0);
  };

  const totalCalories = foodEntries.reduce((total, entry) => total + calculateEntryCalories(entry), 0);
  const totalProtein = foodEntries.reduce((total, entry) => total + calculateEntryProtein(entry), 0);

  const openAddFood = (meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setSelectedMeal(meal);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFood(null);
    setAmount('');
    setUnit('g');
    setCalculatedCalories(0);
    setCalculatedNutrition({ protein: 0, carbs: 0, fat: 0, fiber: 0 });
    setEditingEntry(null); // Reset editing state
    setShowAddFood(true);
  };

  const handleSearchFood = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      setIsSearching(true);
      try {
        const results = await searchFoods(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching foods:', error);
        setSearchResults([]);
        // Show error message to user
        Alert.alert('Search Error', error.message || 'Unable to search foods. Please check your internet connection.');
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      // Load popular foods when search is cleared
      if (apiStatus.configured) {
        loadPopularFoods();
      }
    }
  };

  const selectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setSearchQuery(food.name);
    setSearchResults([]);
    calculateNutrition(food, amount, unit);
  };

  const calculateNutrition = (food: FoodItem | null, amountStr: string, selectedUnit: string) => {
    if (!food || !amountStr || !userProfile) {
      setCalculatedCalories(0);
      setCalculatedNutrition({ protein: 0, carbs: 0, fat: 0, fiber: 0 });
      return;
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

    setCalculatedCalories(calories);
    setCalculatedNutrition({ protein, carbs, fat, fiber });
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    calculateNutrition(selectedFood, value, unit);
  };

  const handleUnitChange = (newUnit: 'g' | 'ml' | 'fist' | 'thumb' | 'pinky') => {
    setUnit(newUnit);
    calculateNutrition(selectedFood, amount, newUnit);
  };

  const saveFood = async () => {
    if (!selectedFood || !amount) {
      Alert.alert('Error', 'Please select a food and enter an amount');
      return;
    }

    if (!userProfile) {
      Alert.alert('Error', 'User profile not found');
      return;
    }

    try {
      let finalAmountInGrams = parseFloat(amount);
      
      // Convert biometric measurements to grams
      if (['fist', 'thumb', 'pinky'].includes(unit)) {
        const biometricMeasurement = {
          type: unit as 'fist' | 'thumb' | 'pinky',
          multiplier: 1,
        };
        finalAmountInGrams = convertBiometricToAmount(biometricMeasurement, finalAmountInGrams, userProfile);
      }

      if (editingEntry) {
        // Update existing entry
        const updatedEntry: FoodEntry = {
          ...editingEntry,
          foodId: selectedFood.id,
          amount: finalAmountInGrams,
          unit: unit,
          caloriesPerGram: selectedFood.caloriesPerGram,
          foodName: selectedFood.name,
        };
        await updateFoodEntry(updatedEntry);
        setEditingEntry(null);
        Alert.alert('Success', 'Food entry updated successfully!');
      } else {
        // Create new entry
        const foodEntry: FoodEntry = {
          id: Date.now().toString(),
          foodId: selectedFood.id,
          amount: finalAmountInGrams,
          unit: unit,
          date: selectedDate,
          meal: selectedMeal,
          caloriesPerGram: selectedFood.caloriesPerGram,
          foodName: selectedFood.name,
        };
        await saveFoodEntry(foodEntry);
        Alert.alert('Success', 'Food added successfully!');
      }
      
      // Reload data
      const entries = await getFoodEntries(selectedDate);
      setFoodEntries(entries);
      
      setShowAddFood(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save food entry');
    }
  };

  const editFoodEntry = (entry: FoodEntry) => {
    const food = getFoodById(entry.foodId);
    if (!food) {
      Alert.alert('Error', 'Food not found in database');
      return;
    }

    setEditingEntry(entry);
    setSelectedMeal(entry.meal);
    setSelectedFood(food);
    setSearchQuery(food.name);
    setSearchResults([]);
    
    // Convert back to original unit for editing
    let displayAmount = entry.amount;
    let displayUnit = 'g' as typeof unit;
    
    // If original unit was biometric, convert back
    if (entry.unit !== 'g' && entry.unit !== 'ml') {
      displayAmount = parseFloat(amount) || 1; // Use original input amount if available
      displayUnit = entry.unit as typeof unit;
    }
    
    setAmount(displayAmount.toString());
    setUnit(displayUnit);
    setShowAddFood(true);
    
    calculateNutrition(food, displayAmount.toString(), displayUnit);
  };

  const confirmDeleteEntry = (entryId: string) => {
    setShowDeleteConfirm(entryId);
  };

  const deleteFoodEntryConfirmed = async () => {
    if (!showDeleteConfirm) return;
    
    try {
      await deleteFoodEntry(showDeleteConfirm);
      const entries = await getFoodEntries(selectedDate);
      setFoodEntries(entries);
      setShowDeleteConfirm(null);
      Alert.alert('Success', 'Food entry deleted');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete food entry');
    }
  };

  const renderMeasurementGuide = () => {
    if (!userProfile) return null;
    
    const equivalents = getMeasurementEquivalents(userProfile);
    
    return (
      <View style={styles.measurementGuide}>
        <Text style={styles.guideTitle}>Your Biometric Measurements</Text>
        <View style={styles.guideRow}>
          <Text style={styles.guideItem}>🤛 Fist: ~{formatVolume(equivalents.fist.volume, 'imperial')}</Text>
          <Text style={styles.guideItem}>👍 Thumb: ~{formatVolume(equivalents.thumb.volume, 'imperial')}</Text>
          <Text style={styles.guideItem}>👌 Pinky: ~{formatVolume(equivalents.pinky.volume, 'imperial')}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Food Tracking</Text>
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
          <Text style={styles.calories}>
            {Math.round(totalCalories)} / {userProfile?.goals.dailyCalories || 2000} cal
          </Text>
          <Text style={styles.protein}>
            {Math.round(totalProtein * 10) / 10}g / {userProfile?.goals.dailyProtein || 100}g protein
          </Text>
        </View>

        {renderMeasurementGuide()}

        <View style={styles.mealsContainer}>
          {['breakfast', 'lunch', 'dinner', 'snack'].map((meal) => (
            <View key={meal} style={styles.mealSection}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealTitle}>
                  {meal.charAt(0).toUpperCase() + meal.slice(1)}
                </Text>
                <View style={styles.mealNutrition}>
                  <Text style={styles.mealCalories}>
                    {Math.round(calculateMealCalories(meal))} cal
                  </Text>
                  <Text style={styles.mealProtein}>
                    {Math.round(calculateMealProtein(meal) * 10) / 10}g protein
                  </Text>
                </View>
              </View>
              
              {getMealEntries(meal).length === 0 ? (
                <Text style={styles.noEntries}>No entries yet</Text>
              ) : (
                getMealEntries(meal).map((entry) => (
                  <View key={entry.id} style={styles.foodEntry}>
                    <View style={styles.foodEntryLeft}>
                      <Text style={styles.foodName}>
                        {getFoodById(entry.foodId)?.name || entry.foodId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Text>
                      <Text style={styles.foodDetails}>
                        {Math.round(entry.amount)}g ({entry.unit}) • {calculateEntryCalories(entry)} cal • {Math.round(calculateEntryProtein(entry) * 10) / 10}g protein
                      </Text>
                    </View>
                    <View style={styles.foodEntryActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => editFoodEntry(entry)}
                      >
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => confirmDeleteEntry(entry.id)}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
              
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => openAddFood(meal as 'breakfast' | 'lunch' | 'dinner' | 'snack')}
              >
                <Text style={styles.addButtonText}>+ Add Food</Text>
              </TouchableOpacity>
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

      <Modal visible={showAddFood} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingEntry ? 'Edit Food Entry' : `Add Food to ${selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}`}
            </Text>
            
            {/* Add Food Input Method Selection */}
            {!editingEntry && !selectedFood && (
              <View style={styles.inputMethodSection}>
                <Text style={styles.inputMethodTitle}>How would you like to add food?</Text>
                <View style={styles.inputMethodButtons}>
                  <TouchableOpacity 
                    style={styles.inputMethodButton}
                    onPress={() => {/* Current search flow - no changes needed */}}
                  >
                    <Text style={styles.inputMethodIcon}>🔍</Text>
                    <Text style={styles.inputMethodText}>Search Database</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.inputMethodButton}
                    onPress={() => {
                      setShowAddFood(false);
                      setShowFoodCamera(true);
                    }}
                  >
                    <Text style={styles.inputMethodIcon}>📷</Text>
                    <Text style={styles.inputMethodText}>Camera Recognition</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.inputMethodDivider}>
                  <Text style={styles.inputMethodDividerText}>or continue with search below</Text>
                </View>
              </View>
            )}
            
            {/* API Status Indicator */}
            {!apiStatus.configured && (
              <View style={styles.apiWarning}>
                <Text style={styles.apiWarningText}>⚠️ USDA API not configured</Text>
                <Text style={styles.apiWarningSubtext}>
                  Please add your API key to use the food database
                </Text>
              </View>
            )}
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Search Food</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={apiStatus.configured ? "Search 400,000+ foods (e.g., chicken breast)" : "Please configure USDA API key first"}
                value={searchQuery}
                onChangeText={handleSearchFood}
                editable={apiStatus.configured}
              />
              {isSearching && (
                <Text style={styles.searchingText}>Searching USDA database...</Text>
              )}
            </View>

            {searchResults.length > 0 && (
              <ScrollView style={styles.searchResults} nestedScrollEnabled>
                {searchResults.slice(0, 8).map((food) => (
                  <TouchableOpacity
                    key={food.id}
                    style={styles.foodResult}
                    onPress={() => selectFood(food)}
                  >
                    <Text style={styles.foodResultName}>{food.name}</Text>
                    <Text style={styles.foodResultCategory}>{food.category}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {selectedFood && (
              <>
                <View style={styles.selectedFoodInfo}>
                  <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
                  <Text style={styles.selectedFoodDetails}>
                    {Math.round(selectedFood.caloriesPerGram * 100)} cal per 100g
                  </Text>
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Amount</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="1"
                      value={amount}
                      onChangeText={handleAmountChange}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Unit</Text>
                    <View style={styles.unitSelector}>
                      {['g', 'ml', 'fist', 'thumb', 'pinky'].map((unitOption) => (
                        <TouchableOpacity
                          key={unitOption}
                          style={[
                            styles.unitButton,
                            unit === unitOption && styles.selectedUnit
                          ]}
                          onPress={() => handleUnitChange(unitOption as any)}
                        >
                          <Text style={[
                            styles.unitText,
                            unit === unitOption && styles.selectedUnitText
                          ]}>
                            {unitOption}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {calculatedCalories > 0 && (
                  <View style={styles.nutritionInfo}>
                    <Text style={styles.nutritionTitle}>Nutrition (Auto-calculated)</Text>
                    <View style={styles.nutritionRow}>
                      <Text style={styles.nutritionItem}>🔥 {calculatedCalories} cal</Text>
                      <Text style={styles.nutritionItem}>🥩 {calculatedNutrition.protein}g protein</Text>
                    </View>
                    <View style={styles.nutritionRow}>
                      <Text style={styles.nutritionItem}>🍞 {calculatedNutrition.carbs}g carbs</Text>
                      <Text style={styles.nutritionItem}>🥑 {calculatedNutrition.fat}g fat</Text>
                    </View>
                  </View>
                )}

                {userProfile && (
                  <View style={styles.measurementHint}>
                    <Text style={styles.hintTitle}>Your Biometric Guide:</Text>
                    <Text style={styles.hintText}>
                      🤛 Fist: ~{formatVolume(userProfile.biometricMeasurements.fistVolume, 'imperial')}
                    </Text>
                    <Text style={styles.hintText}>
                      👍 Thumb: ~{formatVolume(userProfile.biometricMeasurements.thumbVolume, 'imperial')}
                    </Text>
                    <Text style={styles.hintText}>
                      👌 Pinky: ~{formatVolume(userProfile.biometricMeasurements.pinkyVolume, 'imperial')}
                    </Text>
                  </View>
                )}
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddFood(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.saveButton,
                  (!selectedFood || !amount) && styles.disabledButton
                ]}
                onPress={saveFood}
                disabled={!selectedFood || !amount}
              >
                <Text style={[
                  styles.saveButtonText,
                  (!selectedFood || !amount) && styles.disabledText
                ]}>
                  {editingEntry ? 'Update Food' : 'Add Food'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!showDeleteConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.deleteConfirmModal}>
            <Text style={styles.deleteConfirmTitle}>Delete Food Entry</Text>
            <Text style={styles.deleteConfirmText}>
              Are you sure you want to delete this food entry? This action cannot be undone.
            </Text>
            <View style={styles.deleteConfirmButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteConfirm(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmDeleteButton]}
                onPress={deleteFoodEntryConfirmed}
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <FoodCamera
        visible={showFoodCamera}
        onClose={() => setShowFoodCamera(false)}
        onFoodRecognized={(result) => {
          // Convert camera recognition result to food format
          const recognizedFood = {
            id: `camera_${Date.now()}`,
            name: result.foodName,
            caloriesPerGram: result.estimatedCalories / result.estimatedWeight,
            protein: 0, // Will be estimated based on food type
            carbs: 0,
            fat: 0,
            fiber: 0,
          };
          
          setSelectedFood(recognizedFood);
          setAmount(result.estimatedWeight.toString());
          setUnit('g');
          setShowFoodCamera(false);
          setShowAddFood(true);
          
          // Calculate nutrition values
          calculateNutrition(recognizedFood, result.estimatedWeight.toString(), 'g');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    backgroundColor: colors.surface.level1,
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[500],
    ...colors.shadows.small,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.text.primary,
  },
  date: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 10,
  },
  calories: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary[500],
  },
  protein: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  measurementGuide: {
    ...getElevationStyle(2),
    margin: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    color: colors.text.primary,
  },
  guideRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  guideItem: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  mealsContainer: {
    padding: 15,
  },
  mealSection: {
    ...getElevationStyle(1),
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border.secondary,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  mealCalories: {
    fontSize: 16,
    color: colors.primary[500],
    fontWeight: '500',
  },
  mealProtein: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '400',
  },
  mealNutrition: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  noEntries: {
    fontSize: 14,
    color: '#a0a0a0',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  foodEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#6a6a6a',
  },
  foodEntryLeft: {
    flex: 1,
  },
  foodEntryActions: {
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
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
    color: '#ffffff',
  },
  foodDetails: {
    fontSize: 12,
    color: '#c5c5c5',
  },
  addButton: {
    backgroundColor: colors.primary[500],
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    ...colors.shadows.button,
  },
  addButtonText: {
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface.level2,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    ...colors.shadows.large,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: colors.text.primary,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#ffffff',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#6a6a6a',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  unitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#6a6a6a',
    borderRadius: 5,
    backgroundColor: '#4a4a4a',
  },
  selectedUnit: {
    backgroundColor: '#a82828',
    borderColor: '#007AFF',
  },
  unitText: {
    fontSize: 14,
    color: '#ffffff',
  },
  selectedUnitText: {
    color: '#fff',
    fontWeight: '600',
  },
  measurementHint: {
    backgroundColor: '#4a4a4a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#ffffff',
  },
  hintText: {
    fontSize: 12,
    color: '#c5c5c5',
    marginBottom: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#4a4a4a',
  },
  cancelButtonText: {
    color: '#c5c5c5',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#a82828',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  searchResults: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#6a6a6a',
    borderRadius: 5,
    marginBottom: 15,
  },
  foodResult: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#6a6a6a',
  },
  foodResultName: {
    fontSize: 16,
    fontWeight: '500',
  },
  foodResultCategory: {
    fontSize: 12,
    color: '#c5c5c5',
    marginTop: 2,
  },
  selectedFoodInfo: {
    backgroundColor: '#4a4a4a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  selectedFoodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a82828',
  },
  selectedFoodDetails: {
    fontSize: 12,
    color: '#c5c5c5',
    marginTop: 2,
  },
  nutritionInfo: {
    backgroundColor: '#4a4a4a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  nutritionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#ffffff',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nutritionItem: {
    fontSize: 12,
    color: '#c5c5c5',
    flex: 1,
  },
  disabledButton: {
    backgroundColor: '#555555',
  },
  disabledText: {
    color: '#a0a0a0',
  },
  deleteConfirmModal: {
    backgroundColor: '#3c3c3c',
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
  apiWarning: {
    backgroundColor: '#8b4513',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#a82828',
  },
  apiWarningText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  apiWarningSubtext: {
    color: '#e0e0e0',
    fontSize: 12,
  },
  searchingText: {
    color: '#a82828',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 5,
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
  inputMethodSection: {
    marginBottom: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#6a6a6a',
  },
  inputMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#ffffff',
  },
  inputMethodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  inputMethodButton: {
    backgroundColor: '#4a4a4a',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#6a6a6a',
  },
  inputMethodIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  inputMethodText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputMethodDivider: {
    alignItems: 'center',
    marginVertical: 10,
  },
  inputMethodDividerText: {
    color: '#c5c5c5',
    fontSize: 12,
    fontStyle: 'italic',
  },
});