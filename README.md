# HandyFit 📱

A modern, intelligent calorie tracking app that combines traditional nutrition logging with personalized biometric measurements and computer vision (beta). Built with React Native and Expo.

## ✨ Features

### 🥗 Smart Food Tracking
- **USDA Database Integration**: Access to 400,000+ foods with accurate nutritional data
- **Camera Recognition** (Beta): Take photos of your food for automatic identification and calorie estimation
- **Custom Food Entry**: Manually add foods with detailed nutritional information
- **Visual Portion Sizing**: Use your own body measurements (fist, thumb, pinky) for intuitive portion control

### 📊 Personalized Biometrics
- **Custom Body Measurements**: Automatically calculates your personal fist, thumb, and pinky volumes based on height, weight, and gender
- **Smart Unit Conversions**: Seamlessly convert between metric/imperial and biometric measurements
- **Adaptive Portions**: Visual portion guides adjust to your individual body size

### 🎯 Comprehensive Tracking
- **Daily Nutrition Goals**: Set and track calories, protein, carbs, fat, and fiber
- **Meal Organization**: Organize entries by breakfast, lunch, dinner, and snacks
- **Progress Monitoring**: Visual charts showing weight trends and goal progress
- **Calendar Integration**: Track food intake across multiple days

### 💪 Exercise Integration
- **Workout Logging**: Record exercises, sets, reps, and weights
- **RPE Tracking**: Rate of Perceived Exertion for intensity monitoring
- **Decimal Support**: Precise weight and RPE tracking with decimal values
- **Workout Organization**: Group exercises into named workout sessions

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React Native with Expo
- **Language**: TypeScript
- **State Management**: React Hooks
- **Storage**: AsyncStorage
- **Navigation**: React Navigation
- **AI/ML**: TensorFlow Lite (for food recognition)
- **APIs**: USDA FoodData Central


### Key Services

#### Nutrition Calculator
Handles all nutrition-related calculations including:
- Calorie and macro calculations
- Biometric unit conversions
- Daily totals and meal summaries

#### Biometric Calculator
Personalizes measurements based on user data:
- Calculates fist, thumb, and pinky volumes
- Adjusts for height, weight, and gender
- Provides measurement equivalents

#### Food Recognition Service
AI-powered food identification:
- TensorFlow Lite model integration
- Image preprocessing and analysis
- Calorie estimation from visual data

## 📱 Screens

### Food Tracking (`/app/(tabs)/index.tsx`)
- Daily food log with meal organization
- Add food via search, camera, or manual entry
- Visual portion selector with personal measurements
- Real-time nutrition calculations

### Exercise Tracking (`/app/(tabs)/exercise.tsx`)
- Workout session management
- Exercise logging with sets, reps, and weights
- RPE (Rate of Perceived Exertion) tracking
- Decimal input support for precise measurements

### Progress Tracking (`/app/(tabs)/progress.tsx`)
- Weight trend visualization
- Goal progress monitoring
- Historical data analysis
- Biometric measurement guide

### Profile Setup (`/app/(tabs)/profile.tsx`)
- Personal information setup
- Goal setting and customization
- Unit system preferences
- Biometric measurement configuration

## 📊 Features Deep Dive

### Visual Portion System
The app's unique selling point is its personalized biometric measurement system:

1. **Personalization**: Based on user's height, weight, and gender
2. **Accuracy**: Uses anthropometric studies for realistic volume calculations
3. **Simplicity**: No measuring cups needed - use your body as the reference
4. **Consistency**: Same measurements used across all food entries

### Food Recognition AI
Beta feature using TensorFlow Lite:
- Trained on common food items
- Provides calorie estimates based on visual analysis
- Continuously improving accuracy
- Fallback to manual entry if confidence is low

### Nutrition Database
Integration with USDA FoodData Central:
- 400,000+ food items
- Comprehensive nutritional data
- Regular updates from USDA
- Search and filtering capabilities

### App Store Guidelines
- Follows Apple App Store
- Privacy policy included
- Health app disclaimers implemented
- Age-appropriate content ratings


## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

*Making calorie tracking intuitive, personal, and intelligent.*
