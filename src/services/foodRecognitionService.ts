import { Platform } from 'react-native';

// Dynamic import function to avoid bundler issues
async function getTensorflowModule() {
  if (Platform.OS === 'web') {
    return null;
  }
  
  try {
    // Use dynamic import to avoid bundler resolution issues
    const tflite = await import('react-native-fast-tflite');
    return {
      loadTensorflowModel: tflite.loadTensorflowModel,
      TensorflowModel: tflite.TensorflowModel,
    };
  } catch (error) {
    console.log('TensorFlow Lite not available on this platform');
    return null;
  }
}

interface FoodRecognitionResult {
  label: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface NutritionEstimate {
  calories: number;
  weight: number; // in grams
  protein: number;
  carbs: number;
  fat: number;
}

class FoodRecognitionService {
  private model: any | null = null;
  private isModelLoaded = false;
  private isPlatformSupported = Platform.OS !== 'web';
  private tfliteModule: any = null;

  // Food calorie database (calories per 100g) - Enhanced for Google's food classifier
  private readonly foodCalorieDatabase: { [key: string]: NutritionEstimate } = {
    // Fruits
    'apple': { calories: 52, weight: 182, protein: 0.3, carbs: 14, fat: 0.2 },
    'banana': { calories: 89, weight: 118, protein: 1.1, carbs: 23, fat: 0.3 },
    'orange': { calories: 47, weight: 154, protein: 0.9, carbs: 12, fat: 0.1 },
    'strawberry': { calories: 32, weight: 100, protein: 0.7, carbs: 7.7, fat: 0.3 },
    'grapes': { calories: 62, weight: 100, protein: 0.6, carbs: 16, fat: 0.2 },
    
    // Proteins
    'chicken': { calories: 165, weight: 100, protein: 31, carbs: 0, fat: 3.6 },
    'beef': { calories: 250, weight: 100, protein: 26, carbs: 0, fat: 17 },
    'pork': { calories: 242, weight: 100, protein: 27, carbs: 0, fat: 14 },
    'fish': { calories: 206, weight: 100, protein: 22, carbs: 0, fat: 12 },
    'salmon': { calories: 208, weight: 100, protein: 20, carbs: 0, fat: 12 },
    'tuna': { calories: 132, weight: 100, protein: 28, carbs: 0, fat: 1 },
    'egg': { calories: 155, weight: 50, protein: 13, carbs: 1.1, fat: 11 },
    'shrimp': { calories: 85, weight: 100, protein: 18, carbs: 1, fat: 1 },
    
    // Carbohydrates & Grains
    'rice': { calories: 130, weight: 100, protein: 2.7, carbs: 28, fat: 0.3 },
    'pasta': { calories: 131, weight: 100, protein: 5, carbs: 25, fat: 1.1 },
    'bread': { calories: 265, weight: 30, protein: 9, carbs: 49, fat: 3.2 },
    'potato': { calories: 77, weight: 150, protein: 2, carbs: 17, fat: 0.1 },
    'sweet potato': { calories: 86, weight: 128, protein: 1.6, carbs: 20, fat: 0.1 },
    'corn': { calories: 96, weight: 100, protein: 3.4, carbs: 19, fat: 1.5 },
    'oatmeal': { calories: 68, weight: 100, protein: 2.4, carbs: 12, fat: 1.4 },
    
    // Vegetables
    'broccoli': { calories: 34, weight: 100, protein: 2.8, carbs: 7, fat: 0.4 },
    'carrot': { calories: 41, weight: 100, protein: 0.9, carbs: 10, fat: 0.2 },
    'tomato': { calories: 18, weight: 100, protein: 0.9, carbs: 3.9, fat: 0.2 },
    'lettuce': { calories: 15, weight: 100, protein: 1.4, carbs: 2.9, fat: 0.1 },
    'spinach': { calories: 23, weight: 100, protein: 2.9, carbs: 3.6, fat: 0.4 },
    'bell pepper': { calories: 31, weight: 100, protein: 1, carbs: 7, fat: 0.3 },
    'cucumber': { calories: 16, weight: 100, protein: 0.7, carbs: 4, fat: 0.1 },
    'onion': { calories: 40, weight: 100, protein: 1.1, carbs: 9, fat: 0.1 },
    
    // Dairy
    'milk': { calories: 42, weight: 100, protein: 3.4, carbs: 5, fat: 1 },
    'cheese': { calories: 113, weight: 28, protein: 7, carbs: 1, fat: 9 },
    'yogurt': { calories: 59, weight: 100, protein: 10, carbs: 3.6, fat: 0.4 },
    'butter': { calories: 717, weight: 14, protein: 0.9, carbs: 0.1, fat: 81 },
    
    // Prepared Foods & Entrees (North American focus)
    'pizza': { calories: 266, weight: 100, protein: 11, carbs: 33, fat: 10 },
    'hamburger': { calories: 295, weight: 150, protein: 17, carbs: 29, fat: 14 },
    'hot dog': { calories: 290, weight: 100, protein: 11, carbs: 4, fat: 26 },
    'sandwich': { calories: 250, weight: 150, protein: 12, carbs: 30, fat: 8 },
    'burrito': { calories: 206, weight: 200, protein: 10, carbs: 30, fat: 6 },
    'taco': { calories: 226, weight: 100, protein: 9, carbs: 18, fat: 13 },
    'fried chicken': { calories: 320, weight: 100, protein: 19, carbs: 11, fat: 22 },
    'french fries': { calories: 365, weight: 100, protein: 4, carbs: 63, fat: 17 },
    'salad': { calories: 33, weight: 100, protein: 2.8, carbs: 6.2, fat: 0.3 },
    
    // Snacks & Desserts
    'cookies': { calories: 502, weight: 25, protein: 5.9, carbs: 64, fat: 25 },
    'cake': { calories: 257, weight: 75, protein: 3.8, carbs: 46, fat: 6.8 },
    'ice cream': { calories: 207, weight: 100, protein: 3.5, carbs: 24, fat: 11 },
    'chips': { calories: 547, weight: 30, protein: 6.6, carbs: 49, fat: 37 },
    'chocolate': { calories: 546, weight: 25, protein: 4.9, carbs: 61, fat: 31 },
    'donut': { calories: 452, weight: 60, protein: 4.9, carbs: 51, fat: 25 },
    
    // Beverages & Soups
    'coffee': { calories: 1, weight: 100, protein: 0.1, carbs: 0, fat: 0 },
    'soda': { calories: 41, weight: 100, protein: 0, carbs: 10.6, fat: 0 },
    'juice': { calories: 45, weight: 100, protein: 0.1, carbs: 11, fat: 0.1 },
    'soup': { calories: 48, weight: 100, protein: 2.8, carbs: 7, fat: 1.2 },
  };

