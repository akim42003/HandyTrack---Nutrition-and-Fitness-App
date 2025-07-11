import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';

export interface VisualPortions {
  fists: number;
  thumbs: number;
  pinkies: number;
}

interface VisualPortionSelectorProps {
  visualPortions: VisualPortions;
  onPortionsChange: (portions: VisualPortions) => void;
  servingUnit: string;
  onUnitChange: (unit: string) => void;
  userBiometrics: {
    fistVolume: number;
    thumbVolume: number;
    pinkyVolume: number;
  };
}

// Unit conversions to cups
const UNIT_CONVERSIONS = {
  cup: 1,
  oz: 0.125,      // 1 oz = 1/8 cup
  tbsp: 0.0625,   // 1 tbsp = 1/16 cup
  tsp: 0.0208,    // 1 tsp = 1/48 cup
  ml: 0.00423,    // 1 ml = 0.00423 cups
  g: 0.00423,     // Approximate for water-like density
};

// Calculate personalized portion sizes based on user's biometric measurements
const calculatePortionSizes = (userBiometrics: { fistVolume: number; thumbVolume: number; pinkyVolume: number }, unit: string) => {
  const { fistVolume, thumbVolume, pinkyVolume } = userBiometrics;
  
  switch (unit) {
    case 'cup':
      return {
        fist: fistVolume / 240,        // Convert ml to cups (240ml = 1 cup)
        thumb: thumbVolume / 240,
        pinky: pinkyVolume / 240,
      };
    case 'oz':
      return {
        fist: fistVolume / 29.5735,    // Convert ml to fl oz (29.5735ml = 1 fl oz)
        thumb: thumbVolume / 29.5735,
        pinky: pinkyVolume / 29.5735,
      };
    case 'tbsp':
      return {
        fist: fistVolume / 14.7868,    // Convert ml to tbsp (14.7868ml = 1 tbsp)
        thumb: thumbVolume / 14.7868,
        pinky: pinkyVolume / 14.7868,
      };
    case 'tsp':
      return {
        fist: fistVolume / 4.92892,    // Convert ml to tsp (4.92892ml = 1 tsp)
        thumb: thumbVolume / 4.92892,
        pinky: pinkyVolume / 4.92892,
      };
    case 'ml':
      return {
        fist: fistVolume,              // Already in ml
        thumb: thumbVolume,
        pinky: pinkyVolume,
      };
    case 'g':
      return {
        fist: fistVolume,              // Approximate 1:1 ratio for most foods
        thumb: thumbVolume,
        pinky: pinkyVolume,
      };
    default:
      return {
        fist: fistVolume / 240,        // Default to cups
        thumb: thumbVolume / 240,
        pinky: pinkyVolume / 240,
      };
  }
};

const UNIT_OPTIONS = [
  { label: 'Cups', value: 'cup' },
  { label: 'Ounces', value: 'oz' },
  { label: 'Tablespoons', value: 'tbsp' },
  { label: 'Teaspoons', value: 'tsp' },
  { label: 'Milliliters', value: 'ml' },
  { label: 'Grams', value: 'g' },
];

