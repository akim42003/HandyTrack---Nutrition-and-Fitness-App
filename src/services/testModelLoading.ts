import { Platform } from 'react-native';
import { Asset } from 'expo-asset';

export async function testModelLoading() {
  console.log('=== Testing Model Loading Approaches ===');
  
  // Test 1: Check what require returns
  try {
    const required = require('../../assets/models/food_classifier_v1.tflite');
    console.log('Require returns:', {
      type: typeof required,
      value: required,
      isNumber: typeof required === 'number',
      constructor: required?.constructor?.name
    });
  } catch (e) {
    console.log('Require failed:', e.message);
  }

  // Test 2: Check Asset module
  try {
    const asset = Asset.fromModule(require('../../assets/models/food_classifier_v1.tflite'));
    await asset.downloadAsync();
    
    console.log('Asset details:', {
      uri: asset.uri,
      localUri: asset.localUri,
      width: asset.width,
      height: asset.height,
      name: asset.name,
      type: asset.type,
      hash: asset.hash,
      downloaded: asset.downloaded
    });
  } catch (e) {
    console.log('Asset loading failed:', e.message);
  }

  // Test 3: Check if we can use Image.resolveAssetSource
  try {
    const Image = require('react-native').Image;
    const source = Image.resolveAssetSource(require('../../assets/models/food_classifier_v1.tflite'));
    console.log('Image.resolveAssetSource returns:', source);
  } catch (e) {
    console.log('Image.resolveAssetSource failed:', e.message);
  }

  console.log('=== End Testing ===');
}