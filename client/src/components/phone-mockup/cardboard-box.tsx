import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CardboardBoxProps {
  onOpen: () => void;
}

const CardboardBox: React.FC<CardboardBoxProps> = ({ onOpen }) => {
  const [isHovering, setIsHovering] = useState(false);
  
  // Box parts variants for animation
  const boxVariants = {
    closed: { 
      rotateX: 0,
      transition: { duration: 0.5, ease: "easeInOut" }
    },
    hover: { 
      rotateX: -15,
      transition: { duration: 0.5, ease: "easeInOut" }
    },
    opening: {
      rotateX: -110,
      transition: { duration: 1, ease: "easeInOut" }
    }
  };
  
  // Shadow variants
  const shadowVariants = {
    closed: { 
      opacity: 0.2,
      scale: 1,
      transition: { duration: 0.5 }
    },
    hover: { 
      opacity: 0.3,
      scale: 1.05,
      transition: { duration: 0.5 }
    },
    opening: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.5 }
    }
  };
  
  const phoneVariants = {
    hidden: { 
      opacity: 0,
      y: 10,
      rotateX: 45,
      scale: 0.9
    },
    visible: { 
      opacity: 1,
      y: -40,
      rotateX: 0,
      scale: 1,
      transition: { 
        duration: 0.8,
        delay: 0.5,
        ease: "easeOut"
      }
    }
  };
  
  const [isOpening, setIsOpening] = useState(false);
  
  const handleOpen = () => {
    setIsOpening(true);
    
    // Wait for animation to complete before calling onOpen
    setTimeout(() => {
      onOpen();
    }, 1500);
  };
  
  return (
    <div className="w-full flex flex-col items-center justify-center py-8">
      <motion.div 
        className="relative"
        initial="closed"
        animate={isOpening ? "opening" : isHovering ? "hover" : "closed"}
        onMouseEnter={() => !isOpening && setIsHovering(true)}
        onMouseLeave={() => !isOpening && setIsHovering(false)}
        onClick={isHovering && !isOpening ? handleOpen : undefined}
      >
        {/* Box shadow */}
        <motion.div
          className="absolute -bottom-6 w-60 h-4 bg-black/30 rounded-full blur-md"
          variants={shadowVariants}
        />
        
        {/* Cardboard box */}
        <div className="relative w-64 h-64 perspective-1000">
          {/* Bottom part */}
          <div className="absolute inset-0 w-full h-48 bg-amber-700/80 rounded-lg">
            <div className="absolute inset-x-0 bottom-0 h-full w-full bg-amber-800/20 rounded-lg">
              {/* Box texture */}
              <div className="absolute inset-0 overflow-hidden opacity-30">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute h-0.5 w-full bg-black/10" 
                    style={{ top: `${i * 14}%` }}
                  />
                ))}
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-0.5 h-full bg-black/10" 
                    style={{ left: `${i * 14}%` }}
                  />
                ))}
              </div>
              
              {/* Box label */}
              <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-3 bg-white/90 px-3 py-1 rounded">
                <span className="text-sm font-bold uppercase tracking-wider text-gray-800">BiometricSync</span>
              </div>
            </div>
          </div>
          
          {/* Phone inside box (only visible when opening) */}
          {isOpening && (
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
              initial="hidden"
              animate="visible"
              variants={phoneVariants}
            >
              <div className="w-12 h-20 bg-gray-800 rounded-lg shadow-lg"></div>
            </motion.div>
          )}
          
          {/* Top lid */}
          <motion.div 
            className="absolute inset-x-0 top-0 w-full h-48 bg-amber-700 origin-bottom rounded-lg rounded-b-none z-10 transform-gpu"
            variants={boxVariants}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="absolute inset-0 w-full h-full bg-amber-600/40 rounded-lg rounded-b-none">
              {/* Box texture */}
              <div className="absolute inset-0 overflow-hidden opacity-30">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute h-0.5 w-full bg-black/10" 
                    style={{ top: `${i * 14}%` }}
                  />
                ))}
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-0.5 h-full bg-black/10" 
                    style={{ left: `${i * 14}%` }}
                  />
                ))}
              </div>
              
              {/* Inside of lid */}
              <div className="absolute inset-x-0 bottom-0 h-full w-full bg-amber-800/10 rounded-lg transform scale-y-[-1] origin-bottom">
                {/* Box inner texture */}
                <div className="absolute inset-0 overflow-hidden opacity-20">
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute h-0.5 w-full bg-black/10" 
                      style={{ top: `${i * 14}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Instruction text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovering ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute left-1/2 bottom-8 transform -translate-x-1/2 bg-black/70 rounded-full px-4 py-1 text-white text-sm whitespace-nowrap"
        >
          Click to open
        </motion.div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <h2 className="text-xl font-semibold text-gray-900">Phone Camera Analysis</h2>
        <p className="mt-2 text-sm text-gray-600">
          Open the box to begin streaming from your phone camera
        </p>
      </motion.div>
    </div>
  );
};

export default CardboardBox;
