import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MdPlayArrow, MdPause, MdRadioButtonChecked, MdSettings, MdWaves } from 'react-icons/md';
import { RiEmotionHappyLine } from 'react-icons/ri';

interface VideoControlsProps {
  isRecording: boolean;
  recordingTime: string;
  isPrivacyMode: boolean;
  showHeatmap: boolean;
  onToggleRecording: () => void;
  onTogglePrivacyMode: () => void;
  onToggleHeatmap: () => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  isRecording,
  recordingTime,
  isPrivacyMode,
  showHeatmap,
  onToggleRecording,
  onTogglePrivacyMode,
  onToggleHeatmap
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex justify-between items-center text-white"
    >
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
          onClick={() => {}}
        >
          <MdPause className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className={`p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white ${isRecording ? 'text-red-500' : 'text-white'}`}
          onClick={onToggleRecording}
        >
          <MdRadioButtonChecked className={`h-5 w-5 ${isRecording ? 'text-red-500' : 'text-white'}`} />
        </Button>
        
        <div className="text-sm">{recordingTime || '00:00:00'}</div>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="flex items-center">
          <span className="text-xs mr-2">Privacy Mode</span>
          <Switch
            checked={isPrivacyMode}
            onCheckedChange={onTogglePrivacyMode}
            className="bg-white/20 data-[state=checked]:bg-primary"
          />
        </div>
        
        <div className="flex items-center">
          <span className="text-xs mr-2">Emotion Heatmap</span>
          <Switch
            checked={showHeatmap}
            onCheckedChange={onToggleHeatmap}
            className="bg-white/20 data-[state=checked]:bg-amber-500"
          />
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
        >
          <MdSettings className="h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  );
};

export default VideoControls;
