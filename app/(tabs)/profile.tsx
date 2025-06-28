import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { UserProfile } from '../../src/types';
import { getUserProfile, saveUserProfile, clearAllData } from '../../src/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateBiometricMeasurements, getMeasurementEquivalents } from '../../src/utils/biometricCalculator';
import { formatWeight, formatHeight, formatWeightChange, parseWeight, parseHeight, parseWeightChange, getDisplayWeight, kgToLbs, formatVolume } from '../../src/utils/unitConversions';
import { colors } from '../../src/styles/colors';

export default function ProfileScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [displayValues, setDisplayValues] = useState({
    height: '',
    weight: '',
    targetWeight: '',
    weeklyWeightChange: '',
    proteinGoal: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  // Refresh profile data when screen is focused (e.g., coming back from Progress tab)
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const profile = await getUserProfile();
      console.log('Profile loaded:', profile?.height, 'cm');
      setUserProfile(profile);
      setEditedProfile(profile);
      
      if (profile && profile.height > 0) {
        // Initialize display values in imperial units
        const formattedHeight = formatHeight(profile.height, 'imperial');
        console.log('Formatted height:', formattedHeight, 'from', profile.height, 'cm');
        
        setDisplayValues({
          height: formattedHeight, // Keep the full formatted string (e.g., "5'10"")
          weight: getDisplayWeight(profile.weight, 'imperial'),
          targetWeight: getDisplayWeight(profile.goals.targetWeight, 'imperial'),
          weeklyWeightChange: Math.abs(profile.goals.weeklyWeightChange) === 0 ? '0' : 
            (Math.round(kgToLbs(profile.goals.weeklyWeightChange) * 10) / 10).toString(),
          proteinGoal: profile.goals.dailyProtein.toString(),
        });
      } else {
        console.log('Profile missing or invalid height:', profile?.height);
        // Set default display values if profile is invalid
        setDisplayValues({
          height: '',
          weight: '',
          targetWeight: '',
          weeklyWeightChange: '0',
          proteinGoal: '100',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    if (!editedProfile) return;

    try {
      // Convert display values back to metric for storage (always from imperial)
      console.log('Converting height from display:', displayValues.height);
      const heightInCm = parseHeight(displayValues.height, 'imperial');
      console.log('Parsed height in cm:', heightInCm);
      
      // Validate height - don't allow unrealistic values
      if (heightInCm < 120 || heightInCm > 250) {
        Alert.alert('Error', 'Please enter a valid height between 4\'0" and 8\'2"');
        return;
      }
      
      const weightInKg = parseWeight(displayValues.weight, 'imperial');
      const targetWeightInKg = parseWeight(displayValues.targetWeight, 'imperial');
      const weeklyWeightChangeInKg = parseWeightChange(displayValues.weeklyWeightChange, 'imperial');
      const proteinGoalGrams = parseInt(displayValues.proteinGoal) || editedProfile.goals.dailyProtein;

      // Recalculate biometric measurements if height/weight changed
      const updatedBiometrics = calculateBiometricMeasurements(
        heightInCm,
        weightInKg,
        editedProfile.gender
      );

      // Recalculate daily calories
      const BMR = editedProfile.gender === 'male'
        ? 88.362 + (13.397 * weightInKg) + (4.799 * heightInCm) - (5.677 * editedProfile.age)
        : 447.593 + (9.247 * weightInKg) + (3.098 * heightInCm) - (4.330 * editedProfile.age);

      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
      };

      const dailyCalories = Math.round(BMR * activityMultipliers[editedProfile.activityLevel]);
      const calorieAdjustment = weeklyWeightChangeInKg * 7700 / 7;
      const adjustedCalories = Math.round(dailyCalories + calorieAdjustment);

      const updatedProfile: UserProfile = {
        ...editedProfile,
        height: heightInCm,
        weight: weightInKg,
        unitSystem: 'imperial', // Always imperial
        biometricMeasurements: updatedBiometrics,
        goals: {
          ...editedProfile.goals,
          targetWeight: targetWeightInKg,
          weeklyWeightChange: weeklyWeightChangeInKg,
          dailyCalories: adjustedCalories,
          dailyProtein: proteinGoalGrams,
        },
      };

      await saveUserProfile(updatedProfile);
      setUserProfile(updatedProfile);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const handleClearData = () => {
    console.log('Clear Data button clicked');
    
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your data including workouts, food entries, and profile. This cannot be undone.\n\nAre you sure you want to continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: () => {
            console.log('User confirmed delete all');
            performClearData();
          },
        },
      ]
    );
  };

  const performClearData = async () => {
    try {
      console.log('Calling clearAllData...');
      await clearAllData();
      console.log('clearAllData completed');
      
      Alert.alert('Profile Reset Complete', 'All data has been cleared. Please close and reopen the app to start fresh.');
      console.log('User acknowledged reset complete');
    } catch (error) {
      console.error('Error clearing data:', error);
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  const renderMeasurementEquivalents = () => {
    if (!userProfile) return null;
    
    const equivalents = getMeasurementEquivalents(userProfile);
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Measurement Guide</Text>
        
        <View style={styles.measurementSection}>
          <Text style={styles.measurementTitle}>🤛 Your Fist (~{formatVolume(equivalents.fist.volume, 'imperial')})</Text>
          {Object.entries(equivalents.fist.equivalents).map(([food, amount]) => (
            <Text key={food} style={styles.equivalentText}>• {food}: {amount}</Text>
          ))}
        </View>

        <View style={styles.measurementSection}>
          <Text style={styles.measurementTitle}>👍 Your Thumb (~{formatVolume(equivalents.thumb.volume, 'imperial')})</Text>
          {Object.entries(equivalents.thumb.equivalents).map(([food, amount]) => (
            <Text key={food} style={styles.equivalentText}>• {food}: {amount}</Text>
          ))}
        </View>

        <View style={styles.measurementSection}>
          <Text style={styles.measurementTitle}>👌 Your Pinky (~{formatVolume(equivalents.pinky.volume, 'imperial')})</Text>
          {Object.entries(equivalents.pinky.equivalents).map(([food, amount]) => (
            <Text key={food} style={styles.equivalentText}>• {food}: {amount}</Text>
          ))}
        </View>
      </View>
    );
  };

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (isEditing) {
                setEditedProfile(userProfile);
              }
              setIsEditing(!isEditing);
            }}
          >
            <Text style={styles.editButtonText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name:</Text>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={editedProfile?.name || ''}
                onChangeText={(text) => 
                  setEditedProfile(prev => prev ? {...prev, name: text} : null)
                }
              />
            ) : (
              <Text style={styles.value}>{userProfile.name}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Unit System:</Text>
            <Text style={styles.value}>US (lbs, ft/in, fl oz)</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Height:</Text>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={displayValues.height}
                onChangeText={(text) => 
                  setDisplayValues(prev => ({...prev, height: text}))
                }
                keyboardType="decimal-pad"
                placeholder="5'10&quot; or 70"
              />
            ) : (
              <Text style={styles.value}>
                {formatHeight(userProfile.height, 'imperial')}
              </Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Weight:</Text>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={displayValues.weight}
                onChangeText={(text) => 
                  setDisplayValues(prev => ({...prev, weight: text}))
                }
                keyboardType="decimal-pad"
                placeholder="lbs"
              />
            ) : (
              <Text style={styles.value}>
                {formatWeight(userProfile.weight, 'imperial')}
              </Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Age:</Text>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={editedProfile?.age.toString() || ''}
                onChangeText={(text) => 
                  setEditedProfile(prev => prev ? {...prev, age: parseInt(text) || 0} : null)
                }
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.value}>{userProfile.age} years</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Gender:</Text>
            <Text style={styles.value}>{userProfile.gender}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Target Weight:</Text>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={displayValues.targetWeight}
                onChangeText={(text) => 
                  setDisplayValues(prev => ({...prev, targetWeight: text}))
                }
                keyboardType="decimal-pad"
                placeholder="lbs"
              />
            ) : (
              <Text style={styles.value}>
                {formatWeight(userProfile.goals.targetWeight, 'imperial')}
              </Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Weekly Change:</Text>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={displayValues.weeklyWeightChange}
                onChangeText={(text) => 
                  setDisplayValues(prev => ({...prev, weeklyWeightChange: text}))
                }
                keyboardType="numbers-and-punctuation"
                placeholder="-1 for loss, +1 for gain"
              />
            ) : (
              <Text style={styles.value}>
                {formatWeightChange(userProfile.goals.weeklyWeightChange, 'imperial')}
              </Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Daily Calories:</Text>
            <Text style={styles.value}>{userProfile.goals.dailyCalories} cal</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Daily Protein:</Text>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={displayValues.proteinGoal}
                onChangeText={(text) => 
                  setDisplayValues(prev => ({...prev, proteinGoal: text}))
                }
                keyboardType="numeric"
                placeholder="grams"
              />
            ) : (
              <Text style={styles.value}>{userProfile.goals.dailyProtein} g</Text>
            )}
          </View>
        </View>

        {renderMeasurementEquivalents()}

        {isEditing && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}

        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.clearDataButton} onPress={handleClearData}>
            <Text style={styles.clearDataText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#4a4a4a',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#6a6a6a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#a82828',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#4a4a4a',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#6a6a6a',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#c5c5c5',
    flex: 1,
    textAlign: 'right',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#6a6a6a',
    borderRadius: 5,
    padding: 8,
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
  },
  measurementSection: {
    marginBottom: 15,
  },
  measurementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  equivalentText: {
    fontSize: 14,
    color: '#c5c5c5',
    marginLeft: 10,
    marginBottom: 2,
  },
  saveButton: {
    backgroundColor: '#28a745',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  dangerSection: {
    margin: 15,
    marginTop: 30,
  },
  clearDataButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearDataText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});