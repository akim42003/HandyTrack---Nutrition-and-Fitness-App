# 🍎 USDA FoodData Central API Setup

Your app now includes integration with the **USDA FoodData Central API** to provide access to comprehensive nutrition data for hundreds of thousands of foods!

## 🚀 Quick Setup (2 minutes)

### Step 1: Get Your Free API Key
1. Go to **https://fdc.nal.usda.gov/api-key-signup.html**
2. Fill out the simple form (name, email, intended use)
3. Check your email for the API key

### Step 2: Configure Your App
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace `YOUR_API_KEY_HERE` with your actual API key:
   ```
   EXPO_PUBLIC_USDA_API_KEY=your-actual-api-key-here
   ```

3. Restart your development server:
   ```bash
   npm start
   ```

## ✅ That's it! 

Your app will now search through:
- **400,000+ USDA foods** - Raw ingredients, basic foods, nutrition data
- **Smart deduplication** - No more duplicate search results
- **Specific cuts** - Distinguishes "chicken breast" from "chicken thigh"
- **Quality ranking** - Best nutrition data prioritized

## 🔧 How It Works

- **Online**: Uses USDA API for comprehensive food search
- **Deduplication**: Eliminates duplicate entries from different data sources
- **Smart ranking**: Prioritizes exact matches and high-quality data
- **Clean display**: Removes USDA codes and technical jargon

## 📊 What You Get

- **Accurate nutrition data** from the US government database
- **No more duplicates** - Smart filtering eliminates redundant entries
- **Specific results** - "chicken breast" gets breast meat, not thighs
- **Professional grade data** - Same data used by nutrition professionals
- **Always up-to-date** - USDA maintains and updates the database

## 🛠 API Limits

- **1,000 requests per hour** - More than enough for normal use
- **Free forever** - Government public data
- **No subscription** - One-time setup

## 🔍 Enhanced Food Search

### **Smart Search Features:**
- **Deduplication**: Eliminates duplicate entries from different data sources
- **Specific cuts**: Distinguishes "chicken breast" from "chicken thigh"
- **Quality ranking**: Prioritizes most accurate nutrition data
- **Clean names**: Removes USDA codes and clutter for readable results

### **Search Examples:**
- **"chicken breast"** → Gets specifically breast meat, not thighs
- **"ground beef 85"** → Finds 85% lean ground beef specifically  
- **"salmon fillet"** → Returns filleted salmon, not whole fish
- **"brown rice cooked"** → Cooked brown rice with accurate portions
- **"sweet potato"** → Raw sweet potato for biometric measuring

### **Search Tips for Users:**
- **Be specific**: "chicken breast" vs "chicken" 
- **Include cut**: "beef sirloin" vs "beef"
- **Specify preparation**: "rice cooked" vs "rice raw"
- **Use lean %**: "ground beef 93" for lean ground beef

## 🐛 Troubleshooting

**Still seeing duplicate results?**
- The new deduplication system should eliminate most duplicates
- If you see any, they likely represent genuinely different preparations

**Search not specific enough?**
- Use more specific terms: "chicken breast" vs "chicken"
- Include preparation: "salmon fillet" vs "salmon"
- Add descriptors: "ground beef 85%" vs "ground beef"

**Getting API errors?**
- Verify your API key is correct in `.env`
- Restart the development server after changing `.env`
- Check your internet connection
- API shows clear error messages in the search interface

**Want to test without API?**
- Leave `EXPO_PUBLIC_USDA_API_KEY=YOUR_API_KEY_HERE` unchanged
- App will show configuration warning and disable search

## 📈 Benefits for Your Users

🎯 **Massive food database** - No more "food not found" frustrations  
🎯 **No duplicates** - Clean, organized search results  
🎯 **Specific results** - "chicken breast" finds exactly that  
🎯 **Accurate nutrition** - Government-grade nutrition data  
🎯 **Raw ingredients** - Perfect for biometric portion measurements  
🎯 **Professional quality** - Same database used by dietitians  

Your fitness app now has the same nutrition database used by professional nutritionists and dietitians! 💪