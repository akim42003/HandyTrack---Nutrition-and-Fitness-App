// USDA FoodData Central API Integration
// API Documentation: https://fdc.nal.usda.gov/api-guide.html

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
}

export interface USDAFoodItem {
  fdcId: number;
  description: string;
  dataType: string;
  publicationDate: string;
  brandOwner?: string;
  ingredients?: string;
  foodNutrients: USDANutrient[];
  foodCategory?: string;
}

export interface USDASearchResult {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  foods: USDAFoodItem[];
}

export interface ProcessedFood {
  id: string;
  name: string;
  category: string;
  caloriesPerGram: number;
  protein: number; // grams per 100g
  carbs: number; // grams per 100g
  fat: number; // grams per 100g
  fiber: number; // grams per 100g
  searchTerms: string[];
  fdcId: number; // Store original USDA ID for reference
}

class USDAFoodService {
  private baseUrl = 'https://api.nal.usda.gov/fdc/v1';
  private apiKey: string;

  constructor() {
    // You'll need to get a free API key from: https://fdc.nal.usda.gov/api-key-signup.html
    // For now, we'll use a placeholder - you'll need to replace this with your actual key
    this.apiKey = process.env.EXPO_PUBLIC_USDA_API_KEY || 'YOUR_API_KEY_HERE';
  }

