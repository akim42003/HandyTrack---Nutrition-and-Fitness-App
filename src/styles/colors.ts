// Professional Color System for BiometricFitness
export const colors = {
  // Base Neutrals - Sophisticated dark theme
  background: {
    primary: '#1e2127',       // Deep charcoal background
    secondary: '#2a2d33',     // Warm charcoal for cards
    tertiary: '#363b43',      // Elevated surfaces
    overlay: 'rgba(30, 33, 39, 0.95)', // Modal overlays
  },

  // Surface Colors with Elevation
  surface: {
    level0: '#1e2127',        // Base level
    level1: '#2a2d33',        // Cards, inputs
    level2: '#363b43',        // Elevated cards
    level3: '#414852',        // Highest elevation
  },

  // Primary Palette - Refined red system
  primary: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#c84545',           // Main brand red
    600: '#b73e3e',
    700: '#8b2635',           // Deep burgundy
    800: '#7f1d1d',
    900: '#6b1d1d',
  },

  // Accent Colors
  accent: {
    green: '#4a7c59',         // Success/progress
    amber: '#d4822a',         // Warning/attention
    blue: '#4f6fa8',          // Info/links
    purple: '#8b5ba6',        // Special features
  },

  // Text Hierarchy
  text: {
    primary: '#f5f5f5',       // Main text - softer white
    secondary: '#b8bcc8',     // Secondary text
    tertiary: '#8e939d',     // Subtle text
    disabled: '#6c7079',      // Disabled state
    inverse: '#1e2127',       // Text on light backgrounds
  },

  // Semantic Colors
  semantic: {
    success: '#4a7c59',
    warning: '#d4822a',
    error: '#c84545',
    info: '#4f6fa8',
  },

  // Gradients for modern depth
  gradients: {
    primary: 'linear-gradient(135deg, #2a2d33 0%, #363b43 100%)',
    card: 'linear-gradient(145deg, #2a2d33 0%, #323741 50%, #363b43 100%)',
    button: 'linear-gradient(135deg, #c84545 0%, #b73e3e 100%)',
    buttonSecondary: 'linear-gradient(135deg, #414852 0%, #363b43 100%)',
    header: 'linear-gradient(180deg, #2a2d33 0%, rgba(42, 45, 51, 0.95) 100%)',
  },

  // Border Colors
  border: {
    primary: '#414852',
    secondary: '#363b43',
    accent: '#c84545',
    subtle: '#2a2d33',
  },

  // Shadow System
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
    button: {
      shadowColor: '#c84545',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

// Helper functions for dynamic colors
export const getAlpha = (color: string, alpha: number) => {
  // Convert hex to rgba with alpha
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getElevationStyle = (level: 1 | 2 | 3 | 4) => {
  const shadowMap = {
    1: colors.shadows.small,
    2: colors.shadows.small,
    3: colors.shadows.medium,
    4: colors.shadows.large,
  };
  
  const backgroundMap = {
    1: colors.surface.level1,
    2: colors.surface.level2,
    3: colors.surface.level3,
    4: colors.surface.level3,
  };

  return {
    backgroundColor: backgroundMap[level],
    ...shadowMap[level],
  };
};