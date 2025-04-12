import React from 'react';
import { motion } from 'framer-motion';
import { EyeTrackingStats as EyeStats } from '@/lib/eye-tracking';
import { MdOutlineCenterFocusWeak } from 'react-icons/md';

interface EyeTrackingStatsProps {
  stats: EyeStats;
}

const EyeTrackingStatsComponent: React.FC<EyeTrackingStatsProps> = ({ stats }) => {
  const { blinkRate, fixationTime, saccadesPerMin, focusPoints } = stats;
  
  const statItems = [
    {
      label: 'Fixation',
      value: `${fixationTime}s`,
      key: 'fixation'
    },
    {
      label: 'Saccades',
      value: saccadesPerMin.toString(),
      key: 'saccades'
    },
    {
      label: 'Blink Rate',
      value: blinkRate.toString(),
      key: 'blink'
    },
    {
      label: 'Focus Points',
      value: focusPoints.toString(),
      key: 'focus'
    }
  ];
  
  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <MdOutlineCenterFocusWeak className="text-lg text-accent mr-2" />
        <h3 className="text-sm font-medium text-gray-700">Eye Tracking Stats</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {statItems.map((item, index) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 p-3 rounded-lg"
          >
            <div className="text-xs text-gray-500">{item.label}</div>
            <div className="text-lg font-semibold metrics-pulse">{item.value}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EyeTrackingStatsComponent;
