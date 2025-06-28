import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, PhotoFile } from 'react-native-vision-camera';
import { foodRecognitionService } from '../services/foodRecognitionService';

const { width, height } = Dimensions.get('window');

interface FoodRecognitionResult {
  foodName: string;
  confidence: number;
  estimatedCalories: number;
  estimatedWeight: number; // in grams
}

interface FoodCameraProps {
  visible: boolean;
  onClose: () => void;
  onFoodRecognized: (result: FoodRecognitionResult) => void;
}

export const FoodCamera: React.FC<FoodCameraProps> = ({
  visible,
  onClose,
  onFoodRecognized,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<any>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    if (visible && !hasPermission) {
      requestPermission();
    }
  }, [visible, hasPermission]);

  useEffect(() => {
    // Load the model when component mounts
    if (visible && Platform.OS !== 'web') {
      setIsModelLoading(true);
      setModelError(null);
      foodRecognitionService.loadModel()
        .then((loaded) => {
          if (!loaded) {
            setModelError('Food recognition model could not be loaded');
          }
        })
        .catch(error => {
          console.error('Failed to load food recognition model:', error);
          setModelError('Failed to initialize food recognition');
        })
        .finally(() => {
          setIsModelLoading(false);
        });
    }
  }, [visible]);

  const capturePhoto = useCallback(async () => {
    if (!camera.current) return;

    try {
      setIsProcessing(true);
      
      // Capture photo
      const photo: PhotoFile = await camera.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });
      
      // photo.path might already include file:// prefix on some platforms
      const imageUri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      setCapturedImage(imageUri);
      
      // Process the image for food recognition
      const result = await foodRecognitionService.processImage(imageUri);
      setRecognitionResult(result);
      
    } catch (error) {
      console.error('Error capturing/processing photo:', error);
      Alert.alert(
        'Recognition Failed',
        'Unable to recognize food. Please try again or use manual entry.',
        [
          { text: 'Try Again', onPress: () => retakePhoto() },
          { text: 'Manual Entry', onPress: onClose }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  }, [onClose]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setRecognitionResult(null);
  }, []);

  const confirmRecognition = useCallback(() => {
    if (recognitionResult) {
      onFoodRecognized({
        foodName: recognitionResult.foodName,
        confidence: recognitionResult.confidence,
        estimatedCalories: recognitionResult.estimatedCalories,
        estimatedWeight: recognitionResult.estimatedWeight,
      });
    }
  }, [recognitionResult, onFoodRecognized]);

  // Show platform not supported message for web
  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Camera Not Supported</Text>
          <Text style={styles.errorText}>
            Food recognition camera is not available on web. Please use manual food entry instead.
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Use Manual Entry</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  // Check for camera device
  if (!device) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>No Camera Found</Text>
          <Text style={styles.errorText}>
            Unable to access camera. Please check your device settings.
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  // Check for camera permission
  if (!hasPermission) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Camera Permission Required</Text>
          <Text style={styles.errorText}>
            Please grant camera permission to use food recognition.
          </Text>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => requestPermission()}
          >
            <Text style={styles.closeButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.closeButton, styles.secondaryButton]} 
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        {!capturedImage ? (
          <>
            <Camera
              ref={camera}
              style={StyleSheet.absoluteFillObject}
              device={device}
              isActive={visible}
              photo={true}
            />
            
            <View style={styles.overlay}>
              <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle}>Capture Food</Text>
                  <Text style={styles.betaLabel}>BETA</Text>
                </View>
                <View style={{ width: 40 }} />
              </View>

              {isModelLoading ? (
                <View style={styles.guidanceContainer}>
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#a82828" />
                    <Text style={styles.loadingText}>Loading AI model...</Text>
                  </View>
                </View>
              ) : modelError ? (
                <View style={styles.guidanceContainer}>
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{modelError}</Text>
                    <TouchableOpacity 
                      style={styles.retryButton}
                      onPress={() => {
                        setModelError(null);
                        setIsModelLoading(true);
                        foodRecognitionService.loadModel()
                          .then((loaded) => {
                            if (!loaded) {
                              setModelError('Food recognition model could not be loaded');
                            }
                          })
                          .catch(error => {
                            console.error('Failed to load food recognition model:', error);
                            setModelError('Failed to initialize food recognition');
                          })
                          .finally(() => {
                            setIsModelLoading(false);
                          });
                      }}
                    >
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.guidanceContainer}>
                    <View style={styles.guidanceBox}>
                      <Text style={styles.guidanceText}>
                        Center the food in the frame
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bottomControls}>
                    <TouchableOpacity 
                      style={styles.captureButton}
                      onPress={capturePhoto}
                      disabled={isProcessing || isModelLoading}
                    >
                      <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                    <Text style={styles.captureHint}>Tap to capture</Text>
                  </View>
                </>
              )}
            </View>
          </>
        ) : (
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            
            {isProcessing ? (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color="#a82828" />
                <Text style={styles.processingText}>Analyzing food...</Text>
              </View>
            ) : recognitionResult ? (
              <View style={styles.resultOverlay}>
                <View style={styles.resultCard}>
                  <Text style={styles.resultTitle}>Food Recognized!</Text>
                  <Text style={styles.foodName}>{recognitionResult.foodName}</Text>
                  <Text style={styles.confidence}>
                    Confidence: {Math.round(recognitionResult.confidence * 100)}%
                  </Text>
                  
                  <View style={styles.nutritionEstimate}>
                    <Text style={styles.nutritionTitle}>⚠️ Development Notice</Text>
                    <Text style={styles.disclaimerText}>
                      Nutritional estimation is currently in development. 
                    </Text>
                    <Text style={styles.disclaimerText}>
                      Food recognition may identify items, but nutritional values are not yet available.
                    </Text>
                    <Text style={styles.disclaimerText}>
                      Please use manual entry for accurate nutrition tracking.
                    </Text>
                  </View>

                  <View style={styles.resultActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.retakeButton]}
                      onPress={retakePhoto}
                    >
                      <Text style={styles.actionButtonText}>Retake</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.confirmButton]}
                      onPress={confirmRecognition}
                    >
                      <Text style={styles.actionButtonText}>Use This</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#3c3c3c',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  errorText: {
    fontSize: 16,
    color: '#c5c5c5',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  betaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a82828',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: '#a82828',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#4a4a4a',
    marginTop: 10,
  },
  guidanceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidanceBox: {
    width: width * 0.8,
    height: width * 0.8,
    borderWidth: 2,
    borderColor: '#a82828',
    borderRadius: 20,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 40, 40, 0.1)',
  },
  guidanceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bottomControls: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    padding: 5,
    marginBottom: 10,
  },
  captureButtonInner: {
    flex: 1,
    borderRadius: 35,
    backgroundColor: '#a82828',
  },
  captureHint: {
    color: '#fff',
    fontSize: 14,
  },
  previewContainer: {
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#3c3c3c',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#a82828',
    marginBottom: 15,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  confidence: {
    fontSize: 14,
    color: '#c5c5c5',
    marginBottom: 20,
  },
  nutritionEstimate: {
    backgroundColor: '#4a4a4a',
    borderRadius: 12,
    padding: 15,
    width: '100%',
    marginBottom: 20,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  nutritionText: {
    fontSize: 14,
    color: '#c5c5c5',
    marginBottom: 5,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#ffa500',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 120,
  },
  retakeButton: {
    backgroundColor: '#4a4a4a',
  },
  confirmButton: {
    backgroundColor: '#a82828',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingBox: {
    backgroundColor: 'rgba(60, 60, 60, 0.9)',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
  },
  errorBox: {
    backgroundColor: 'rgba(60, 60, 60, 0.9)',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: width * 0.8,
  },
  retryButton: {
    backgroundColor: '#a82828',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 15,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});