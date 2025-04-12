import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type ConnectionStatusProps = {
  status: 'connected' | 'connecting' | 'disconnected';
  className?: string;
};

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  status,
  className
}) => {
  let statusText = 'Disconnected';
  let statusColor = 'bg-destructive';
  
  if (status === 'connected') {
    statusText = 'Connected';
    statusColor = 'bg-secondary';
  } else if (status === 'connecting') {
    statusText = 'Connecting...';
    statusColor = 'bg-amber-500';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center py-1 px-3 bg-white/20 rounded-full shadow-sm',
        className
      )}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={cn(
          'connection-dot',
          status === 'connected' ? 'connected' : 
          status === 'connecting' ? 'bg-amber-500' : 'disconnected'
        )}
      />
      <span className={cn(
        'text-sm font-medium',
        status === 'connected' ? 'text-secondary' : 
        status === 'connecting' ? 'text-amber-500' : 'text-destructive'
      )}>
        {statusText}
      </span>
    </motion.div>
  );
};

export default ConnectionStatus;