export const VisualPortionSelector: React.FC<VisualPortionSelectorProps> = ({
  visualPortions,
  onPortionsChange,
  servingUnit,
  onUnitChange,
  userBiometrics,
}) => {
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  
  const updatePortion = (type: keyof VisualPortions, delta: number) => {
    onPortionsChange({
      ...visualPortions,
      [type]: Math.max(0, visualPortions[type] + delta),
    });
  };

  const calculateTotalInUnit = () => {
    const portionSizes = calculatePortionSizes(userBiometrics, servingUnit);
    return (
      visualPortions.fists * portionSizes.fist +
      visualPortions.thumbs * portionSizes.thumb +
      visualPortions.pinkies * portionSizes.pinky
    );
  };

  const getPortionDescription = (bodyPart: string) => {
    const portionSizes = calculatePortionSizes(userBiometrics, servingUnit);
    const value = portionSizes[bodyPart as keyof typeof portionSizes];
    const roundedValue = Math.round(value * 100) / 100; // Round to 2 decimal places
    const unitLabel = servingUnit === 'cup' ? (roundedValue === 1 ? 'cup' : 'cups') : servingUnit;
    return `≈ ${roundedValue} ${unitLabel}`;
  };

  const portions = [
    { key: 'fists', emoji: '👊', label: 'Fist', description: getPortionDescription('fist') },
    { key: 'thumbs', emoji: '👍', label: 'Thumb', description: getPortionDescription('thumb') },
    { key: 'pinkies', emoji: '🤏', label: 'Pinky', description: getPortionDescription('pinky') },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Visual Portion Guide</Text>
        <TouchableOpacity 
          style={styles.unitSelector}
          onPress={() => setShowUnitPicker(true)}
        >
          <Text style={styles.unitLabel}>Unit:</Text>
          <View style={styles.unitButton}>
            <Text style={styles.unitButtonText}>
              {UNIT_OPTIONS.find(u => u.value === servingUnit)?.label || 'Cups'}
            </Text>
            <Text style={styles.unitDropdownIcon}>▼</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.portionsContainer} showsVerticalScrollIndicator={false}>
        {portions.map((portion) => (
          <View key={portion.key} style={styles.portionItem}>
            <View style={styles.portionInfo}>
              <Text style={styles.portionEmoji}>{portion.emoji}</Text>
              <View style={styles.portionText}>
                <Text style={styles.portionLabel}>{portion.label}</Text>
                <Text style={styles.portionDescription}>{portion.description}</Text>
              </View>
            </View>
            
            <View style={styles.counter}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => updatePortion(portion.key as keyof VisualPortions, -1)}
              >
                <Text style={styles.counterButtonText}>−</Text>
              </TouchableOpacity>
              
              <Text style={styles.counterValue}>
                {visualPortions[portion.key as keyof VisualPortions]}
              </Text>
              
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => updatePortion(portion.key as keyof VisualPortions, 1)}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {calculateTotalInUnit() > 0 && (
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>
            {calculateTotalInUnit().toFixed(2)} {servingUnit === 'cup' ? 'cups' : servingUnit}
          </Text>
        </View>
      )}

      <Modal
        visible={showUnitPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnitPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUnitPicker(false)}
        >
          <View style={styles.unitPickerModal}>
            <Text style={styles.unitPickerTitle}>Select Unit</Text>
            {UNIT_OPTIONS.map((unit) => (
              <TouchableOpacity
                key={unit.value}
                style={[
                  styles.unitOption,
                  servingUnit === unit.value && styles.unitOptionSelected
                ]}
                onPress={() => {
                  onUnitChange(unit.value);
                  setShowUnitPicker(false);
                }}
              >
                <Text style={[
                  styles.unitOptionText,
                  servingUnit === unit.value && styles.unitOptionTextSelected
                ]}>
                  {unit.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#5a5a5a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitLabel: {
    fontSize: 14,
    color: '#c5c5c5',
    marginRight: 8,
  },
  unitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a4a4a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6a6a6a',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    marginRight: 4,
  },
  unitDropdownIcon: {
    color: '#999999',
    fontSize: 10,
  },
  portionsContainer: {
    maxHeight: 300,
  },
  portionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#4a4a4a',
  },
  portionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  portionEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  portionText: {
    flex: 1,
  },
  portionLabel: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  portionDescription: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a4a4a',
    borderRadius: 24,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6a6a6a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
  },
  counterValue: {
    marginHorizontal: 16,
    fontSize: 16,
    color: '#ffffff',
    minWidth: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#4a4a4a',
  },
  totalLabel: {
    fontSize: 16,
    color: '#c5c5c5',
    marginRight: 8,
  },
  totalValue: {
    fontSize: 18,
    color: '#a82828',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitPickerModal: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#5a5a5a',
  },
  unitPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  unitOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#4a4a4a',
  },
  unitOptionSelected: {
    backgroundColor: '#a82828',
  },
  unitOptionText: {
    fontSize: 16,
    color: '#c5c5c5',
    textAlign: 'center',
  },
  unitOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export const calculateTotalCups = (visualPortions: VisualPortions, userBiometrics: { fistVolume: number; thumbVolume: number; pinkyVolume: number }): number => {
  const cupSizes = calculatePortionSizes(userBiometrics, 'cup');
  return (
    visualPortions.fists * cupSizes.fist +
    visualPortions.thumbs * cupSizes.thumb +
    visualPortions.pinkies * cupSizes.pinky
  );
};

export const calculateTotalInUnit = (visualPortions: VisualPortions, unit: string, userBiometrics: { fistVolume: number; thumbVolume: number; pinkyVolume: number }): number => {
  const portionSizes = calculatePortionSizes(userBiometrics, unit);
  return (
    visualPortions.fists * portionSizes.fist +
    visualPortions.thumbs * portionSizes.thumb +
    visualPortions.pinkies * portionSizes.pinky
  );
};