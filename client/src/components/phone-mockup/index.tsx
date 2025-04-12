import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useWebRTC } from '@/context/webrtc-context';
import CardboardBox from './cardboard-box';
import { Button } from '@/components/ui/button';

interface PhoneMockupProps {
  isOpen: boolean;
  onToggleOpen: () => void;
}

const PhoneMockup: React.FC<PhoneMockupProps> = ({ isOpen, onToggleOpen }) => {
  const { localVideoRef, localStream, startStream, stopStream, deviceType } = useWebRTC();
  
  // Animation values
  const rotateY = useMotionValue(0);
  const opacity = useTransform(rotateY, [-30, 0], [0.3, 1]);
  
  // Start camera when component mounts and box is open
  useEffect(() => {
    if (isOpen && !localStream) {
      startStream('mobile');
    }
    
    return () => {
      if (localStream) {
        stopStream();
      }
    };
  }, [isOpen, localStream, startStream, stopStream]);
  
  return (
    <div className="w-full flex flex-col items-center justify-center">
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-xs"
        >
          <div className="phone-mockup relative mx-auto">
            {/* Phone frame */}
            <div className="relative border-8 border-gray-800 rounded-[40px] overflow-hidden shadow-xl">
              {/* Status bar */}
              <div className="absolute top-0 inset-x-0 h-6 bg-black z-10 flex items-center justify-between px-6">
                <div className="w-16 h-1.5 bg-gray-600 rounded-full"></div>
              </div>
              
              {/* Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-7 bg-black rounded-b-xl z-10"></div>
              
              {/* Phone screen */}
              <div className="relative bg-black aspect-[9/19] w-full overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Camera access UI overlay */}
                {!localStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 z-20">
                    <div className="rounded-full w-16 h-16 border-2 border-primary mb-4 flex items-center justify-center">
                      <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="text-white text-center">
                      <p className="text-sm mb-4">Allow camera access to continue</p>
                      <Button 
                        variant="outline" 
                        onClick={() => startStream('mobile')}
                        className="border-primary text-primary hover:bg-primary/10"
                      >
                        Start Camera
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Home button/indicator */}
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1/3 h-1 bg-gray-400 rounded-full"></div>
            </div>
            
            {/* Shadow */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3/4 h-4 bg-black/30 blur-lg rounded-full"></div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <Button
              onClick={onToggleOpen}
              variant="outline"
              className="mx-auto"
            >
              Put Back in Box
            </Button>
          </motion.div>
        </motion.div>
      ) : (
        <CardboardBox onOpen={onToggleOpen} />
      )}
    </div>
  );
};

export default PhoneMockup;
