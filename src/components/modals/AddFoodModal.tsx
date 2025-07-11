import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { UserProfile } from '../../types/index';
import { FoodItem } from '../../data/foodDatabase';
import { VisualPortionSelector, VisualPortions, calculateTotalInUnit } from '../VisualPortionSelector';
import { formatVolume } from '../../utils/unitConversions';
import { foodScreenStyles as styles } from '../../styles/foodScreenStyles';

interface AddFoodModalProps {
  visible: boolean;
  onClose: () => void;
  selectedMeal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  editingEntry: any;
  selectedFood: FoodItem | null;
  amount: string;
  unit: 'g' | 'ml' | 'fist' | 'thumb' | 'pinky';
  calculatedCalories: number;
  calculatedNutrition: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  searchQuery: string;
  searchResults: FoodItem[];
  isSearching: boolean;
  apiStatus: { configured: boolean; message: string };
  showCustomInput: boolean;
  useVisualPortions: boolean;
  servingUnit: string;
  visualPortions: VisualPortions;
  customFoodData: {
    name: string;
    calories: string;
    servings: string;
    protein: string;
    carbs: string;
    fat: string;
  };
  userProfile: UserProfile | null;
  onSetShowCustomInput: (show: boolean) => void;
  onSetShowFoodCamera: (show: boolean) => void;
  onHandleSearchFood: (query: string) => void;
  onSelectFood: (food: FoodItem) => void;
  onHandleAmountChange: (amount: string) => void;
  onHandleUnitChange: (unit: 'g' | 'ml' | 'fist' | 'thumb' | 'pinky') => void;
  onSetUseVisualPortions: (use: boolean) => void;
  onSetVisualPortions: (portions: VisualPortions) => void;
  onSetServingUnit: (unit: string) => void;
  onSetCustomFoodData: (data: any) => void;
  onSaveFood: () => void;
  onSaveCustomFood: () => void;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  visible,
  onClose,
  selectedMeal,
  editingEntry,
  selectedFood,
  amount,
  unit,
  calculatedCalories,
  calculatedNutrition,
  searchQuery,
  searchResults,
  isSearching,
  apiStatus,
  showCustomInput,
  useVisualPortions,
  servingUnit,
  visualPortions,
  customFoodData,
  userProfile,
  onSetShowCustomInput,
  onSetShowFoodCamera,
  onHandleSearchFood,
  onSelectFood,
  onHandleAmountChange,
  onHandleUnitChange,
  onSetUseVisualPortions,
  onSetVisualPortions,
  onSetServingUnit,
  onSetCustomFoodData,
  onSaveFood,
  onSaveCustomFood,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <ScrollView 
          contentContainerStyle={showCustomInput ? styles.modalScrollContainerCustom : styles.modalScrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
          keyboardDismissMode="interactive"
          contentInsetAdjustmentBehavior="automatic"
        >
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
                    onPress={() => onSetShowCustomInput(true)}
                  >
                    <Text style={styles.inputMethodIcon}>✏️</Text>
                    <Text style={styles.inputMethodText}>Custom Food Input</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.inputMethodButton}
                    onPress={() => {
                      onClose();
                      onSetShowFoodCamera(true);
                    }}
                  >
                    <Text style={styles.inputMethodIcon}>📷</Text>
                    <Text style={styles.inputMethodText}>Camera Recognition</Text>
                    <Text style={styles.inputMethodBeta}>BETA</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.inputMethodDivider}>
                  <Text style={styles.inputMethodDividerText}>or continue with search below</Text>
                </View>
              </View>
            )}
            
            {/* Custom Food Input Form */}
            {showCustomInput && !selectedFood && (
              <View style={styles.customInputSection}>
                <Text style={styles.customInputTitle}>Manual Food Entry</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Food Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g., Restaurant Pasta, Protein Bar"
                    value={customFoodData.name}
                    onChangeText={(text) => onSetCustomFoodData((prev: any) => ({...prev, name: text}))}
                    placeholderTextColor="#999"
                  />
                </View>
                
                {/* Portion Size Section */}
                <View style={styles.portionSizeSection}>
                  <View style={styles.servingSizeHeader}>
                    <Text style={styles.sectionTitle}>Portion Size *</Text>
                    <TouchableOpacity 
                      style={styles.toggleButton}
                      onPress={() => onSetUseVisualPortions(!useVisualPortions)}
                    >
                      <Text style={styles.toggleButtonText}>
                        {useVisualPortions ? '👁️ Visual' : '🔢 Number'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {!useVisualPortions ? (
                    <View style={styles.numberInputContainer}>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="1"
                        value={customFoodData.servings}
                        onChangeText={(text) => onSetCustomFoodData((prev: any) => ({...prev, servings: text}))}
                        keyboardType="decimal-pad"
                        placeholderTextColor="#999"
                      />
                      <Text style={styles.servingUnitLabel}>servings</Text>
                    </View>
                  ) : (
                    <VisualPortionSelector
                      visualPortions={visualPortions}
                      onPortionsChange={onSetVisualPortions}
                      servingUnit={servingUnit}
                      onUnitChange={onSetServingUnit}
                      userBiometrics={userProfile?.biometricMeasurements || { fistVolume: 250, thumbVolume: 15, pinkyVolume: 5 }}
                    />
                  )}
                </View>
                
                {/* Nutrition Information Section */}
                <Text style={styles.sectionTitle}>Nutrition Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Calories per {useVisualPortions ? servingUnit : 'serving'} *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="350"
                    value={customFoodData.calories}
                    onChangeText={(text) => onSetCustomFoodData((prev: any) => ({...prev, calories: text}))}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
                
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Protein (g)</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="0"
                      value={customFoodData.protein}
                      onChangeText={(text) => onSetCustomFoodData((prev: any) => ({...prev, protein: text}))}
                      keyboardType="decimal-pad"
                      placeholderTextColor="#999"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Carbs (g)</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="0"
                      value={customFoodData.carbs}
                      onChangeText={(text) => onSetCustomFoodData((prev: any) => ({...prev, carbs: text}))}
                      keyboardType="decimal-pad"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fat (g)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="0"
                    value={customFoodData.fat}
                    onChangeText={(text) => onSetCustomFoodData((prev: any) => ({...prev, fat: text}))}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#999"
                  />
                </View>
                
                {customFoodData.name && customFoodData.calories && ((!useVisualPortions && customFoodData.servings) || (useVisualPortions && calculateTotalInUnit(visualPortions, servingUnit, userProfile?.biometricMeasurements || { fistVolume: 250, thumbVolume: 15, pinkyVolume: 5 }) > 0)) && (
                  <View style={styles.nutritionInfo}>
                    <Text style={styles.nutritionTitle}>Total Nutrition</Text>
                    {(() => {
                      const servingMultiplier = useVisualPortions 
                        ? calculateTotalInUnit(visualPortions, servingUnit, userProfile?.biometricMeasurements || { fistVolume: 250, thumbVolume: 15, pinkyVolume: 5 })
                        : (parseFloat(customFoodData.servings) || 1);
                      
                      return (
                        <>
                          <View style={styles.nutritionRow}>
                            <Text style={styles.nutritionItem}>
                              🔥 {Math.round((parseFloat(customFoodData.calories) || 0) * servingMultiplier)} cal
                            </Text>
                            <Text style={styles.nutritionItem}>
                              🥩 {Math.round(((parseFloat(customFoodData.protein) || 0) * servingMultiplier) * 10) / 10}g protein
                            </Text>
                          </View>
                          <View style={styles.nutritionRow}>
                            <Text style={styles.nutritionItem}>
                              🍞 {Math.round(((parseFloat(customFoodData.carbs) || 0) * servingMultiplier) * 10) / 10}g carbs
                            </Text>
                            <Text style={styles.nutritionItem}>
                              🥑 {Math.round(((parseFloat(customFoodData.fat) || 0) * servingMultiplier) * 10) / 10}g fat
                            </Text>
                          </View>
                        </>
                      );
                    })()}
                  </View>
                )}
                
                <View style={styles.customInputButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => onSetShowCustomInput(false)}
                  >
                    <Text style={styles.cancelButtonText}>Back to Search</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton, 
                      styles.saveButton,
                      (!customFoodData.name || !customFoodData.calories || (!useVisualPortions && !customFoodData.servings) || (useVisualPortions && calculateTotalInUnit(visualPortions, servingUnit, userProfile?.biometricMeasurements || { fistVolume: 250, thumbVolume: 15, pinkyVolume: 5 }) === 0)) && styles.disabledButton
                    ]}
                    onPress={() => {
                      if (!customFoodData.name || !customFoodData.calories) {
                        Alert.alert('Error', 'Please fill in food name and calories per serving');
                        return;
                      }
                      if (!useVisualPortions && !customFoodData.servings) {
                        Alert.alert('Error', 'Please enter the number of servings');
                        return;
                      }
                      if (useVisualPortions && calculateTotalInUnit(visualPortions, servingUnit, userProfile?.biometricMeasurements || { fistVolume: 250, thumbVolume: 15, pinkyVolume: 5 }) === 0) {
                        Alert.alert('Error', 'Please select at least one visual portion');
                        return;
                      }
                      onSaveCustomFood();
                    }}
                    disabled={!customFoodData.name || !customFoodData.calories || (!useVisualPortions && !customFoodData.servings) || (useVisualPortions && calculateTotalInUnit(visualPortions, servingUnit, userProfile?.biometricMeasurements || { fistVolume: 250, thumbVolume: 15, pinkyVolume: 5 }) === 0)}
                  >
                    <Text style={[
                      styles.saveButtonText,
                      (!customFoodData.name || !customFoodData.calories || (!useVisualPortions && !customFoodData.servings) || (useVisualPortions && calculateTotalInUnit(visualPortions, servingUnit, userProfile?.biometricMeasurements || { fistVolume: 250, thumbVolume: 15, pinkyVolume: 5 }) === 0)) && styles.disabledText
                    ]}>
                      Add Custom Food
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {/* API Status Indicator - only show when not using custom input */}
            {!showCustomInput && !apiStatus.configured && (
              <View style={styles.apiWarning}>
                <Text style={styles.apiWarningText}>⚠️ USDA API not configured</Text>
                <Text style={styles.apiWarningSubtext}>
                  Please add your API key to use the food database
                </Text>
              </View>
            )}
            
            {/* Search Section - hide when using custom input */}
            {!showCustomInput && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Search Food</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={apiStatus.configured ? "Search 400,000+ foods (e.g., chicken breast)" : "Please configure USDA API key first"}
                  value={searchQuery}
                  onChangeText={onHandleSearchFood}
                  editable={apiStatus.configured}
                />
                {isSearching && (
                  <Text style={styles.searchingText}>Searching USDA database...</Text>
                )}
              </View>
            )}

            {!showCustomInput && searchResults.length > 0 && (
              <ScrollView style={styles.searchResults} nestedScrollEnabled>
                {searchResults.slice(0, 8).map((food) => (
                  <TouchableOpacity
                    key={food.id}
                    style={styles.foodResult}
                    onPress={() => onSelectFood(food)}
                  >
                    <Text style={styles.foodResultName}>{food.name}</Text>
                    <Text style={styles.foodResultCategory}>{food.category}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {!showCustomInput && selectedFood && (
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
                      onChangeText={onHandleAmountChange}
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
                          onPress={() => onHandleUnitChange(unitOption as any)}
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

            {!showCustomInput && (
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton, 
                    styles.saveButton,
                    (!selectedFood || !amount) && styles.disabledButton
                  ]}
                  onPress={onSaveFood}
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
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};