// Eye tracking using MediaPipe Face Mesh

// Types for eye landmarks
export interface EyePoint {
  x: number;
  y: number;
}

// Types for eye tracking results
export interface EyeTrackingResult {
  leftEye: EyePoint[];
  rightEye: EyePoint[];
  leftPupil: EyePoint | null;
  rightPupil: EyePoint | null;
  gazeDirection: {
    x: number; // -1 to 1 (left to right)
    y: number; // -1 to 1 (up to down)
  };
  isBlinking: boolean;
  attentionScore: number; // 0-100
  fixationDuration: number; // seconds
}

// Eye tracking statistics
export interface EyeTrackingStats {
  blinkRate: number; // blinks per minute
  fixationTime: number; // average fixation time in seconds
  saccadesPerMin: number; // rapid eye movements per minute
  focusPoints: number; // number of distinct focus areas
}

// MediaPipe Face Mesh indices for eye landmarks
const LEFT_EYE_INDICES = [
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246
];

const RIGHT_EYE_INDICES = [
  362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398
];

// Eye center point indices
const LEFT_PUPIL_INDEX = 468;
const RIGHT_PUPIL_INDEX = 473;

export class EyeTracker {
  private faceMesh: any | null = null; // MediaPipe Face Mesh instance
  private isInitialized = false;
  private lastBlinkTime = 0;
  private blinkCount = 0;
  private fixationStartTime = 0;
  private lastFixationPoint: EyePoint | null = null;
  private fixationHistory: number[] = [];
  private saccadeHistory: number[] = [];
  private eyeMovementHistory: { x: number, y: number, timestamp: number }[] = [];
  
  constructor() {
    this.initialize();
  }
  
  // Initialize MediaPipe Face Mesh
  private async initialize() {
    if (typeof window === 'undefined') return;
    
    try {
      // Import MediaPipe FaceMesh from CDN
      const faceMesh = await import('@mediapipe/face_mesh');
      const drawingUtils = await import('@mediapipe/drawing_utils');
      
      // Create Face Mesh
      this.faceMesh = new faceMesh.FaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });
      
