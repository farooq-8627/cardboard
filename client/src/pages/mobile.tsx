import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useWebRTC } from '@/context/webrtc-context';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import ConnectionStatus from '@/components/ui/connection-status';

const Mobile: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  
  const { 
    startStream, 
    joinSession, 
    localVideoRef, 
    localStream, 
    connectionStatus, 
    stopStream,
    disconnectPeer
  } = useWebRTC();
  
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // Check if we're on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobileDevice(isMobile);
      
      if (!isMobile) {
        toast({
          title: "Not a Mobile Device",
          description: "This page is designed for mobile phones. Please scan the QR code with your phone instead.",
          variant: "destructive",
        });
      }
    };
    
    checkMobile();
  }, [toast]);
  
  // Extract session ID from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');
    
    if (session) {
      setSessionId(session);
    } else {
      toast({
        title: "Missing Session ID",
        description: "No session ID found in URL. Please scan the QR code from the desktop application.",
        variant: "destructive",
      });
    }
  }, [toast]);
  
  // Start the camera when permission is granted
  const handleStartCamera = async () => {
    try {
      const stream = await startStream('mobile');
      if (stream) {
        setIsPermissionGranted(true);
        
        // Join the session if we have one
        if (sessionId) {
          await joinSession(sessionId);
        }
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      toast({
        title: "Camera Error",
        description: "Failed to access your camera. Please check permissions and try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle disconnection and cleanup
  const handleDisconnect = () => {
    stopStream();
    disconnectPeer();
    navigate('/');
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span className="ml-2 text-xl font-bold">BiometricSync</span>
          </div>
          
          <ConnectionStatus status={connectionStatus} />
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Video container */}
        <div className="relative flex-1 bg-black">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Permission overlay */}
          {!isPermissionGranted && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center p-6 z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-24 h-24 rounded-full bg-gray-800 mx-auto mb-6 flex items-center justify-center">
                  <svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                
                <h1 className="text-2xl font-bold mb-4">Camera Access Required</h1>
                
                {!isMobileDevice && (
                  <div className="mb-6 p-3 bg-amber-800/30 rounded-lg text-amber-200 text-sm">
                    <p>⚠️ This page is designed for mobile devices.</p>
                    <p className="mt-1">Please scan the QR code with your phone instead.</p>
                  </div>
                )}
                
                <p className="text-gray-300 mb-6">
                  BiometricSync needs access to your camera to analyze facial features and biometric data.
                </p>
                
                <Button
                  onClick={handleStartCamera}
                  size="lg"
                  className="w-full"
                >
                  Grant Camera Access
                </Button>
                
                {sessionId && (
                  <p className="mt-4 text-sm text-gray-400">
                    Connecting to session: <span className="font-mono">{sessionId}</span>
                  </p>
                )}
              </motion.div>
            </div>
          )}
          
          {/* Connection status overlay */}
          {isPermissionGranted && (
            <div className="absolute top-4 left-0 right-0 flex justify-center">
              <div className="bg-black/50 backdrop-blur-sm rounded-full py-2 px-4">
                {connectionStatus === 'connected' ? (
                  <span className="text-green-400 text-sm flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                    Connected to desktop
                  </span>
                ) : connectionStatus === 'connecting' ? (
                  <span className="text-amber-400 text-sm flex items-center">
                    <span className="w-2 h-2 bg-amber-400 rounded-full mr-2 animate-pulse"></span>
                    Connecting to desktop...
                  </span>
                ) : (
                  <span className="text-red-400 text-sm flex items-center">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse"></span>
                    Not connected
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Info overlay */}
          {isPermissionGranted && localStream && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Frame Rate</div>
                  <div className="text-sm metrics-pulse">30 FPS</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Resolution</div>
                  <div className="text-sm metrics-pulse">
                    {localVideoRef.current?.videoWidth || '–'}×
                    {localVideoRef.current?.videoHeight || '–'}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Processing</div>
                  <div className="text-sm metrics-pulse text-green-400">Active</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 p-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-400">
            ⓘ Your privacy is protected. All processing is done locally.
          </p>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Mobile;
