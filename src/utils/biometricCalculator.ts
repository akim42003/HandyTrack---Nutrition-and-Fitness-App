import { UserProfile, BiometricMeasurement } from '../types';

// Biometric measurement calculations based on anthropometric data
export const calculateBiometricMeasurements = (height: number, weight: number, gender: 'male' | 'female') => {
  console.log('BiometricCalculator: Starting calculation with:', { height, weight, gender });
  
  // Hand measurements correlate with height and gender
  // These formulas are approximations based on anthropometric studies
  
  const heightInM = height / 100;
  const bmi = weight / (heightInM * heightInM);
  console.log('BiometricCalculator: Calculated BMI:', bmi);
  
  // Base measurements for average adult
  const baseFistVolume = gender === 'male' ? 250 : 200; // ml
  const baseThumbVolume = gender === 'male' ? 15 : 12; // ml  
  const basePinkyVolume = gender === 'male' ? 5 : 4; // ml
  
  // Adjust based on height (taller people have proportionally larger hands)
  const heightFactor = height / (gender === 'male' ? 175 : 162); // average heights
  
  // Adjust based on BMI (slightly larger hands for higher BMI)
  const bmiFactor = Math.max(0.8, Math.min(1.3, 0.8 + (bmi - 20) * 0.02));
  
  console.log('BiometricCalculator: Factors:', { heightFactor, bmiFactor });
  
  const result = {
    fistVolume: Math.round(baseFistVolume * heightFactor * bmiFactor),
    thumbVolume: Math.round(baseThumbVolume * heightFactor * bmiFactor),
    pinkyVolume: Math.round(basePinkyVolume * heightFactor * bmiFactor),
  };
  
  console.log('BiometricCalculator: Final result:', result);
  return result;
};

// Convert biometric measurements to grams/ml
export const convertBiometricToAmount = (
  measurement: BiometricMeasurement,
  multiplier: number,
  userProfile: UserProfile
): number => {
  const { biometricMeasurements } = userProfile;
  
  switch (measurement.type) {
    case 'fist':
      return biometricMeasurements.fistVolume * multiplier;
    case 'thumb':
      return biometricMeasurements.thumbVolume * multiplier;
    case 'pinky':
      return biometricMeasurements.pinkyVolume * multiplier;
    case 'palm':
      // Palm is roughly 2/3 of fist volume
      return biometricMeasurements.fistVolume * 0.67 * multiplier;
    case 'handful':
      // Handful is roughly 1.5x fist volume
      return biometricMeasurements.fistVolume * 1.5 * multiplier;
    default:
      return 0;
  }
};

// Get measurement equivalents for user reference
export const getMeasurementEquivalents = (userProfile: UserProfile) => {
  const { biometricMeasurements } = userProfile;
  
  return {
    fist: {
      volume: biometricMeasurements.fistVolume,
      equivalents: {
        'rice/pasta': `${Math.round(biometricMeasurements.fistVolume * 0.8)}g`,
        'vegetables': `${Math.round(biometricMeasurements.fistVolume * 0.3)}g`,
        'fruit': `${Math.round(biometricMeasurements.fistVolume * 0.5)}g`,
      }
    },
    thumb: {
      volume: biometricMeasurements.thumbVolume,
      equivalents: {
        'oil/butter': `${Math.round(biometricMeasurements.thumbVolume * 0.9)}g`,
        'nuts': `${Math.round(biometricMeasurements.thumbVolume * 0.6)}g`,
        'cheese': `${Math.round(biometricMeasurements.thumbVolume)}g`,
      }
    },
    pinky: {
      volume: biometricMeasurements.pinkyVolume,
      equivalents: {
        'salt': `${Math.round(biometricMeasurements.pinkyVolume * 1.2)}g`,
        'spices': `${Math.round(biometricMeasurements.pinkyVolume * 0.5)}g`,
        'honey': `${Math.round(biometricMeasurements.pinkyVolume * 1.4)}g`,
      }
    }
  };
};