      // Set options
      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      this.isInitialized = true;
      console.log('Eye tracker initialized with MediaPipe Face Mesh');
    } catch (error) {
      console.error('Failed to initialize eye tracker:', error);
    }
  }
  
  // Process video frame to track eyes
  public async processFrame(
    videoElement: HTMLVideoElement,
    canvas: HTMLCanvasElement
  ): Promise<EyeTrackingResult | null> {
    if (!this.isInitialized || !this.faceMesh) {
      return null;
    }
    
    try {
      // Process video frame with Face Mesh
      const results = await this.faceMesh.process(videoElement);
      
      // No face detected
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        return null;
      }
      
      // Get face landmarks
      const landmarks = results.multiFaceLandmarks[0];
      
      // Extract eye landmarks
      const leftEye = LEFT_EYE_INDICES.map(index => ({
        x: landmarks[index].x * canvas.width,
        y: landmarks[index].y * canvas.height
      }));
      
      const rightEye = RIGHT_EYE_INDICES.map(index => ({
        x: landmarks[index].x * canvas.width,
        y: landmarks[index].y * canvas.height
      }));
      
      // Extract pupil landmarks
      const leftPupil = {
        x: landmarks[LEFT_PUPIL_INDEX].x * canvas.width,
        y: landmarks[LEFT_PUPIL_INDEX].y * canvas.height
      };
      
      const rightPupil = {
        x: landmarks[RIGHT_PUPIL_INDEX].x * canvas.width,
        y: landmarks[RIGHT_PUPIL_INDEX].y * canvas.height
      };
      
      // Check if blinking
      const isBlinking = this.detectBlink(leftEye, rightEye);
      
      // Calculate gaze direction
      const gazeDirection = this.calculateGazeDirection(leftEye, rightEye, leftPupil, rightPupil);
      
      // Calculate fixation duration
      const fixationDuration = this.calculateFixationDuration(gazeDirection);
      
      // Calculate attention score
      const attentionScore = this.calculateAttentionScore(isBlinking, fixationDuration, gazeDirection);
      
      // Update eye movement history
      this.updateEyeMovementHistory(gazeDirection);
      
      return {
        leftEye,
        rightEye,
        leftPupil,
        rightPupil,
        gazeDirection,
        isBlinking,
        attentionScore,
        fixationDuration
      };
    } catch (error) {
      console.error('Error processing frame for eye tracking:', error);
      return null;
    }
  }
  
  // Draw eye landmarks on canvas
  public drawEyeLandmarks(
    canvas: HTMLCanvasElement,
    result: EyeTrackingResult
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw eye outlines
    ctx.strokeStyle = 'rgba(138, 43, 226, 0.7)'; // Purple
    ctx.lineWidth = 1;
    
    // Draw left eye
    ctx.beginPath();
    result.leftEye.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.closePath();
    ctx.stroke();
    
    // Draw right eye
    ctx.beginPath();
    result.rightEye.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.closePath();
    ctx.stroke();
    
    // Draw pupils
    if (result.leftPupil) {
      ctx.fillStyle = 'rgba(138, 43, 226, 0.9)';
      ctx.beginPath();
      ctx.arc(result.leftPupil.x, result.leftPupil.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    if (result.rightPupil) {
      ctx.fillStyle = 'rgba(138, 43, 226, 0.9)';
      ctx.beginPath();
      ctx.arc(result.rightPupil.x, result.rightPupil.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Draw gaze direction
    if (result.leftPupil && result.rightPupil) {
      const centerX = (result.leftPupil.x + result.rightPupil.x) / 2;
      const centerY = (result.leftPupil.y + result.rightPupil.y) / 2;
      
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'; // Blue
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + result.gazeDirection.x * 50,
        centerY + result.gazeDirection.y * 50
      );
      ctx.stroke();
    }
  }
  
  // Detect blinking
  private detectBlink(leftEye: EyePoint[], rightEye: EyePoint[]): boolean {
    // Calculate eye aspect ratio (EAR)
    const leftEAR = this.calculateEyeAspectRatio(leftEye);
    const rightEAR = this.calculateEyeAspectRatio(rightEye);
    
    // Average EAR
    const ear = (leftEAR + rightEAR) / 2;
    
    // EAR threshold for blink detection
    const BLINK_THRESHOLD = 0.2;
    const isBlinking = ear < BLINK_THRESHOLD;
    
    // Record blink for stats
    const now = Date.now();
    if (isBlinking && now - this.lastBlinkTime > 500) { // Prevent double-counting blinks
      this.blinkCount++;
      this.lastBlinkTime = now;
    }
    
    return isBlinking;
  }
  
  // Calculate Eye Aspect Ratio (EAR)
  private calculateEyeAspectRatio(eyePoints: EyePoint[]): number {
    // Simplified EAR calculation
    if (eyePoints.length < 6) return 1.0; // Default to open eye
    
    // Vertical distances
    const v1 = this.distance(eyePoints[1], eyePoints[7]);
    const v2 = this.distance(eyePoints[3], eyePoints[5]);
    
    // Horizontal distance
    const h = this.distance(eyePoints[0], eyePoints[4]);
    
    // EAR formula
    return (v1 + v2) / (2 * h);
  }
  
  // Calculate gaze direction
  private calculateGazeDirection(
    leftEye: EyePoint[],
    rightEye: EyePoint[],
    leftPupil: EyePoint,
    rightPupil: EyePoint
  ): { x: number, y: number } {
    // Calculate eye centers
    const leftCenter = this.calculateEyeCenter(leftEye);
    const rightCenter = this.calculateEyeCenter(rightEye);
    
    // Calculate eye sizes
    const leftWidth = this.distance(leftEye[0], leftEye[4]);
    const rightWidth = this.distance(rightEye[0], rightEye[4]);
    
    // Normalize pupil positions relative to eye centers
    const leftPupilOffset = {
      x: (leftPupil.x - leftCenter.x) / (leftWidth / 2),
      y: (leftPupil.y - leftCenter.y) / (leftWidth / 4)
    };
    
    const rightPupilOffset = {
      x: (rightPupil.x - rightCenter.x) / (rightWidth / 2),
      y: (rightPupil.y - rightCenter.y) / (rightWidth / 4)
    };
    
    // Average pupil offsets for gaze direction
    // Clamp values between -1 and 1
    return {
      x: Math.max(-1, Math.min(1, (leftPupilOffset.x + rightPupilOffset.x) / 2)),
      y: Math.max(-1, Math.min(1, (leftPupilOffset.y + rightPupilOffset.y) / 2))
    };
  }
  
  // Calculate eye center point
  private calculateEyeCenter(eyePoints: EyePoint[]): EyePoint {
    if (eyePoints.length === 0) {
      return { x: 0, y: 0 };
    }
    
    // Sum all coordinates
    const sum = eyePoints.reduce(
      (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
      { x: 0, y: 0 }
    );
    
    // Calculate average
    return {
      x: sum.x / eyePoints.length,
      y: sum.y / eyePoints.length
    };
  }
  
  // Calculate distance between two points
  private distance(a: EyePoint, b: EyePoint): number {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }
  
  // Calculate fixation duration
  private calculateFixationDuration(gazeDirection: { x: number, y: number }): number {
    const now = Date.now();
    const FIXATION_THRESHOLD = 0.2; // Maximum movement to be considered fixating
    
    // Check if gaze has moved significantly
    if (!this.lastFixationPoint || 
        Math.abs(gazeDirection.x - this.lastFixationPoint.x) > FIXATION_THRESHOLD ||
        Math.abs(gazeDirection.y - this.lastFixationPoint.y) > FIXATION_THRESHOLD) {
      
      // Record fixation duration
      if (this.fixationStartTime > 0) {
        const duration = (now - this.fixationStartTime) / 1000;
        if (duration > 0.1) { // Minimum fixation time
          this.fixationHistory.push(duration);
          // Keep only last 30 fixations
          if (this.fixationHistory.length > 30) {
            this.fixationHistory.shift();
          }
        }
      }
      
      // Start new fixation
      this.fixationStartTime = now;
      this.lastFixationPoint = { ...gazeDirection };
      return 0;
    }
    
    // Continue current fixation
    return (now - this.fixationStartTime) / 1000;
  }
  
  // Update eye movement history for saccade detection
  private updateEyeMovementHistory(gazeDirection: { x: number, y: number }) {
    const now = Date.now();
    
    this.eyeMovementHistory.push({
      x: gazeDirection.x,
      y: gazeDirection.y,
      timestamp: now
    });
    
    // Keep only last 10 seconds of movements
    while (this.eyeMovementHistory.length > 0 && 
           now - this.eyeMovementHistory[0].timestamp > 10000) {
      this.eyeMovementHistory.shift();
    }
    
    // Detect saccades
    this.detectSaccades();
  }
  
  // Detect saccades (rapid eye movements)
  private detectSaccades() {
    if (this.eyeMovementHistory.length < 3) return;
    
    const SACCADE_THRESHOLD = 0.3; // Velocity threshold for saccade
    
    for (let i = 2; i < this.eyeMovementHistory.length; i++) {
      const current = this.eyeMovementHistory[i];
      const prev = this.eyeMovementHistory[i-1];
      
      // Time between samples in seconds
      const dt = (current.timestamp - prev.timestamp) / 1000;
      if (dt === 0) continue;
      
      // Calculate velocity
      const dx = Math.abs(current.x - prev.x);
      const dy = Math.abs(current.y - prev.y);
      const velocity = Math.sqrt(dx*dx + dy*dy) / dt;
      
      // If velocity exceeds threshold, count as saccade
      if (velocity > SACCADE_THRESHOLD) {
        const now = Date.now();
        this.saccadeHistory.push(now);
        
        // Keep only saccades in the last minute
        while (this.saccadeHistory.length > 0 && 
               now - this.saccadeHistory[0] > 60000) {
          this.saccadeHistory.shift();
        }
      }
    }
  }
  
  // Calculate attention score based on eye metrics
  private calculateAttentionScore(
    isBlinking: boolean,
    fixationDuration: number,
    gazeDirection: { x: number, y: number }
  ): number {
    // Factors that indicate attention:
    // 1. Moderate fixation duration (too short: distracted, too long: zoned out)
    // 2. Gaze near center (extreme gaze directions indicate looking away)
    // 3. Normal blink rate (too high: fatigue, too low: strain)
    
    // Fixation score (0-40)
    const optimalFixation = 2.0; // ~2 seconds is optimal
    let fixationScore = 0;
    if (fixationDuration > 0.3 && fixationDuration < 4.0) {
      fixationScore = 40 * (1 - Math.min(1, Math.abs(fixationDuration - optimalFixation) / optimalFixation));
    }
    
    // Gaze direction score (0-30)
    // Penalize looking far from center
    const gazeMagnitude = Math.sqrt(gazeDirection.x * gazeDirection.x + gazeDirection.y * gazeDirection.y);
    const gazeScore = 30 * (1 - Math.min(1, gazeMagnitude));
    
    // Blink rate score (0-30)
    const blinkRate = this.calculateBlinkRate();
    const optimalBlinkRate = 15; // blinks per minute
    const blinkScore = 30 * (1 - Math.min(1, Math.abs(blinkRate - optimalBlinkRate) / optimalBlinkRate));
    
    // Calculate total score (0-100)
    const totalScore = fixationScore + gazeScore + blinkScore;
    return Math.round(Math.max(0, Math.min(100, totalScore)));
  }
  
  // Get eye tracking statistics
  public getStats(): EyeTrackingStats {
    const now = Date.now();
    
    // Calculate average fixation time
    let fixationTime = 0;
    if (this.fixationHistory.length > 0) {
      fixationTime = this.fixationHistory.reduce((sum, duration) => sum + duration, 0) / this.fixationHistory.length;
    }
    
    // Count distinct focus areas
    // This is a simplified approach using recent fixation history
    const recentFixations = this.fixationHistory.slice(-10);
    const focusPoints = Math.min(10, Math.max(1, recentFixations.length));
    
    return {
      blinkRate: this.calculateBlinkRate(),
      fixationTime: parseFloat(fixationTime.toFixed(1)),
      saccadesPerMin: this.saccadeHistory.length,
      focusPoints
    };
  }
  
  // Calculate blink rate (blinks per minute)
  private calculateBlinkRate(): number {
    const now = Date.now();
    
    // Count blinks in the last minute
    let recentBlinks = 0;
    const oneMinuteAgo = now - 60000;
    
    for (let i = this.saccadeHistory.length - 1; i >= 0; i--) {
      if (this.saccadeHistory[i] >= oneMinuteAgo) {
        recentBlinks++;
      } else {
        break;
      }
    }
    
    return recentBlinks;
  }
  
  // Reset all tracking
  public reset(): void {
    this.lastBlinkTime = 0;
    this.blinkCount = 0;
    this.fixationStartTime = 0;
    this.lastFixationPoint = null;
    this.fixationHistory = [];
    this.saccadeHistory = [];
    this.eyeMovementHistory = [];
  }
}

// Create singleton instance
const eyeTracker = new EyeTracker();
export default eyeTracker;
