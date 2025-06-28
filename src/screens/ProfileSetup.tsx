import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { UserProfile } from '../types';
import { saveUserProfile } from '../utils/storage';
import { calculateBiometricMeasurements } from '../utils/biometricCalculator';
import { parseWeight, parseHeight, parseWeightChange, formatWeight, formatHeight } from '../utils/unitConversions';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

export const ProfileSetup: React.FC<Props> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    height: '',
    weight: '',
    age: '',
    gender: 'male' as 'male' | 'female',
    activityLevel: 'moderate' as UserProfile['activityLevel'],
    unitSystem: 'imperial' as 'metric' | 'imperial',
    targetWeight: '',
    weeklyWeightChange: '',
    proteinGoal: '',
  });

  const handleSubmit = async () => {
    console.log('Form submission started');
    console.log('Form data:', formData);
    
    // Validation
    console.log('Checking required fields...');
    console.log('Name check:', !!formData.name, 'Value:', formData.name);
    console.log('Height check:', !!formData.height, 'Value:', formData.height);
    console.log('Weight check:', !!formData.weight, 'Value:', formData.weight);
    console.log('Age check:', !!formData.age, 'Value:', formData.age);
    
    if (!formData.name || !formData.height || !formData.weight || !formData.age) {
      console.log('Validation failed - missing required fields');
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    console.log('Required fields validation passed');
    
    const height = parseFloat(formData.height);
    const weight = parseFloat(formData.weight);
    const age = parseInt(formData.age);
    const targetWeight = parseFloat(formData.targetWeight) || weight;
    const weeklyWeightChange = parseFloat(formData.weeklyWeightChange) || 0;

    console.log('Parsed values:', { height, weight, age, targetWeight, weeklyWeightChange });

    if (height <= 0 || weight <= 0 || age <= 0) {
      console.log('Number validation failed');
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }
    
    console.log('All validation passed, proceeding...');

    // Convert all inputs to metric for internal storage
    const heightInCm = parseHeight(formData.height, formData.unitSystem);
    const weightInKg = parseWeight(formData.weight, formData.unitSystem);
    const targetWeightInKg = formData.targetWeight ? parseWeight(formData.targetWeight, formData.unitSystem) : weightInKg;
    const weeklyWeightChangeInKg = formData.weeklyWeightChange ? parseWeightChange(formData.weeklyWeightChange, formData.unitSystem) : 0;

    console.log('Converted values:', { heightInCm, weightInKg, targetWeightInKg, weeklyWeightChangeInKg });

    if (heightInCm <= 0 || weightInKg <= 0 || age <= 0) {
      console.log('Converted number validation failed');
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    try {
      // Calculate biometric measurements using metric values
      console.log('Calculating biometric measurements...');
      console.log('About to call calculateBiometricMeasurements with:', { height: heightInCm, weight: weightInKg, gender: formData.gender });
      
      const biometricMeasurements = calculateBiometricMeasurements(
        heightInCm,
        weightInKg,
        formData.gender
      );
      console.log('Biometric measurements result:', biometricMeasurements);

      // Calculate daily calories (basic formula) using metric values
      const BMR = formData.gender === 'male'
        ? 88.362 + (13.397 * weightInKg) + (4.799 * heightInCm) - (5.677 * age)
        : 447.593 + (9.247 * weightInKg) + (3.098 * heightInCm) - (4.330 * age);

      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
      };

      const dailyCalories = Math.round(BMR * activityMultipliers[formData.activityLevel]);
      const calorieAdjustment = weeklyWeightChangeInKg * 7700 / 7; // 7700 cal per kg
      const adjustedCalories = Math.round(dailyCalories + calorieAdjustment);

      // Calculate protein goal based on weight and activity level
      // Standard recommendations: 0.8-2.2g per kg body weight
      const proteinMultipliers = {
        sedentary: 0.8,      // 0.8g/kg for sedentary
        light: 1.2,          // 1.2g/kg for light activity
        moderate: 1.6,       // 1.6g/kg for moderate activity
        active: 1.8,         // 1.8g/kg for active
        very_active: 2.2,    // 2.2g/kg for very active
      };

      const calculatedProtein = Math.round(weightInKg * proteinMultipliers[formData.activityLevel]);
      const userProteinGoal = formData.proteinGoal ? parseInt(formData.proteinGoal) : calculatedProtein;
      const finalProteinGoal = userProteinGoal > 0 ? userProteinGoal : calculatedProtein;

      console.log('Calculated nutrition:', { BMR, dailyCalories, adjustedCalories, calculatedProtein, finalProteinGoal });

      const profile: UserProfile = {
        id: Date.now().toString(),
        name: formData.name,
        height: heightInCm,
        weight: weightInKg,
        startingWeight: weightInKg, // Set starting weight for progress tracking
        age,
        gender: formData.gender,
        activityLevel: formData.activityLevel,
        unitSystem: formData.unitSystem,
        goals: {
          targetWeight: targetWeightInKg,
          weeklyWeightChange: weeklyWeightChangeInKg,
          dailyCalories: adjustedCalories,
          dailyProtein: finalProteinGoal,
        },
        biometricMeasurements,
      };

      console.log('Final profile:', profile);
      console.log('Saving profile...');
      
      await saveUserProfile(profile);
      console.log('Profile saved successfully');
      
      onComplete(profile);
      console.log('onComplete called');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error', `Failed to save profile: ${error.message || error}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        keyboardDismissMode="interactive"
      >
        <Text style={styles.title}>Set Up Your Profile</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Enter your name"
          placeholderTextColor="#a0a0a0"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Height (ft&apos;in&quot;) *
        </Text>
        <TextInput
          style={styles.input}
          value={formData.height}
          onChangeText={(text) => setFormData({ ...formData, height: text })}
          placeholder="5'10&quot; or 70"
          placeholderTextColor="#a0a0a0"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Weight (lbs) *
        </Text>
        <TextInput
          style={styles.input}
          value={formData.weight}
          onChangeText={(text) => setFormData({ ...formData, weight: text })}
          placeholder="150"
          placeholderTextColor="#a0a0a0"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Age *</Text>
        <TextInput
          style={styles.input}
          value={formData.age}
          onChangeText={(text) => setFormData({ ...formData, age: text })}
          placeholder="25"
          placeholderTextColor="#a0a0a0"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.optionButton, formData.gender === 'male' && styles.selectedOption]}
            onPress={() => setFormData({ ...formData, gender: 'male' })}
          >
            <Text style={[styles.optionText, formData.gender === 'male' && styles.selectedText]}>
              Male
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, formData.gender === 'female' && styles.selectedOption]}
            onPress={() => setFormData({ ...formData, gender: 'female' })}
          >
            <Text style={[styles.optionText, formData.gender === 'female' && styles.selectedText]}>
              Female
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Unit system removed - using US/Imperial only */}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Target Weight (lbs)
        </Text>
        <TextInput
          style={styles.input}
          value={formData.targetWeight}
          onChangeText={(text) => setFormData({ ...formData, targetWeight: text })}
          placeholder="Optional - defaults to current weight"
          placeholderTextColor="#a0a0a0"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Weekly Weight Change (lbs)
        </Text>
        <TextInput
          style={styles.input}
          value={formData.weeklyWeightChange}
          onChangeText={(text) => setFormData({ ...formData, weeklyWeightChange: text })}
          placeholder="1 for gain, -1 for loss"
          placeholderTextColor="#a0a0a0"
          keyboardType="numbers-and-punctuation"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Daily Protein Goal (grams)
        </Text>
        <TextInput
          style={styles.input}
          value={formData.proteinGoal}
          onChangeText={(text) => setFormData({ ...formData, proteinGoal: text })}
          placeholder="Optional - will calculate based on activity level"
          placeholderTextColor="#a0a0a0"
          keyboardType="numeric"
        />
        <Text style={styles.helpText}>
          Recommended: Sedentary (0.36g/lb), Active (0.73g/lb), Very Active (1.0g/lb)
        </Text>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Create Profile</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#3c3c3c',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40, // Extra top padding for Dynamic Island/notch
    paddingBottom: 100, // Extra bottom padding for keyboard
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#6a6a6a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#4a4a4a',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#6a6a6a',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4a4a4a',
  },
  selectedOption: {
    backgroundColor: '#a82828',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
    color: '#ffffff',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#c5c5c5',
    marginTop: 5,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#a82828',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});