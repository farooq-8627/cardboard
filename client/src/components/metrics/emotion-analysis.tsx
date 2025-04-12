import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EmotionResult } from '@/lib/face-analyzer';
import { MdSentimentSatisfiedAlt } from 'react-icons/md';

interface EmotionAnalysisProps {
  emotions: EmotionResult[];
}

const EMOTION_COLORS: Record<string, string> = {
  neutral: 'bg-gray-500',
  happy: 'bg-amber-500',
  sad: 'bg-blue-400',
  angry: 'bg-red-500',
  fearful: 'bg-purple-400',
  disgusted: 'bg-green-500',
  surprised: 'bg-pink-500'
};

const EmotionAnalysis: React.FC<EmotionAnalysisProps> = ({ emotions }) => {
  // Take top 3 emotions to display
  const topEmotions = emotions.slice(0, 3);
  
  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center">
        <MdSentimentSatisfiedAlt className="text-lg text-amber-500 mr-2" />
        <h3 className="text-sm font-medium text-gray-700">Emotion Analysis</h3>
      </div>
      
      {/* Emotion Bars */}
      <div className="space-y-2">
        {topEmotions.length > 0 ? (
          topEmotions.map((emotion, index) => (
            <motion.div
              key={emotion.emotion}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="grid grid-cols-5 items-center gap-2"
            >
              <div className="col-span-1 text-xs text-gray-500 capitalize">
                {emotion.emotion}
              </div>
              <div className="col-span-3">
                <motion.div
                  className="w-full bg-gray-200 rounded-full h-2"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                >
                  <motion.div
                    className={`${EMOTION_COLORS[emotion.emotion] || 'bg-gray-500'} h-2 rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(emotion.probability * 100)}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                </motion.div>
              </div>
              <div className="col-span-1 text-xs text-right">
                {Math.round(emotion.probability * 100)}%
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-2 text-sm text-gray-500 text-center">
            No emotion data available
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionAnalysis;
