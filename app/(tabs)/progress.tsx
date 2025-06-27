import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { UserProfile, FoodEntry, WorkoutSession } from '../../src/types';
import { getUserProfile, getFoodEntries, getWorkoutSessions, saveUserProfile } from '../../src/utils/storage';
import { formatWeight, formatVolume, kgToLbs, parseWeight, getDisplayWeight } from '../../src/utils/unitConversions';
import { colors, getElevationStyle } from '../../src/styles/colors';

const { width: screenWidth } = Dimensions.get('window');

export default function ProgressScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recentEntries, setRecentEntries] = useState<FoodEntry[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({
    avgCalories: 0,
    avgProtein: 0,
    workoutCount: 0,
    activeDays: 0,
  });
  const [showWeightUpdate, setShowWeightUpdate] = useState(false);
  const [newWeight, setNewWeight] = useState('');

  useEffect(() => {
    loadProgressData();
  }, []);

  // Helper function to calculate protein from food entry
  const calculateEntryProtein = (entry: FoodEntry): number => {
    // Simplified protein calculation based on calories
    // This is similar to the approach in index.tsx but adapted for the progress screen
    if (entry.caloriesPerGram) {
      // Rough estimate: for every 4 calories, assume 0.25g protein (25% protein by calories)
      const totalCalories = entry.amount * entry.caloriesPerGram;
      return totalCalories * 0.25 / 4; // 0.25g protein per 4 calories
    }
    
    // Fallback calculation - assume 20% protein content by weight
    return entry.amount * 0.2;
  };

  const loadProgressData = async () => {
    try {
      const profile = await getUserProfile();
      const allFoodEntries = await getFoodEntries();
      const allWorkouts = await getWorkoutSessions();

      setUserProfile(profile);
      setRecentEntries(allFoodEntries.slice(-30)); // Last 30 entries
      setRecentWorkouts(allWorkouts.slice(-10)); // Last 10 workouts

      // Calculate weekly stats
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekAgoString = oneWeekAgo.toISOString().split('T')[0];

      const recentFoodEntries = allFoodEntries.filter(entry => entry.date >= weekAgoString);
      const recentWorkoutSessions = allWorkouts.filter(session => session.date >= weekAgoString);

      // Group by date to calculate daily calories and protein
      const dailyCalories: { [date: string]: number } = {};
      const dailyProtein: { [date: string]: number } = {};

      // Calculate daily nutrition values
      recentFoodEntries.forEach(entry => {
        if (!dailyCalories[entry.date]) {
          dailyCalories[entry.date] = 0;
          dailyProtein[entry.date] = 0;
        }
        
        // Calculate calories
        if (entry.caloriesPerGram) {
          dailyCalories[entry.date] += entry.amount * entry.caloriesPerGram;
        } else {
          dailyCalories[entry.date] += entry.amount * 4; // Simplified fallback
        }
        
        // Calculate protein
        const proteinAmount = calculateEntryProtein(entry);
        dailyProtein[entry.date] += proteinAmount;
      });

      const avgCalories = Object.values(dailyCalories).length > 0
        ? Object.values(dailyCalories).reduce((sum, cals) => sum + cals, 0) / Object.values(dailyCalories).length
        : 0;

      const avgProtein = Object.values(dailyProtein).length > 0
        ? Object.values(dailyProtein).reduce((sum, protein) => sum + protein, 0) / Object.values(dailyProtein).length
        : 0;

      const activeDays = new Set([
        ...Object.keys(dailyCalories),
        ...recentWorkoutSessions.map(w => w.date)
      ]).size;

      setWeeklyStats({
        avgCalories: Math.round(avgCalories),
        avgProtein: Math.round(avgProtein * 10) / 10, // Round to 1 decimal place
        workoutCount: recentWorkoutSessions.length,
        activeDays,
      });

    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const openWeightUpdate = () => {
    if (userProfile) {
      setNewWeight(getDisplayWeight(userProfile.weight, 'imperial'));
      setShowWeightUpdate(true);
    }
  };

  const updateWeight = async () => {
    if (!userProfile || !newWeight) return;
    
    try {
      const weightInKg = parseWeight(newWeight, 'imperial');
      
      if (weightInKg <= 0) {
        Alert.alert('Error', 'Please enter a valid weight');
        return;
      }
      
      const updatedProfile = {
        ...userProfile,
        weight: weightInKg,
      };
      
      await saveUserProfile(updatedProfile);
      setUserProfile(updatedProfile);
      setShowWeightUpdate(false);
      setNewWeight('');
      Alert.alert('Success', 'Weight updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update weight');
    }
  };

  const renderStatCard = (title: string, value: string, subtitle: string) => (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderBiometricInfo = () => {
    if (!userProfile) return null;

    const { biometricMeasurements } = userProfile;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Measurements</Text>
        <View style={styles.measurementGrid}>
          <View style={styles.measurementItem}>
            <Text style={styles.measurementEmoji}>🤛</Text>
            <Text style={styles.measurementLabel}>Fist</Text>
            <Text style={styles.measurementValue}>{formatVolume(biometricMeasurements.fistVolume, 'imperial')}</Text>
          </View>
          <View style={styles.measurementItem}>
            <Text style={styles.measurementEmoji}>👍</Text>
            <Text style={styles.measurementLabel}>Thumb</Text>
            <Text style={styles.measurementValue}>{formatVolume(biometricMeasurements.thumbVolume, 'imperial')}</Text>
          </View>
          <View style={styles.measurementItem}>
            <Text style={styles.measurementEmoji}>👌</Text>
            <Text style={styles.measurementLabel}>Pinky</Text>
            <Text style={styles.measurementValue}>{formatVolume(biometricMeasurements.pinkyVolume, 'imperial')}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderGoalsProgress = () => {
    if (!userProfile) return null;

    const { goals, weight } = userProfile;
    const weightDifference = goals.targetWeight - weight;
    const progressPercentage = weightDifference === 0 ? 100 : 
      Math.max(0, Math.min(100, ((weight - (weight + Math.abs(weightDifference))) / Math.abs(weightDifference)) * 100));

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goals Progress</Text>
        <View style={styles.goalItem}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalLabel}>Weight Goal</Text>
            <View style={styles.weightContainer}>
              <Text style={styles.goalValue}>
                {formatWeight(weight, 'imperial')} → {formatWeight(goals.targetWeight, 'imperial')}
              </Text>
              <TouchableOpacity style={styles.updateWeightButton} onPress={openWeightUpdate}>
                <Text style={styles.updateWeightText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.goalSubtext}>
            {weightDifference > 0 ? `${Math.round(kgToLbs(Math.abs(weightDifference)) * 10) / 10} lbs to gain` : 
             weightDifference < 0 ? `${Math.round(kgToLbs(Math.abs(weightDifference)) * 10) / 10} lbs to lose` : 'Goal achieved!'}
          </Text>
        </View>
        
        <View style={styles.goalItem}>
          <Text style={styles.goalLabel}>Daily Nutrition Targets</Text>
          <View style={styles.nutritionTargets}>
            <View style={styles.targetItem}>
              <Text style={styles.calorieTarget}>{goals.dailyCalories} cal/day</Text>
              <Text style={styles.targetLabel}>Calories</Text>
            </View>
            <View style={styles.targetItem}>
              <Text style={styles.proteinTarget}>{goals.dailyProtein}g/day</Text>
              <Text style={styles.targetLabel}>Protein</Text>
            </View>
          </View>
          <Text style={styles.goalSubtext}>
            Based on {goals.weeklyWeightChange > 0 ? 'gaining' : goals.weeklyWeightChange < 0 ? 'losing' : 'maintaining'} {Math.round(kgToLbs(Math.abs(goals.weeklyWeightChange)) * 10) / 10} lbs/week
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress Overview</Text>
          {userProfile && (
            <Text style={styles.subtitle}>Welcome back, {userProfile.name}!</Text>
          )}
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.statsRow}>
            {renderStatCard('Avg Calories', weeklyStats.avgCalories.toString(), 'per day')}
            {renderStatCard('Avg Protein', weeklyStats.avgProtein.toString() + 'g', 'per day')}
          </View>
          <View style={styles.statsRow}>
            {renderStatCard('Workouts', weeklyStats.workoutCount.toString(), 'completed')}
            {renderStatCard('Active Days', weeklyStats.activeDays.toString(), 'out of 7')}
          </View>
        </View>

        {renderBiometricInfo()}
        {renderGoalsProgress()}
        
        <Modal
          visible={showWeightUpdate}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowWeightUpdate(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Your Weight</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Weight (lbs)</Text>
                <TextInput
                  style={styles.weightInput}
                  value={newWeight}
                  onChangeText={setNewWeight}
                  keyboardType="decimal-pad"
                  placeholder="Enter weight in lbs"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowWeightUpdate(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={updateWeight}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          <View style={styles.activitySection}>
            <Text style={styles.activityTitle}>Latest Workouts</Text>
            {recentWorkouts.length === 0 ? (
              <Text style={styles.noData}>No workouts recorded yet</Text>
            ) : (
              recentWorkouts.slice(0, 3).map((workout) => (
                <View key={workout.id} style={styles.activityItem}>
                  <Text style={styles.activityDate}>{workout.date}</Text>
                  <Text style={styles.activityName}>{workout.name}</Text>
                  <Text style={styles.activityDetail}>
                    {workout.exercises.length} exercises
                  </Text>
                </View>
              ))
            )}
          </View>
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
  section: {
    ...getElevationStyle(1),
    margin: 15,
    padding: 15,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.text.primary,
  },
  statsContainer: {
    margin: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    ...getElevationStyle(1),
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary[500],
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
    color: colors.text.primary,
  },
  statSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  measurementGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  measurementItem: {
    alignItems: 'center',
    flex: 1,
  },
  measurementEmoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  measurementLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: colors.text.primary,
  },
  measurementValue: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  goalItem: {
    marginBottom: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  goalValue: {
    fontSize: 16,
    color: colors.primary[500],
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface.level3,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  goalSubtext: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  nutritionTargets: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  targetItem: {
    alignItems: 'center',
    flex: 1,
  },
  calorieTarget: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a82828',
  },
  proteinTarget: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  targetLabel: {
    fontSize: 12,
    color: '#c5c5c5',
    marginTop: 2,
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  updateWeightButton: {
    backgroundColor: '#a82828',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  updateWeightText: {
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
    backgroundColor: '#3c3c3c',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#ffffff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#ffffff',
  },
  weightInput: {
    borderWidth: 1,
    borderColor: '#6a6a6a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#4a4a4a',
    color: '#ffffff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6a6a6a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#a82828',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  activitySection: {
    marginBottom: 15,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#6a6a6a',
  },
  activityDate: {
    fontSize: 12,
    color: '#c5c5c5',
    width: 80,
  },
  activityName: {
    fontSize: 14,
    flex: 1,
    marginLeft: 10,
  },
  activityDetail: {
    fontSize: 12,
    color: '#c5c5c5',
  },
  noData: {
    fontSize: 14,
    color: '#a0a0a0',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});