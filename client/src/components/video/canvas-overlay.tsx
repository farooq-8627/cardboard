import React, { useRef, useEffect, useState } from 'react';
import faceAnalyzer, { EmotionResult, FaceAnalysisResult } from '@/lib/face-analyzer';
import heartRateEstimator, { HeartRateResult } from '@/lib/heart-rate-estimator';
import eyeTracker, { EyeTrackingResult } from '@/lib/eye-tracking';
import EmotionHeatmap from './emotion-heatmap';

interface CanvasOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isPrivacyMode: boolean;
  showHeatmap?: boolean;
}

const CanvasOverlay: React.FC<CanvasOverlayProps> = ({ 
  videoRef,
  isPrivacyMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  // Setup canvas once video dimensions are available
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleVideoResize = () => {
      if (canvasRef.current && video) {
        const rect = video.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    
    // Set initial size
    if (video.videoWidth) {
      handleVideoResize();
    } else {
      // Wait for video to load
      video.addEventListener('loadedmetadata', handleVideoResize);
    }
    
    // Handle resize
    window.addEventListener('resize', handleVideoResize);
    
    return () => {
      window.removeEventListener('resize', handleVideoResize);
      video.removeEventListener('loadedmetadata', handleVideoResize);
    };
  }, [videoRef]);
  
  // Process video frames
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !canvasSize.width || !canvasSize.height || !video.srcObject) {
      return;
    }
    
    let animationFrameId: number;
    let lastFaceResult: FaceAnalysisResult | null = null;
    let lastEyeResult: EyeTrackingResult | null = null;
    let lastHeartRateResult: HeartRateResult = { bpm: 0, confidence: 0 };
    
    const processFrame = async () => {
      // Only process if video is playing
      if (video.paused || video.ended || !video.srcObject) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Skip processing in privacy mode, but keep animation frame running
      if (isPrivacyMode) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }
      
      // Process face detection and emotions every 5 frames
      if (Math.random() < 0.2) { // ~20% chance to run face analysis each frame
        try {
          lastFaceResult = await faceAnalyzer.analyzeFrame(video);
        } catch (error) {
          console.error('Face analysis error:', error);
        }
      }
      
      // Process eye tracking every frame
      try {
        lastEyeResult = await eyeTracker.processFrame(video, canvas);
      } catch (error) {
        console.error('Eye tracking error:', error);
      }
      
      // Process heart rate estimation
      try {
        const heartRatePoints = lastFaceResult?.landmarks ? 
          [
            { x: lastFaceResult.landmarks.positions[10].x, y: lastFaceResult.landmarks.positions[10].y },
            { x: lastFaceResult.landmarks.positions[30].x, y: lastFaceResult.landmarks.positions[30].y }
          ] : undefined;
          
        lastHeartRateResult = heartRateEstimator.processFrame(video, canvas, heartRatePoints);
      } catch (error) {
        console.error('Heart rate estimation error:', error);
      }
      
      // Draw face landmarks if available
      if (lastFaceResult?.landmarks && lastFaceResult.faceDetection) {
        faceAnalyzer.drawFaceLandmarks(canvas, lastFaceResult.landmarks, lastFaceResult.faceDetection);
      }
      
      // Draw eye tracking if available
      if (lastEyeResult) {
        eyeTracker.drawEyeLandmarks(canvas, lastEyeResult);
      }
      
      // Send data to parent component or store
      if (lastFaceResult || lastEyeResult || lastHeartRateResult.bpm > 0) {
        // Create event with biometric data
        const biometricEvent = new CustomEvent('biometricData', {
          detail: {
            emotions: lastFaceResult?.emotions,
            eyeTracking: lastEyeResult,
            heartRate: lastHeartRateResult
          }
        });
        
        // Dispatch event
        window.dispatchEvent(biometricEvent);
      }
      
      // Continue animation loop
      animationFrameId = requestAnimationFrame(processFrame);
    };
    
    // Start processing frames
    animationFrameId = requestAnimationFrame(processFrame);
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [videoRef, canvasRef, canvasSize, isPrivacyMode]);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      width={canvasSize.width}
      height={canvasSize.height}
    />
  );
};

export default CanvasOverlay;