  /**
   * Search for foods in the USDA database
   */
  async searchFoods(query: string, pageSize: number = 25): Promise<ProcessedFood[]> {
    try {
      const searchParams = new URLSearchParams({
        api_key: this.apiKey,
        query: query,
        dataType: 'Foundation,SR Legacy', // Focus on most accurate data types
        pageSize: (pageSize * 2).toString(), // Get more results to filter better
        sortBy: 'dataType.keyword',
        sortOrder: 'asc'
      });

      const response = await fetch(`${this.baseUrl}/foods/search?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }

      const data: USDASearchResult = await response.json();
      
      // Process and deduplicate results
      const processedFoods = data.foods.map(food => this.processFoodItem(food));
      const deduplicatedFoods = this.deduplicateResults(processedFoods, query);
      
      // Return only the requested number of results
      return deduplicatedFoods.slice(0, pageSize);
    } catch (error) {
      console.error('Error searching USDA foods:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a specific food item
   */
  async getFoodDetails(fdcId: number): Promise<ProcessedFood | null> {
    try {
      const response = await fetch(`${this.baseUrl}/food/${fdcId}?api_key=${this.apiKey}`);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }

      const food: USDAFoodItem = await response.json();
      return this.processFoodItem(food);
    } catch (error) {
      console.error('Error getting USDA food details:', error);
      return null;
    }
  }

  /**
   * Process raw USDA food item into our app's format
   */
  private processFoodItem(usdaFood: USDAFoodItem): ProcessedFood {
    // Extract key nutrients (per 100g)
    const nutrients = this.extractNutrients(usdaFood.foodNutrients);
    
    // Generate search terms from description
    const searchTerms = this.generateSearchTerms(usdaFood.description);
    
    // Determine category
    const category = this.categorizeFood(usdaFood);

    return {
      id: `usda_${usdaFood.fdcId}`,
      name: this.cleanFoodName(usdaFood.description),
      category,
      caloriesPerGram: nutrients.calories / 100, // Convert to per gram
      protein: nutrients.protein,
      carbs: nutrients.carbs,
      fat: nutrients.fat,
      fiber: nutrients.fiber,
      searchTerms,
      fdcId: usdaFood.fdcId
    };
  }

  /**
   * Extract nutrition values from USDA nutrient array
   */
  private extractNutrients(foodNutrients: USDANutrient[]) {
    const nutrients = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    };

    foodNutrients.forEach(nutrient => {
      const value = nutrient.value || 0;
      
      // Map USDA nutrient IDs to our nutrients
      switch (nutrient.nutrientId) {
        case 1008: // Energy (calories)
          nutrients.calories = value;
          break;
        case 1003: // Protein
          nutrients.protein = value;
          break;
        case 1005: // Carbohydrate, by difference
          nutrients.carbs = value;
          break;
        case 1004: // Total lipid (fat)
          nutrients.fat = value;
          break;
        case 1079: // Fiber, total dietary
          nutrients.fiber = value;
          break;
      }
    });

    return nutrients;
  }

  /**
   * Generate search terms from food description
   */
  private generateSearchTerms(description: string): string[] {
    const terms: string[] = [];
    const lowerDesc = description.toLowerCase();
    
    // Split into individual words, removing short and common words
    const words = lowerDesc
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2)
      .filter(term => !['raw', 'cooked', 'fresh', 'dried', 'the', 'and', 'with', 'usda', 'ndb'].includes(term));
    
    terms.push(...words);
    
    // Add important compound terms for better search matching
    if (lowerDesc.includes('chicken')) {
      terms.push('chicken', 'poultry');
      if (lowerDesc.includes('breast')) terms.push('chicken breast');
      if (lowerDesc.includes('thigh')) terms.push('chicken thigh');
      if (lowerDesc.includes('wing')) terms.push('chicken wing');
    }
    
    if (lowerDesc.includes('beef')) {
      terms.push('beef', 'meat');
      if (lowerDesc.includes('ground')) terms.push('ground beef', 'hamburger');
      if (lowerDesc.includes('chuck')) terms.push('chuck roast');
      if (lowerDesc.includes('sirloin')) terms.push('sirloin steak');
    }
    
    if (lowerDesc.includes('salmon')) {
      terms.push('salmon', 'fish', 'seafood');
      if (lowerDesc.includes('atlantic')) terms.push('atlantic salmon');
      if (lowerDesc.includes('fillet')) terms.push('salmon fillet');
    }
    
    if (lowerDesc.includes('rice')) {
      terms.push('rice', 'grain');
      if (lowerDesc.includes('brown')) terms.push('brown rice');
      if (lowerDesc.includes('white')) terms.push('white rice');
    }
    
    // Add the full cleaned name
    terms.push(this.cleanFoodName(description).toLowerCase());
    
    return [...new Set(terms)]; // Remove duplicates
  }

  /**
   * Categorize food based on USDA data
   */
  private categorizeFood(usdaFood: USDAFoodItem): string {
    const description = usdaFood.description.toLowerCase();
    const category = usdaFood.foodCategory?.toLowerCase() || '';

    // Protein sources
    if (description.includes('chicken') || description.includes('turkey') || 
        description.includes('duck') || description.includes('poultry')) {
      return 'Protein';
    }
    if (description.includes('beef') || description.includes('pork') || 
        description.includes('lamb') || description.includes('meat')) {
      return 'Protein';
    }
    if (description.includes('fish') || description.includes('salmon') || 
        description.includes('tuna') || description.includes('seafood') ||
        description.includes('shrimp') || description.includes('crab')) {
      return 'Protein';
    }
    if (description.includes('egg')) {
      return 'Protein';
    }

    // Dairy
    if (description.includes('milk') || description.includes('cheese') || 
        description.includes('yogurt') || description.includes('dairy')) {
      return 'Dairy';
    }

    // Grains/Carbs
    if (description.includes('rice') || description.includes('pasta') || 
        description.includes('bread') || description.includes('oat') ||
        description.includes('wheat') || description.includes('grain')) {
      return 'Carbohydrate';
    }
    if (description.includes('potato') || description.includes('sweet potato')) {
      return 'Carbohydrate';
    }

    // Vegetables
    if (category.includes('vegetable') || description.includes('broccoli') || 
        description.includes('spinach') || description.includes('carrot') ||
        description.includes('pepper') || description.includes('onion') ||
        description.includes('tomato') || description.includes('lettuce')) {
      return 'Vegetable';
    }

    // Fruits
    if (category.includes('fruit') || description.includes('apple') || 
        description.includes('banana') || description.includes('orange') ||
        description.includes('berry') || description.includes('grape')) {
      return 'Fruit';
    }

    // Fats/Oils
    if (description.includes('oil') || description.includes('butter') || 
        description.includes('avocado') || description.includes('nuts') ||
        description.includes('seed')) {
      return 'Fat';
    }

    // Default category
    return 'Other';
  }

  /**
   * Clean and format food name for display
   */
  private cleanFoodName(description: string): string {
    // Preserve important cuts and parts while cleaning
    let cleaned = description
      .replace(/^(RAW|COOKED|FRESH|DRIED)\s+/i, '') // Remove preparation prefixes
      .replace(/,\s+(RAW|COOKED|FRESH|DRIED)$/i, '') // Remove preparation suffixes
      .replace(/\bUSDA\b/gi, '') // Remove USDA references
      .replace(/\bNDB\b/gi, '') // Remove NDB references
      .trim();
    
    // Split by comma and take the most descriptive part
    const parts = cleaned.split(',').map(part => part.trim());
    
    // Prefer parts that contain specific cuts or important descriptors
    const importantPart = parts.find(part => 
      /\b(breast|thigh|wing|leg|tenderloin|fillet|ground|chuck|sirloin|ribeye)\b/i.test(part)
    ) || parts[0];
    
    // Format with proper capitalization
    return importantPart
      .split(' ')
      .map(word => {
        // Keep important cuts/descriptors properly formatted
        const lowerWord = word.toLowerCase();
        if (['breast', 'thigh', 'wing', 'leg', 'ground', 'fillet'].includes(lowerWord)) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  /**
   * Deduplicate search results to reduce similar entries
   */
  private deduplicateResults(foods: ProcessedFood[], query: string): ProcessedFood[] {
    const seen = new Map<string, ProcessedFood>();
    const queryLower = query.toLowerCase();
    
    // Sort by relevance to query and data quality
    const sortedFoods = foods.sort((a, b) => {
      // Prioritize exact matches
      const aExact = a.name.toLowerCase().includes(queryLower);
      const bExact = b.name.toLowerCase().includes(queryLower);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Prioritize Foundation data over SR Legacy
      const aFoundation = a.id.includes('foundation');
      const bFoundation = b.id.includes('foundation');
      if (aFoundation && !bFoundation) return -1;
      if (!aFoundation && bFoundation) return 1;
      
      return 0;
    });
    
    for (const food of sortedFoods) {
      // Create a normalized key for deduplication
      const normalizedName = this.normalizeForDeduplication(food.name);
      
      // Only keep the first (highest quality) match for each normalized name
      if (!seen.has(normalizedName)) {
        seen.set(normalizedName, food);
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * Normalize food names for deduplication
   */
  private normalizeForDeduplication(name: string): string {
    return name
      .toLowerCase()
      .replace(/\b(raw|cooked|fresh|frozen|dried|boiled|baked|grilled|roasted)\b/g, '') // Remove preparation methods
      .replace(/\b(usda|ndb)\b/g, '') // Remove USDA references
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      // Keep important distinguishing words for deduplication
      + '|' + this.extractKeyDistinguishers(name);
  }

  /**
   * Extract key distinguishing features to prevent over-deduplication
   */
  private extractKeyDistinguishers(name: string): string {
    const distinguishers: string[] = [];
    const lowerName = name.toLowerCase();
    
    // Meat cuts
    if (lowerName.includes('breast')) distinguishers.push('breast');
    if (lowerName.includes('thigh')) distinguishers.push('thigh');
    if (lowerName.includes('wing')) distinguishers.push('wing');
    if (lowerName.includes('leg')) distinguishers.push('leg');
    if (lowerName.includes('ground')) distinguishers.push('ground');
    if (lowerName.includes('fillet')) distinguishers.push('fillet');
    if (lowerName.includes('tenderloin')) distinguishers.push('tenderloin');
    
    // Fat content for ground meats
    if (lowerName.includes('85/15') || lowerName.includes('85% lean')) distinguishers.push('85lean');
    if (lowerName.includes('80/20') || lowerName.includes('80% lean')) distinguishers.push('80lean');
    if (lowerName.includes('90/10') || lowerName.includes('90% lean')) distinguishers.push('90lean');
    if (lowerName.includes('93/7') || lowerName.includes('93% lean')) distinguishers.push('93lean');
    
    // Preparation state
    if (lowerName.includes('skinless')) distinguishers.push('skinless');
    if (lowerName.includes('boneless')) distinguishers.push('boneless');
    
    return distinguishers.join('_');
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return this.apiKey !== 'YOUR_API_KEY_HERE' && this.apiKey.length > 0;
  }
}

export const usdaFoodService = new USDAFoodService();