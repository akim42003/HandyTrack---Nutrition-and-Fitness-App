# Camera Food Recognition System

## Overview
The HandyFit app includes an AI-powered food recognition system that uses the device camera to identify foods and automatically estimate their nutritional content.

## Features
- Real-time food recognition using TensorFlow Lite
- Automatic calorie and nutrition estimation
- Support for 60+ common foods
- Portion size estimation based on visual analysis
- Integration with the existing food tracking system

## How It Works

### 1. Camera Capture
- User taps "Camera Recognition" button in the food entry modal
- Camera interface opens with visual guidance
- User captures a photo of their food

### 2. AI Recognition
- TensorFlow Lite model analyzes the image
- Identifies the food type with confidence score
- Estimates portion size based on image coverage

### 3. Nutrition Calculation
- Maps recognized food to nutrition database
- Calculates calories, protein, carbs, and fat
- Adjusts values based on estimated portion size

### 4. User Confirmation
- Shows recognition results with confidence percentage
- Displays estimated nutrition information
- User can retake photo or confirm the result

## Supported Foods

The system recognizes 60+ common foods across categories:

**Fruits**: Apple, Banana, Orange, Strawberry, Grapes, Watermelon, Pineapple, Mango

**Proteins**: Chicken, Beef, Pork, Fish, Salmon, Tuna, Egg, Shrimp, Steak, Bacon

**Grains**: Rice, Pasta, Bread, Potato, Sweet Potato, Corn, Oatmeal, Cereal, Bagel, Toast, Pancakes, Waffle, Muffin, Croissant

**Vegetables**: Broccoli, Carrot, Tomato, Lettuce, Spinach, Bell Pepper, Cucumber, Onion

**Dairy**: Milk, Cheese, Yogurt, Butter, Ice Cream

**Prepared Foods**: Pizza, Hamburger, Hot Dog, Sandwich, Burrito, Taco, Fried Chicken, French Fries, Salad, Sushi, Noodles

**Snacks & Desserts**: Cookies, Cake, Donut, Chocolate, Chips, Popcorn, Pie, Pudding

**Beverages**: Coffee, Soda, Juice, Soup

## Technical Implementation

### Components
- **FoodCamera.tsx**: Camera UI component with capture and preview
- **foodRecognitionService.ts**: ML inference and nutrition estimation
- **TensorFlow Lite Model**: 21MB food classification model

### Dependencies
- `react-native-vision-camera`: Camera functionality
- `react-native-fast-tflite`: TensorFlow Lite runtime
- Pre-trained food classification model

### Platform Support
- ✅ iOS (requires camera permission)
- ✅ Android (requires camera permission)
- ❌ Web (not supported)

## Usage Tips

1. **Best Results**:
   - Center the food in the frame
   - Ensure good lighting
   - Capture from above at slight angle
   - Include the entire food item

2. **Multiple Foods**:
   - For meals with multiple items, capture the dominant food
   - Add additional items manually if needed

3. **Accuracy**:
   - The system provides estimates, not exact measurements
   - Portion sizes are approximated based on visual cues
   - Always verify and adjust if needed

## Permissions

The app requires camera permission to use this feature:
- **iOS**: "This app uses the camera to recognize food items and estimate calories for nutrition tracking."
- **Android**: CAMERA permission in manifest

## Fallback Options

If food recognition fails or is unavailable:
- Manual food search using USDA database (400,000+ foods)
- Direct nutrition input
- Biometric portion measurements (fist, thumb, pinky)

## Future Enhancements

Potential improvements for the food recognition system:
- Multi-food detection in single image
- Barcode scanning for packaged foods
- Volume estimation using depth sensing
- Custom model training for user-specific foods
- Integration with recipe databases