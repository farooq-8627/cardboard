import * as faceapi from 'face-api.js';

// Emotions recognized by face-api.js
export type Emotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised';

// Interface for emotion detection results
export interface EmotionResult {
  emotion: Emotion;
  probability: number;
}

// Interface for face analysis results
export interface FaceAnalysisResult {
  emotions: EmotionResult[];
  landmarks: faceapi.FaceLandmarks68 | null;
  faceDetection: faceapi.FaceDetection | null;
}

export class FaceAnalyzer {
  private modelsLoaded: boolean = false;
  private isProcessing: boolean = false;
  
  constructor() {
    this.loadModels();
  }
  
  // Load required models
  private async loadModels() {
    try {
      // Set the models path
      const MODEL_URL = '/models';
      
      // Load models sequentially
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      
      console.log('Face-api.js models loaded successfully');
      this.modelsLoaded = true;
    } catch (error) {
      console.error('Error loading face-api.js models:', error);
      throw new Error('Failed to load face analysis models');
    }
  }
  
  // Check if models are loaded
  public isReady(): boolean {
    return this.modelsLoaded;
  }
  
  // Analyze a video frame for face detection, landmarks, and emotions
  public async analyzeFrame(video: HTMLVideoElement | HTMLCanvasElement): Promise<FaceAnalysisResult> {
    // Default empty result
    const emptyResult: FaceAnalysisResult = {
      emotions: [],
      landmarks: null,
      faceDetection: null
    };
    
    // Don't process if models aren't loaded or already processing
    if (!this.modelsLoaded || this.isProcessing) {
      return emptyResult;
    }
    
    try {
      this.isProcessing = true;
      
      // Detect all faces with landmarks and expressions
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
        .withFaceLandmarks()
        .withFaceExpressions();
      
      // If no faces detected, return empty result
      if (!detections || detections.length === 0) {
        return emptyResult;
      }
      
      // Use the first face detected (assuming single user)
      const detection = detections[0];
      
      // Format emotion results
      const emotions: EmotionResult[] = Object.entries(detection.expressions)
        .map(([emotion, probability]) => ({
          emotion: emotion as Emotion,
          probability
        }))
        .sort((a, b) => b.probability - a.probability);
      
      return {
        emotions,
        landmarks: detection.landmarks,
        faceDetection: detection.detection
      };
    } catch (error) {
      console.error('Error analyzing face:', error);
      return emptyResult;
    } finally {
      this.isProcessing = false;
    }
  }
  
  // Draw face landmarks on a canvas
  public drawFaceLandmarks(
    canvas: HTMLCanvasElement,
    landmarks: faceapi.FaceLandmarks68,
    detection: faceapi.FaceDetection
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw face landmarks
    faceapi.draw.drawFaceLandmarks(canvas, landmarks);
    
    // Optionally draw face detection box
    // faceapi.draw.drawDetections(canvas, detection);
  }
  
  // Get dominant emotion
  public getDominantEmotion(emotions: EmotionResult[]): EmotionResult | null {
    if (!emotions || emotions.length === 0) return null;
    return emotions[0]; // Already sorted by probability
  }
}

// Create a singleton instance
const faceAnalyzer = new FaceAnalyzer();
export default faceAnalyzer;
