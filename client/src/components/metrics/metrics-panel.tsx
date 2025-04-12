import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MdHistory } from 'react-icons/md';
import AttentionMeter from './attention-meter';
import HeartRateMeter from './heart-rate-meter';
import EmotionAnalysis from './emotion-analysis';
import EyeTrackingStatsComponent from './eye-tracking-stats';
import { EmotionResult } from '@/lib/face-analyzer';
import eyeTracker, { EyeTrackingResult, EyeTrackingStats as EyeStats } from '@/lib/eye-tracking';
import { HeartRateResult } from '@/lib/heart-rate-estimator';

const MetricsPanel: React.FC = () => {
  // Metrics state
  const [attentionScore, setAttentionScore] = useState(0);
  const [heartRate, setHeartRate] = useState(0);
  const [emotions, setEmotions] = useState<EmotionResult[]>([]);
  const [eyeStats, setEyeStats] = useState<EyeStats>({
    blinkRate: 0,
    fixationTime: 0,
    saccadesPerMin: 0,
    focusPoints: 0
  });
  
  // Listen for biometric data events
  useEffect(() => {
    const handleBiometricData = (event: any) => {
      const { emotions, eyeTracking, heartRate } = event.detail;
      
      // Update emotions if available
      if (emotions && emotions.length > 0) {
        setEmotions(emotions);
      }
      
      // Update eye tracking metrics if available
      if (eyeTracking) {
        setAttentionScore(eyeTracking.attentionScore || 0);
        setEyeStats(eyeTracker.getStats());
      }
      
      // Update heart rate if available
      if (heartRate && heartRate.bpm > 0) {
        setHeartRate(heartRate.bpm);
      }
    };
    
    window.addEventListener('biometricData', handleBiometricData);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('biometricData', handleBiometricData);
    };
  }, []);
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Real-time Metrics</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 space-y-6">
        <AnimatePresence mode="wait">
          {attentionScore > 0 ? (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Attention Score */}
              <AttentionMeter value={attentionScore} />
              
              {/* Heart Rate */}
              <HeartRateMeter value={heartRate} />
              
              {/* Emotion Analysis */}
              <EmotionAnalysis emotions={emotions} />
              
              {/* Eye Tracking Stats */}
              <EyeTrackingStatsComponent stats={eyeStats} />
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center"
            >
              <div className="animate-pulse flex flex-col items-center">
                <div className="rounded-full bg-gray-200 h-16 w-16 flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2.5"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <p className="mt-4 text-sm text-gray-500">Waiting for video stream data...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      
      <CardFooter className="px-4 py-3 bg-gray-50 flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs"
        >
          <MdHistory className="mr-1 h-3 w-3" />
          View Historical Data
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MetricsPanel;
