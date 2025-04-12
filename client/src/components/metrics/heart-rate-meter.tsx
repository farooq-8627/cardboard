import React from 'react';
import { motion } from 'framer-motion';
import { FaHeartPulse } from 'react-icons/fa6';
import { Progress } from '@/components/ui/progress';

interface HeartRateMeterProps {
  value: number;
}

const HeartRateMeter: React.FC<HeartRateMeterProps> = ({ value }) => {
  // Calculate progress bar percentage (assuming 40-120 BPM range)
  const getProgressValue = () => {
    if (value <= 0) return 0;
    
    // Map heart rate to percentage
    // 40 BPM = 0%, 80 BPM = 50%, 120 BPM = 100%
    const percentage = ((value - 40) / 80) * 100;
    return Math.max(0, Math.min(100, percentage));
  };
  
  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FaHeartPulse className="text-lg text-destructive mr-2" />
          <h3 className="text-sm font-medium text-gray-700">Heart Rate</h3>
        </div>
        <div className="flex items-center">
          <motion.span
            key={value}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-lg font-semibold metrics-pulse"
          >
            {value || '--'}
          </motion.span>
          <span className="text-xs ml-1">BPM</span>
        </div>
      </div>
      
      <Progress value={getProgressValue()} className="h-2.5 bg-gray-200" 
        indicatorClassName="bg-destructive" />
      
      <p className="text-xs text-gray-500">Estimated from facial blood flow patterns</p>
    </div>
  );
};

export default HeartRateMeter;
