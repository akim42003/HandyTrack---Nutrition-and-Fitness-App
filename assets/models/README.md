# Food Recognition Models

This directory contains TensorFlow Lite models for food recognition.

## Current Status

The app has TensorFlow Lite infrastructure set up with the `food_classifier_v1.tflite` model, but the image preprocessing and inference pipeline are not yet implemented. The camera feature will fail gracefully and direct users to manual food entry.

## To Complete Implementation

The remaining work to make food recognition functional:

1. **Image Preprocessing** (`preprocessImage` method):
   - Load image from file URI using react-native-vision-camera
   - Resize to model input dimensions (likely 224x224)
   - Normalize pixel values (0-1 range)
   - Convert to tensor format

2. **Model Output Processing** (`processModelOutput` method):
   - Extract confidence scores and class predictions
   - Map class indices to food names using model's label file
   - Filter by confidence threshold (e.g., >0.7)
   - Return formatted results

3. **Model Label Mapping**:
   - Obtain the label file that maps class indices to food names
   - Update the food database to match model's food categories

## Suggested Models

- **Food-101**: Popular food classification dataset with 101 food categories
- **Nutrition5k**: Dataset focused on nutrition estimation from food images
- **Custom trained models**: Using TensorFlow or PyTorch, converted to TensorFlow Lite

## Model Requirements

- Format: TensorFlow Lite (.tflite)
- Input: RGB images (typically 224x224 or 299x299 pixels)
- Output: Food category classifications with confidence scores
- Size: Preferably under 50MB for mobile deployment

## Performance Notes

- Models should be optimized for mobile inference
- Consider quantization to reduce model size
- GPU acceleration available via CoreML delegate on iOS