  async loadModel(): Promise<boolean> {
    if (this.isModelLoaded && this.model) {
      return true;
    }

    if (!this.isPlatformSupported) {
      console.log('Food recognition not supported on web platform');
      this.isModelLoaded = false;
      return false;
    }

    try {
      // Load TensorFlow Lite module dynamically
      if (!this.tfliteModule) {
        this.tfliteModule = await getTensorflowModule();
        if (!this.tfliteModule) {
          throw new Error('TensorFlow Lite module not available');
        }
      }

      // Load Google's official TensorFlow Lite food classification model
      console.log('Loading TensorFlow Lite food classification model...');
      this.model = await this.tfliteModule.loadTensorflowModel('food_classifier_v1.tflite');
      
      console.log('TensorFlow Lite food recognition model loaded successfully!');
      console.log('Note: Image preprocessing and inference pipeline still need implementation');
      this.isModelLoaded = true;
      return true;
    } catch (error) {
      console.error('Failed to load food recognition model:', error);
      console.log('Food recognition not available - users should use manual entry');
      this.isModelLoaded = false;
      return false;
    }
  }

  async recognizeFood(imageUri: string): Promise<FoodRecognitionResult[]> {
    if (!this.isModelLoaded) {
      const loaded = await this.loadModel();
      if (!loaded) {
        throw new Error('Food recognition model not available');
      }
    }

    try {
      if (this.model) {
        // Run actual TensorFlow Lite model inference
        console.log('Running TensorFlow Lite inference on image:', imageUri);
        
        // Preprocess the image for the model
        const preprocessedImage = await this.preprocessImage(imageUri);
        
        // Run inference
        const modelOutput = await this.model.predict(preprocessedImage);
        
        // Process model output to get food recognition results
        return this.processModelOutput(modelOutput);
      } else {
        throw new Error('Model not loaded properly');
      }
    } catch (error) {
      console.error('Error during food recognition:', error);
      throw new Error('Food recognition failed - please enter food manually');
    }
  }

