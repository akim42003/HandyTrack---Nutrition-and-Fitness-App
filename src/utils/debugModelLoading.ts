import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export async function debugModelLoading() {
  console.log('=== Model Loading Debug Info ===');
  console.log('Platform:', Platform.OS);
  
  // Check different potential paths
  const pathsToCheck = [
    'food_classifier_v1.tflite',
    'assets/models/food_classifier_v1.tflite',
    'models/food_classifier_v1.tflite',
    '../assets/models/food_classifier_v1.tflite',
    '../../assets/models/food_classifier_v1.tflite',
  ];

  if (FileSystem) {
    console.log('Document Directory:', FileSystem.documentDirectory);
    console.log('Bundle Directory:', FileSystem.bundleDirectory);
    
    // Try to list files in bundle directory
    try {
      if (FileSystem.bundleDirectory) {
        const files = await FileSystem.readDirectoryAsync(FileSystem.bundleDirectory);
        console.log('Bundle directory contents:', files.slice(0, 10)); // First 10 files
      }
    } catch (e) {
      console.log('Could not read bundle directory:', e);
    }

    // Check if model exists at various paths
    for (const path of pathsToCheck) {
      try {
        const fullPath = FileSystem.bundleDirectory ? `${FileSystem.bundleDirectory}${path}` : path;
        const info = await FileSystem.getInfoAsync(fullPath);
        console.log(`Path "${path}":`, info.exists ? 'EXISTS' : 'NOT FOUND');
      } catch (e) {
        console.log(`Path "${path}": ERROR -`, e.message);
      }
    }
  }

  // Check required asset
  try {
    const modelAsset = require('../../assets/models/food_classifier_v1.tflite');
    console.log('Required asset type:', typeof modelAsset);
    console.log('Required asset value:', modelAsset);
  } catch (e) {
    console.log('Could not require model:', e.message);
  }

  console.log('=== End Debug Info ===');
}