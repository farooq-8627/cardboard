import React, { useRef, useEffect, useState } from 'react';
import { EmotionResult } from '@/lib/face-analyzer';

interface EmotionHeatmapProps {
  emotions: EmotionResult[];
  videoRef: React.RefObject<HTMLVideoElement>;
  faceDetection: any; // faceapi.FaceDetection
  visible: boolean;
}

// Emotion color mapping with alpha
const EMOTION_COLORS: Record<string, string> = {
  neutral: 'rgba(120, 120, 120, 0.5)',
  happy: 'rgba(255, 191, 0, 0.6)',
  sad: 'rgba(66, 135, 245, 0.6)',
  angry: 'rgba(255, 55, 55, 0.7)',
  fearful: 'rgba(188, 99, 255, 0.6)',
  disgusted: 'rgba(38, 194, 36, 0.6)',
  surprised: 'rgba(255, 126, 243, 0.6)'
};

const EmotionHeatmap: React.FC<EmotionHeatmapProps> = ({ 
  emotions, 
  videoRef,
  faceDetection,
  visible
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
  
  // Draw heatmap overlay
  useEffect(() => {
    if (!visible || !canvasRef.current || !faceDetection || emotions.length === 0) {
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get the dominant emotion
    const dominantEmotion = emotions[0];
    if (!dominantEmotion) return;
    
    const box = faceDetection.box;
    if (!box) return;
    
    // Draw emotion heatmap centered on face
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const radius = box.width * 1.2; // Larger than face
    
    // Create radial gradient
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    
    // Set gradient colors
    const colorStr = EMOTION_COLORS[dominantEmotion.emotion] || 'rgba(120, 120, 120, 0.4)';
    gradient.addColorStop(0, colorStr);
    gradient.addColorStop(0.6, colorStr.replace(')', ', 0.4)')); // Lower opacity toward edges
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Transparent at the edges
    
    // Fill with gradient
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add emotion text label
    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Calculate the position to place the text (above the face)
    const textY = box.y - 20;
    
    // Add a background for the text for better visibility
    const text = dominantEmotion.emotion.toUpperCase();
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(
      centerX - textWidth / 2 - 5,
      textY - 2,
      textWidth + 10,
      20
    );
    
    // Draw the text
    ctx.fillStyle = 'white';
    ctx.fillText(text, centerX, textY);
    
    // Optionally, add intensity percentage
    const intensity = Math.round(dominantEmotion.probability * 100);
    const intensityText = `${intensity}%`;
    
    ctx.font = '12px sans-serif';
    const intensityMetrics = ctx.measureText(intensityText);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(
      centerX - intensityMetrics.width / 2 - 5,
      textY + 20,
      intensityMetrics.width + 10,
      18
    );
    
    ctx.fillStyle = 'white';
    ctx.fillText(intensityText, centerX, textY + 20);
    
  }, [emotions, faceDetection, canvasSize, visible]);
  
  if (!visible) return null;
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      width={canvasSize.width}
      height={canvasSize.height}
    />
  );
};

export default EmotionHeatmap;