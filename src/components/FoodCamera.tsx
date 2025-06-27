import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { foodRecognitionService } from '../services/foodRecognitionService';

const { width, height } = Dimensions.get('window');

interface FoodRecognitionResult {
  foodName: string;
  confidence: number;
  estimatedCalories: number;
  estimatedWeight: number; // in grams
}

interface FoodCameraProps {
  visible: boolean;
  onClose: () => void;
  onFoodRecognized: (result: FoodRecognitionResult) => void;
}

export const FoodCamera: React.FC<FoodCameraProps> = ({
  visible,
  onClose,
  onFoodRecognized,
}) => {
  // Show platform not supported message for web
  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Camera Not Supported</Text>
          <Text style={styles.errorText}>
            Food recognition camera is not available on web. Please use manual food entry instead.
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Use Manual Entry</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  // For native platforms, show development message
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Feature In Development</Text>
        <Text style={styles.errorText}>
          Food recognition camera is still in development. Please use manual food entry for now.
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Use Manual Entry</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#3c3c3c',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  errorText: {
    fontSize: 16,
    color: '#c5c5c5',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#a82828',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});