  private async preprocessImage(imageUri: string): Promise<any> {
    // TODO: Implement proper image preprocessing for TensorFlow Lite model
    // This should include:
    // 1. Load image from URI
    // 2. Resize to model input size (typically 224x224 or 299x299)
    // 3. Normalize pixel values (typically 0-1 range)
    // 4. Convert to tensor format expected by model
    
    console.log('Preprocessing image:', imageUri);
    
    // For now, return a placeholder that would represent preprocessed image
    // Real implementation would use react-native-vision-camera's image processing
    throw new Error('Image preprocessing not yet implemented');
  }

  private processModelOutput(modelOutput: any): FoodRecognitionResult[] {
    // TODO: Implement processing of TensorFlow Lite model output
    // This should include:
    // 1. Extract confidence scores and class predictions
    // 2. Map class indices to food names
    // 3. Filter results by confidence threshold
    // 4. Sort by confidence
    
    console.log('Processing model output:', modelOutput);
    
    // For now, throw error until real implementation is complete
    throw new Error('Model output processing not yet implemented');
  }

  estimateNutrition(foodLabel: string, portionMultiplier: number = 1): NutritionEstimate {
    const baseNutrition = this.foodCalorieDatabase[foodLabel.toLowerCase()];
    
    if (!baseNutrition) {
      // Default estimation for unknown foods
      return {
        calories: 150 * portionMultiplier,
        weight: 100 * portionMultiplier,
        protein: 5 * portionMultiplier,
        carbs: 20 * portionMultiplier,
        fat: 5 * portionMultiplier,
      };
    }

    return {
      calories: Math.round(baseNutrition.calories * portionMultiplier),
      weight: Math.round(baseNutrition.weight * portionMultiplier),
      protein: Math.round(baseNutrition.protein * portionMultiplier * 10) / 10,
      carbs: Math.round(baseNutrition.carbs * portionMultiplier * 10) / 10,
      fat: Math.round(baseNutrition.fat * portionMultiplier * 10) / 10,
    };
  }

  // Estimate portion size based on visual cues (placeholder for now)
  estimatePortionSize(boundingBox?: { width: number; height: number }): number {
    if (!boundingBox) return 1.0;
    
    // Simple heuristic: larger bounding box = larger portion
    const area = boundingBox.width * boundingBox.height;
    
    if (area > 0.5) return 1.5; // Large portion
    if (area > 0.3) return 1.0; // Normal portion
    if (area > 0.15) return 0.7; // Small portion
    return 0.5; // Very small portion
  }

  // Get the top food recognition result with nutrition estimation
  async processImage(imageUri: string): Promise<{
    foodName: string;
    confidence: number;
    estimatedCalories: number;
    estimatedWeight: number;
    nutrition: {
      protein: number;
      carbs: number;
      fat: number;
    };
  }> {
    const recognitionResults = await this.recognizeFood(imageUri);
    
    if (recognitionResults.length === 0) {
      throw new Error('No food detected in image');
    }

    const topResult = recognitionResults[0];
    const portionMultiplier = this.estimatePortionSize(topResult.boundingBox);
    const nutrition = this.estimateNutrition(topResult.label, portionMultiplier);

    return {
      foodName: this.formatFoodName(topResult.label),
      confidence: topResult.confidence,
      estimatedCalories: nutrition.calories,
      estimatedWeight: nutrition.weight,
      nutrition: {
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
      },
    };
  }

  private formatFoodName(label: string): string {
    // Convert label to proper display name
    return label
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Check if the service is ready to use
  isReady(): boolean {
    return this.isModelLoaded;
  }

  // Check if the platform supports food recognition
  isPlatformCompatible(): boolean {
    return this.isPlatformSupported;
  }

  // Cleanup resources
  dispose(): void {
    this.model = null;
    this.isModelLoaded = false;
  }
}

export const foodRecognitionService = new FoodRecognitionService();