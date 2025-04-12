import React from 'react';
import { motion } from 'framer-motion';
import { MdOutlineRemoveRedEye } from 'react-icons/md';
import { Progress } from '@/components/ui/progress';

interface AttentionMeterProps {
  value: number;
}

const AttentionMeter: React.FC<AttentionMeterProps> = ({ value }) => {
  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <MdOutlineRemoveRedEye className="text-lg text-primary mr-2" />
          <h3 className="text-sm font-medium text-gray-700">Attention Score</h3>
        </div>
        <motion.span 
          key={value}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-semibold metrics-pulse"
        >
          {value}%
        </motion.span>
      </div>
      
      <Progress value={value} className="h-2.5" />
      
      <p className="text-xs text-gray-500">Based on eye-tracking data and interaction patterns</p>
    </div>
  );
};

export default AttentionMeter;
