export interface UnitSystem {
  weight: string;
  height: string;
  volume: string;
}

export const UNIT_SYSTEMS = {
  metric: {
    weight: 'kg',
    height: 'cm',
    volume: 'ml',
  },
  imperial: {
    weight: 'lbs',
    height: 'ft/in',
    volume: 'fl oz',
  },
};

// Weight conversions
export const kgToLbs = (kg: number): number => kg * 2.20462;
export const lbsToKg = (lbs: number): number => lbs / 2.20462;

// Height conversions
export const cmToFeetInches = (cm: number): { feet: number; inches: number } => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};

export const feetInchesToCm = (feet: number, inches: number): number => {
  return (feet * 12 + inches) * 2.54;
};

export const cmToInches = (cm: number): number => cm / 2.54;
export const inchesToCm = (inches: number): number => inches * 2.54;

// Volume conversions
export const mlToFlOz = (ml: number): number => ml / 29.5735;
export const flOzToMl = (flOz: number): number => flOz * 29.5735;

// Display formatting functions
export const formatWeight = (kg: number, unitSystem: 'metric' | 'imperial'): string => {
  if (unitSystem === 'imperial') {
    return `${Math.round(kgToLbs(kg) * 10) / 10} lbs`;
  }
  return `${Math.round(kg * 10) / 10} kg`;
};

export const formatHeight = (cm: number, unitSystem: 'metric' | 'imperial'): string => {
  if (unitSystem === 'imperial') {
    const { feet, inches } = cmToFeetInches(cm);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
};

export const formatVolume = (ml: number, unitSystem: 'metric' | 'imperial'): string => {
  if (unitSystem === 'imperial') {
    return `${Math.round(mlToFlOz(ml) * 10) / 10} fl oz`;
  }
  return `${Math.round(ml)} ml`;
};

// Get display values for editing (numbers only, no units)
export const getDisplayWeight = (kg: number, unitSystem: 'metric' | 'imperial'): string => {
  if (unitSystem === 'imperial') {
    return (Math.round(kgToLbs(kg) * 10) / 10).toString();
  }
  return (Math.round(kg * 10) / 10).toString();
};

export const getDisplayHeight = (cm: number, unitSystem: 'metric' | 'imperial'): string => {
  if (unitSystem === 'imperial') {
    const { feet, inches } = cmToFeetInches(cm);
    return `${feet}'${inches}"`;
  }
  return Math.round(cm).toString();
};

// Parse user input back to metric for storage
export const parseWeight = (input: string, unitSystem: 'metric' | 'imperial'): number => {
  const value = parseFloat(input);
  if (isNaN(value)) return 0;
  
  if (unitSystem === 'imperial') {
    return lbsToKg(value);
  }
  return value;
};

export const parseHeight = (input: string, unitSystem: 'metric' | 'imperial'): number => {
  if (unitSystem === 'imperial') {
    // Handle formats like "5'10", "5'10\"", "5 10", "70" (inches)
    const cleanInput = input.replace(/['"]/g, '').trim();
    
    if (cleanInput.includes(' ') || cleanInput.includes("'")) {
      // Format: "5 10" or "5'10"
      const parts = cleanInput.split(/[\s']+/);
      const feet = parseInt(parts[0]) || 0;
      const inches = parseInt(parts[1]) || 0;
      return feetInchesToCm(feet, inches);
    } else {
      // Assume total inches
      const totalInches = parseFloat(cleanInput);
      return inchesToCm(totalInches);
    }
  }
  
  return parseFloat(input) || 0;
};

// Helper for weight change (can be negative)
export const formatWeightChange = (kg: number, unitSystem: 'metric' | 'imperial'): string => {
  const sign = kg > 0 ? '+' : '';
  if (unitSystem === 'imperial') {
    return `${sign}${Math.round(kgToLbs(kg) * 10) / 10} lbs/week`;
  }
  return `${sign}${Math.round(kg * 10) / 10} kg/week`;
};

export const parseWeightChange = (input: string, unitSystem: 'metric' | 'imperial'): number => {
  // Remove any +/- signs and parse the number
  const cleanInput = input.replace(/^\+/, '');
  const value = parseFloat(cleanInput);
  if (isNaN(value)) return 0;
  
  if (unitSystem === 'imperial') {
    return lbsToKg(value);
  }
  return value;
};