import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWebRTC } from '@/context/webrtc-context';
import { useToast } from '@/hooks/use-toast';
import VideoFeed from '@/components/video/video-feed';
import MetricsPanel from '@/components/metrics/metrics-panel';
import PhoneMockup from '@/components/phone-mockup';
import QRCode from '@/components/ui/qr-code';
import ConnectionStatus from '@/components/ui/connection-status';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { MdAdd } from 'react-icons/md';

const Home: React.FC = () => {
  const [isBoxOpen, setIsBoxOpen] = useState(false);
  const [sessionUrl, setSessionUrl] = useState<string>('');
  const { toast } = useToast();
  const { createSession, sessionId, connectionStatus } = useWebRTC();
  
  // Create a session on component mount if one doesn't exist
  useEffect(() => {
    if (!sessionId) {
      handleCreateSession();
    }
  }, [sessionId]);
  
  // Handle session creation
  const handleCreateSession = async () => {
    try {
      const id = await createSession();
      
      // Create a URL that the mobile device can use to join
      const protocol = window.location.protocol;
      const host = window.location.host;
      const url = `${protocol}//${host}/mobile?session=${id}`;
      
      setSessionUrl(url);
      
      toast({
        title: "Session Created",
        description: "Scan the QR code with your mobile device to connect",
      });
    } catch (error) {
      console.error('Failed to create session:', error);
      toast({
        title: "Session Creation Failed",
        description: "Could not create a new session. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Title Section */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Remote Biometric Analysis
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time metrics and engagement tracking for remote sessions
          </p>
        </div>
        
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <ConnectionStatus 
            status={connectionStatus} 
            className="mr-4"
          />
          
          <Button 
            onClick={handleCreateSession}
            className="inline-flex items-center"
          >
            <MdAdd className="-ml-1 mr-2 h-5 w-5" />
            New Session
          </Button>
        </div>
      </div>
      
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Video Feed */}
        <div className="lg:col-span-2">
          <VideoFeed className="mb-6" />
          
          {/* Workflow Tabs Section */}
          <Card>
            <CardHeader className="p-4 border-b border-gray-200">
              <CardTitle className="text-lg font-medium text-gray-900">Analysis Tools</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="realtime" className="w-full">
                <div className="px-4 pt-2">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="realtime">Real-time Analysis</TabsTrigger>
                    <TabsTrigger value="recording">Recording Options</TabsTrigger>
                    <TabsTrigger value="export">Export Data</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="realtime" className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-700">Detection Settings</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Face Detection</span>
                        <div className="relative inline-flex items-center h-6 rounded-full w-11 bg-primary">
                          <span className="inline-block w-4 h-4 transform translate-x-6 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Eye Tracking</span>
                        <div className="relative inline-flex items-center h-6 rounded-full w-11 bg-primary">
                          <span className="inline-block w-4 h-4 transform translate-x-6 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Heart Rate</span>
                        <div className="relative inline-flex items-center h-6 rounded-full w-11 bg-primary">
                          <span className="inline-block w-4 h-4 transform translate-x-6 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Emotion Detection</span>
                        <div className="relative inline-flex items-center h-6 rounded-full w-11 bg-primary">
                          <span className="inline-block w-4 h-4 transform translate-x-6 bg-white rounded-full" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-700">Alert Thresholds</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between">
                            <label className="text-sm text-gray-600">Attention Below</label>
                            <span className="text-xs text-gray-500">50%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div className="w-1/2 h-2 bg-primary rounded-full"></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between">
                            <label className="text-sm text-gray-600">Heart Rate Above</label>
                            <span className="text-xs text-gray-500">90 BPM</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div className="w-3/4 h-2 bg-destructive rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-700">Data Privacy</h3>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <input id="data-consent" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" defaultChecked />
                            <label htmlFor="data-consent" className="ml-2 block text-sm text-gray-700">User consent required</label>
                          </div>
                          
                          <div className="flex items-center">
                            <input id="anonymize" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" defaultChecked />
                            <label htmlFor="anonymize" className="ml-2 block text-sm text-gray-700">Anonymize personal data</label>
                          </div>
                          
                          <div className="flex items-center">
                            <input id="local-processing" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" defaultChecked />
                            <label htmlFor="local-processing" className="ml-2 block text-sm text-gray-700">Process locally (no cloud)</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="recording" className="p-6">
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Recording Options</h3>
                    <p className="text-sm text-gray-500 mb-6">Configure recording preferences and schedule sessions</p>
                    
                    <div className="flex justify-center">
                      <Button variant="outline" className="mr-3">
                        Schedule Recording
                      </Button>
                      <Button variant="default">
                        Start Recording
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="export" className="p-6">
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Export Analysis Data</h3>
                    <p className="text-sm text-gray-500 mb-6">Download metrics and analysis from recorded sessions</p>
                    
                    <div className="flex justify-center">
                      <Button variant="outline" className="mr-3">
                        Export as CSV
                      </Button>
                      <Button variant="default">
                        Export as JSON
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Metrics and Device Connection */}
        <div className="lg:col-span-1 space-y-6">
          {/* Metrics Panel */}
          <MetricsPanel />
          
          {/* Phone Connection Card */}
          <Card>
            <CardHeader className="p-4 border-b border-gray-200">
              <CardTitle className="text-lg font-medium text-gray-900">Connect Phone Camera</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col items-center">
              {isBoxOpen ? (
                <PhoneMockup 
                  isOpen={isBoxOpen} 
                  onToggleOpen={() => setIsBoxOpen(false)} 
                />
              ) : (
                <div className="w-full py-4">
                  {sessionUrl ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center"
                    >
                      <p className="text-sm text-gray-600 mb-4">Scan this QR code with your phone camera</p>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <QRCode 
                          value={sessionUrl} 
                          size={180} 
                          level="L"
                        />
                      </div>
                      <p className="mt-4 text-xs text-gray-500 max-w-xs text-center">
                        Or open this URL on your mobile device:
                      </p>
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-800 font-mono w-full overflow-x-auto text-center">
                        {sessionUrl}
                      </div>
                      
                      <div className="mt-6">
                        <Button 
                          onClick={() => setIsBoxOpen(true)}
                          variant="outline"
                        >
                          Use Box Animation
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="animate-spin mb-4 mx-auto w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
                      <p>Generating session URL...</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Connected Apps Section */}
          <Card>
            <CardHeader className="p-4 border-b border-gray-200">
              <CardTitle className="text-lg font-medium text-gray-900">Analysis Features</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="divide-y divide-gray-200">
                <li className="py-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Eye Tracking</p>
                      <p className="text-xs text-gray-500">MediaPipe Face Mesh</p>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center h-6 rounded-full w-11 bg-primary">
                    <span className="inline-block w-4 h-4 transform translate-x-6 bg-white rounded-full" />
                  </div>
                </li>
                
                <li className="py-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Heart Rate</p>
                      <p className="text-xs text-gray-500">Remote PPG Analysis</p>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center h-6 rounded-full w-11 bg-primary">
                    <span className="inline-block w-4 h-4 transform translate-x-6 bg-white rounded-full" />
                  </div>
                </li>
                
                <li className="py-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Emotion Analysis</p>
                      <p className="text-xs text-gray-500">face-api.js</p>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center h-6 rounded-full w-11 bg-primary">
                    <span className="inline-block w-4 h-4 transform translate-x-6 bg-white rounded-full" />
                  </div>
                </li>
              </ul>
              
              <Button
                variant="outline"
                className="mt-4 w-full"
              >
                Configure Features
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
