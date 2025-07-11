import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FoodEntry, UserProfile } from '../../src/types';
import { getFoodEntries, getUserProfile, saveFoodEntry, updateFoodEntry, deleteFoodEntry } from '../../src/utils/storage';
import { convertBiometricToAmount } from '../../src/utils/biometricCalculator';
import { searchFoods, getPopularFoods, getApiStatus, FoodItem } from '../../src/data/foodDatabase';
import { formatVolume } from '../../src/utils/unitConversions';
import { CalendarPicker } from '../../src/components/CalendarPicker';
import { FoodCamera } from '../../src/components/FoodCamera';
import { VisualPortions, calculateTotalInUnit } from '../../src/components/VisualPortionSelector';
import { AddFoodModal } from '../../src/components/modals/AddFoodModal';
import { DeleteConfirmModal } from '../../src/components/modals/DeleteConfirmModal';
import { MealSection } from '../../src/components/MealSection';
import { 
  calculateEntryCalories, 
  calculateEntryProtein, 
  calculateMealCalories, 
  calculateMealProtein,
  calculateTotalCalories,
  calculateTotalProtein,
  calculateNutrition
} from '../../src/services/nutritionCalculator';
import { foodScreenStyles as styles } from '../../src/styles/foodScreenStyles';

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
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [useVisualPortions, setUseVisualPortions] = useState(false);
  const [servingUnit, setServingUnit] = useState('cup');
  const [visualPortions, setVisualPortions] = useState<VisualPortions>({
    fists: 0,
    thumbs: 0,
    pinkies: 0,
  });
  const [customFoodData, setCustomFoodData] = useState({
    name: '',
    calories: '',
    servings: '',
    protein: '',
    carbs: '',
    fat: '',
  });


  useEffect(() => {
    loadData();
    checkApiStatus();
  }, [selectedDate]);

  // Refresh profile data when screen is focused to get updated biometric measurements
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

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

  const totalCalories = calculateTotalCalories(foodEntries);
  const totalProtein = calculateTotalProtein(foodEntries);

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
    setShowCustomInput(false); // Reset custom input state
    setUseVisualPortions(false); // Reset visual portions mode
    setServingUnit('cup');
    setVisualPortions({
      fists: 0,
      thumbs: 0,
      pinkies: 0,
    });
    setCustomFoodData({
      name: '',
      calories: '',
      servings: '',
      protein: '',
      carbs: '',
      fat: '',
    });
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
    updateNutrition(food, amount, unit);
  };

  const updateNutrition = (food: FoodItem | null, amountStr: string, selectedUnit: string) => {
    const nutrition = calculateNutrition(food, amountStr, selectedUnit, userProfile);
    setCalculatedCalories(nutrition.calories);
    setCalculatedNutrition({
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      fiber: nutrition.fiber,
    });
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    updateNutrition(selectedFood, value, unit);
  };

  const handleUnitChange = (newUnit: 'g' | 'ml' | 'fist' | 'thumb' | 'pinky') => {
    setUnit(newUnit);
    updateNutrition(selectedFood, amount, newUnit);
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

  const saveCustomFood = async () => {
    if (!userProfile) {
      Alert.alert('Error', 'User profile not found');
      return;
    }

    try {
      const servingMultiplier = useVisualPortions 
        ? calculateTotalInUnit(visualPortions, servingUnit, userProfile?.biometricMeasurements || { fistVolume: 250, thumbVolume: 15, pinkyVolume: 5 })
        : (parseFloat(customFoodData.servings) || 1);
        
      const totalCalories = (parseFloat(customFoodData.calories) || 0) * servingMultiplier;
      const totalProtein = (parseFloat(customFoodData.protein) || 0) * servingMultiplier;
      const totalCarbs = (parseFloat(customFoodData.carbs) || 0) * servingMultiplier;
      const totalFat = (parseFloat(customFoodData.fat) || 0) * servingMultiplier;

      // Create a custom food entry with estimated weight (100g per serving as default)
      const estimatedWeight = 100 * (parseFloat(customFoodData.servings) || 1);
      const caloriesPerGram = totalCalories / estimatedWeight;

      const foodEntry: FoodEntry = {
        id: Date.now().toString(),
        foodId: `custom_${Date.now()}`,
        amount: estimatedWeight,
        unit: 'g',
        date: selectedDate,
        meal: selectedMeal,
        caloriesPerGram: caloriesPerGram,
        foodName: customFoodData.name,
      };

      await saveFoodEntry(foodEntry);
      Alert.alert('Success', 'Custom food added successfully!');
      
      // Reload data
      const entries = await getFoodEntries(selectedDate);
      setFoodEntries(entries);
      
      setShowAddFood(false);
      setShowCustomInput(false);
      setUseVisualPortions(false);
      setServingUnit('cup');
      setVisualPortions({
        fists: 0,
        thumbs: 0,
        pinkies: 0,
      });
      setCustomFoodData({
        name: '',
        calories: '',
        servings: '',
        protein: '',
        carbs: '',
        fat: '',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save custom food entry');
    }
  };

  const editFoodEntry = (entry: FoodEntry) => {
    // Use stored food data instead of async lookup
    if (!entry.foodName || !entry.caloriesPerGram) {
      Alert.alert('Error', 'Food data not available for editing. Please add this food again.');
      return;
    }

    // Create food object from stored entry data
    const food = {
      id: entry.foodId,
      name: entry.foodName,
      caloriesPerGram: entry.caloriesPerGram,
      category: 'Unknown',
      protein: 0, // Will be estimated
      carbs: 0,
      fat: 0, 
      fiber: 0,
      searchTerms: []
    };

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
    
    updateNutrition(food, displayAmount.toString(), displayUnit);
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
    
    return (
      <View style={styles.measurementGuide}>
        <Text style={styles.guideTitle}>Your Biometric Measurements</Text>
        <View style={styles.guideRow}>
          <Text style={styles.guideItem}>🤛 Fist: ~{formatVolume(userProfile.biometricMeasurements.fistVolume, 'imperial')}</Text>
          <Text style={styles.guideItem}>👍 Thumb: ~{formatVolume(userProfile.biometricMeasurements.thumbVolume, 'imperial')}</Text>
          <Text style={styles.guideItem}>👌 Pinky: ~{formatVolume(userProfile.biometricMeasurements.pinkyVolume, 'imperial')}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
            <MealSection
              key={meal}
              meal={meal as 'breakfast' | 'lunch' | 'dinner' | 'snack'}
              entries={getMealEntries(meal)}
              mealCalories={calculateMealCalories(foodEntries, meal)}
              mealProtein={calculateMealProtein(foodEntries, meal)}
              onAddFood={openAddFood}
              onEditEntry={editFoodEntry}
              onDeleteEntry={confirmDeleteEntry}
              calculateEntryCalories={calculateEntryCalories}
              calculateEntryProtein={calculateEntryProtein}
            />
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

      <AddFoodModal
        visible={showAddFood}
        onClose={() => setShowAddFood(false)}
        selectedMeal={selectedMeal}
        editingEntry={editingEntry}
        selectedFood={selectedFood}
        amount={amount}
        unit={unit}
        calculatedCalories={calculatedCalories}
        calculatedNutrition={calculatedNutrition}
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        apiStatus={apiStatus}
        showCustomInput={showCustomInput}
        useVisualPortions={useVisualPortions}
        servingUnit={servingUnit}
        visualPortions={visualPortions}
        customFoodData={customFoodData}
        userProfile={userProfile}
        onSetShowCustomInput={setShowCustomInput}
        onSetShowFoodCamera={setShowFoodCamera}
        onHandleSearchFood={handleSearchFood}
        onSelectFood={selectFood}
        onHandleAmountChange={handleAmountChange}
        onHandleUnitChange={handleUnitChange}
        onSetUseVisualPortions={setUseVisualPortions}
        onSetVisualPortions={setVisualPortions}
        onSetServingUnit={setServingUnit}
        onSetCustomFoodData={setCustomFoodData}
        onSaveFood={saveFood}
        onSaveCustomFood={saveCustomFood}
      />

      <DeleteConfirmModal
        visible={!!showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={deleteFoodEntryConfirmed}
      />
      
      <FoodCamera
        visible={showFoodCamera}
        onClose={() => setShowFoodCamera(false)}
        onFoodRecognized={(result) => {
          // Convert camera recognition result to food format
          const recognizedFood = {
            id: `camera_${Date.now()}`,
            name: result.foodName,
            caloriesPerGram: result.estimatedCalories / result.estimatedWeight,
            category: 'Camera Recognition',
            protein: 0, // Will be estimated based on food type
            carbs: 0,
            fat: 0,
            fiber: 0,
            searchTerms: []
          };
          
          setSelectedFood(recognizedFood);
          setAmount(result.estimatedWeight.toString());
          setUnit('g');
          setShowFoodCamera(false);
          setShowAddFood(true);
          
          // Calculate nutrition values
          updateNutrition(recognizedFood, result.estimatedWeight.toString(), 'g');
        }}
      />
    </SafeAreaView>
  );
}

