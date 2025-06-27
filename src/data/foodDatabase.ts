import { usdaFoodService, ProcessedFood } from '../services/usdaFoodApi';

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  caloriesPerGram: number;
  protein: number; // grams per 100g
  carbs: number; // grams per 100g
  fat: number; // grams per 100g
  fiber: number; // grams per 100g
  searchTerms: string[]; // for easy searching
}

// Convert USDA ProcessedFood to our FoodItem format
const convertToFoodItem = (usdaFood: ProcessedFood): FoodItem => ({
  id: usdaFood.id,
  name: usdaFood.name,
  category: usdaFood.category,
  caloriesPerGram: usdaFood.caloriesPerGram,
  protein: usdaFood.protein,
  carbs: usdaFood.carbs,
  fat: usdaFood.fat,
  fiber: usdaFood.fiber,
  searchTerms: usdaFood.searchTerms
});

// Main search function - now exclusively uses USDA API
export const searchFoods = async (query: string): Promise<FoodItem[]> => {
  const lowerQuery = query.toLowerCase().trim();
  
  // Return empty array if no query
  if (!lowerQuery) return [];

  // Require API to be configured
  if (!usdaFoodService.isConfigured()) {
    throw new Error('USDA API key not configured. Please set EXPO_PUBLIC_USDA_API_KEY in your .env file.');
  }

  try {
    const usdaResults = await usdaFoodService.searchFoods(query, 25);
    return usdaResults.map(convertToFoodItem);
  } catch (error) {
    console.error('Error searching USDA foods:', error);
    throw new Error('Unable to search foods. Please check your internet connection and try again.');
  }
};

// Get food by ID - now uses USDA API
export const getFoodById = async (id: string): Promise<FoodItem | undefined> => {
  // Extract USDA FDC ID from our formatted ID
  const fdcId = id.replace('usda_', '');
  const numericId = parseInt(fdcId);
  
  if (isNaN(numericId)) {
    console.error('Invalid food ID format:', id);
    return undefined;
  }

  if (!usdaFoodService.isConfigured()) {
    console.error('USDA API key not configured');
    return undefined;
  }

  try {
    const usdaFood = await usdaFoodService.getFoodDetails(numericId);
    return usdaFood ? convertToFoodItem(usdaFood) : undefined;
  } catch (error) {
    console.error('Error getting food details:', error);
    return undefined;
  }
};

// Popular food suggestions for when user hasn't searched yet
export const getPopularFoods = async (): Promise<FoodItem[]> => {
  if (!usdaFoodService.isConfigured()) {
    return [];
  }

  const popularSearches = [
    'chicken breast',
    'brown rice', 
    'salmon',
    'eggs',
    'broccoli',
    'sweet potato'
  ];

  try {
    // Get first result for each popular search
    const results: FoodItem[] = [];
    for (const search of popularSearches) {
      const foods = await usdaFoodService.searchFoods(search, 1);
      if (foods.length > 0) {
        results.push(convertToFoodItem(foods[0]));
      }
    }
    return results;
  } catch (error) {
    console.log('Could not load popular foods');
    return [];
  }
};

// Check if USDA API is ready
export const isUSDAApiReady = (): boolean => {
  return usdaFoodService.isConfigured();
};

// Get API status for debugging
export const getApiStatus = (): { configured: boolean; message: string } => {
  const configured = usdaFoodService.isConfigured();
  return {
    configured,
    message: configured 
      ? 'USDA API is ready' 
      : 'USDA API key not configured. Please add EXPO_PUBLIC_USDA_API_KEY to your .env file.'
  };
};