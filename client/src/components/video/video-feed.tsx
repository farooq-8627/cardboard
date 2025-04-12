import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoControls from './video-controls';
import CanvasOverlay from './canvas-overlay';
import { useWebRTC } from '@/context/webrtc-context';
import { useToast } from '@/hooks/use-toast';
import { MdFullscreen, MdSettings } from 'react-icons/md';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface VideoFeedProps {
  className?: string;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ className }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  
  const { remoteStream, remoteVideoRef, connectionStatus } = useWebRTC();
  const { toast } = useToast();
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => {
          toast({
            title: 'Fullscreen Error',
            description: `Error attempting to enable fullscreen: ${err.message}`,
            variant: 'destructive'
          });
        });
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => {
          toast({
            title: 'Fullscreen Error',
            description: `Error attempting to exit fullscreen: ${err.message}`,
            variant: 'destructive'
          });
        });
    }
  };
  
  // Handle recording toggle
  const toggleRecording = () => {
    if (isRecording) {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }
      
      toast({
        title: 'Recording Stopped',
        description: `Recording saved (${formatTime(recordingTime)})`,
      });
      
      setIsRecording(false);
    } else {
      setRecordingTime(0);
      
      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: 'Recording Started',
        description: 'Video recording has started',
      });
      
      setIsRecording(true);
    }
  };
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Clean up recording interval on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);
  
  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  return (
    <Card className={className}>
      <CardHeader className="p-4 border-b border-gray-200 flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium text-gray-900">Live Video Feed</CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleFullscreen}
            className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <MdFullscreen className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <MdSettings className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div 
          ref={containerRef}
          className="relative"
        >
          {/* Video Container */}
          <div className="aspect-w-16 aspect-h-9 bg-gray-900 relative">
            {connectionStatus === 'connected' && remoteStream ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full relative"
              >
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isPrivacyMode ? 'blur-md' : ''}`}
                />
                
                {/* Canvas overlay for tracking visualization */}
                <CanvasOverlay 
                  videoRef={remoteVideoRef} 
                  isPrivacyMode={isPrivacyMode}
                />
              </motion.div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center text-white"
                  >
                    {connectionStatus === 'connecting' ? (
                      <>
                        <div className="animate-spin mb-4 mx-auto w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
                        <p>Connecting to camera stream...</p>
                      </>
                    ) : (
                      <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-2">No camera connected</p>
                        <p className="text-sm opacity-75 mt-1">Connect a mobile device to start streaming</p>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
            
            {/* Connection Indicators */}
            <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black bg-opacity-50 rounded-full px-3 py-1.5">
              <div className="flex items-center">
                <div className={`connection-dot ${connectionStatus === 'connected' ? 'connected' : 'disconnected'}`}></div>
                <span className="ml-1.5 text-xs font-medium text-white">WebRTC</span>
              </div>
              <div className="flex items-center">
                <div className={`connection-dot ${connectionStatus === 'connected' ? 'connected' : 'disconnected'}`}></div>
                <span className="ml-1.5 text-xs font-medium text-white">Tracking</span>
              </div>
            </div>
          </div>
          
          {/* Video Controls */}
          <VideoControls 
            isRecording={isRecording}
            recordingTime={formatTime(recordingTime)}
            isPrivacyMode={isPrivacyMode}
            onToggleRecording={toggleRecording}
            onTogglePrivacyMode={() => setIsPrivacyMode(!isPrivacyMode)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoFeed;
