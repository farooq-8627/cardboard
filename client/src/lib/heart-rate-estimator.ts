// Point to track for heart rate estimation
interface TrackingPoint {
  x: number;
  y: number;
}

// Color signal data point
interface ColorSignal {
  r: number;
  g: number;
  b: number;
  timestamp: number;
}

// Heart rate estimation result
export interface HeartRateResult {
  bpm: number;
  confidence: number;
}

export class HeartRateEstimator {
  private readonly SAMPLE_RATE = 30; // Target FPS
  private readonly BUFFER_SIZE = 300; // 10 seconds at 30 FPS
  private readonly WINDOW_SIZE = 20; // Pixel window size
  private readonly MIN_CONFIDENCE = 0.5; // Minimum confidence to report BPM
  
  private colorSignalBuffer: ColorSignal[] = [];
  private lastProcessTime = 0;
  private lastBPM = 0;
  private lastConfidence = 0;
  
  constructor() {
    console.log('Heart rate estimator initialized');
  }
  
  // Process a video frame to extract color signals
  public processFrame(
    videoElement: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    facePoints?: TrackingPoint[]
  ): HeartRateResult {
    const now = Date.now();
    
    // Rate limit to maintain consistent sample rate
    if (now - this.lastProcessTime < 1000 / this.SAMPLE_RATE) {
      return { bpm: this.lastBPM, confidence: this.lastConfidence };
    }
    
    this.lastProcessTime = now;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return { bpm: 0, confidence: 0 };
    }
    
    // Draw the current video frame to canvas
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Regions to sample for color data
    const regions: TrackingPoint[] = facePoints || [
      // Default regions (forehead and cheeks) if face points not provided
      { x: Math.floor(canvas.width * 0.5), y: Math.floor(canvas.height * 0.3) },
      { x: Math.floor(canvas.width * 0.3), y: Math.floor(canvas.height * 0.4) },
      { x: Math.floor(canvas.width * 0.7), y: Math.floor(canvas.height * 0.4) }
    ];
    
    // Get average RGB in regions
    const avgColors = this.sampleRegions(ctx, regions);
    
    // Add to signal buffer
    this.colorSignalBuffer.push({
      r: avgColors.r,
      g: avgColors.g,
      b: avgColors.b,
      timestamp: now
    });
    
    // Keep buffer size limited
    if (this.colorSignalBuffer.length > this.BUFFER_SIZE) {
      this.colorSignalBuffer.shift();
    }
    
    // Need at least 3 seconds of data (90 frames at 30 FPS)
    if (this.colorSignalBuffer.length < 90) {
      return { bpm: 0, confidence: 0 };
    }
    
    // Estimate heart rate from green channel (most sensitive to blood flow)
    const result = this.estimateHeartRate();
    this.lastBPM = result.bpm;
    this.lastConfidence = result.confidence;
    
    return result;
  }
  
  // Sample color in regions and return average RGB
  private sampleRegions(
    ctx: CanvasRenderingContext2D,
    points: TrackingPoint[]
  ): { r: number, g: number, b: number } {
    let totalR = 0, totalG = 0, totalB = 0;
    let pixelCount = 0;
    
    // Sample each region
    for (const point of points) {
      const halfWindow = Math.floor(this.WINDOW_SIZE / 2);
      const x = Math.max(0, point.x - halfWindow);
      const y = Math.max(0, point.y - halfWindow);
      const width = Math.min(ctx.canvas.width - x, this.WINDOW_SIZE);
      const height = Math.min(ctx.canvas.height - y, this.WINDOW_SIZE);
      
      // Get pixel data
      const imageData = ctx.getImageData(x, y, width, height);
      const data = imageData.data;
      
      // Sum RGB values
      for (let i = 0; i < data.length; i += 4) {
        totalR += data[i];
        totalG += data[i + 1];
        totalB += data[i + 2];
        pixelCount++;
      }
    }
    
    // Calculate averages
    const avgR = totalR / pixelCount;
    const avgG = totalG / pixelCount;
    const avgB = totalB / pixelCount;
    
    return { r: avgR, g: avgG, b: avgB };
  }
  
  // Estimate heart rate from color signal buffer
  private estimateHeartRate(): HeartRateResult {
    if (this.colorSignalBuffer.length < 90) {
      return { bpm: 0, confidence: 0 };
    }
    
    // Extract green channel (most responsive to pulse)
    const greenSignal = this.colorSignalBuffer.map(signal => signal.g);
    
    // Normalize signal to range 0-1
    const minG = Math.min(...greenSignal);
    const maxG = Math.max(...greenSignal);
    const normalizedSignal = greenSignal.map(g => (g - minG) / (maxG - minG));
    
    // Detrend signal (remove slow trends)
    const detrendedSignal = this.detrendSignal(normalizedSignal);
    
    // Apply bandpass filter to isolate frequencies in heart rate range (0.7-4Hz, ~40-240 BPM)
    const filteredSignal = this.bandpassFilter(detrendedSignal);
    
    // Compute frequency spectrum using FFT
    const spectrum = this.computeFFT(filteredSignal);
    
    // Find peak frequency in the valid heart rate range (40-180 BPM)
    const { frequency, magnitude } = this.findPeakFrequency(spectrum);
    
    // Convert frequency to BPM
    const bpm = Math.round(frequency * 60);
    
    // Calculate confidence based on peak magnitude
    const confidence = Math.min(1, magnitude * 2);
    
    // Only return result if confidence is above threshold
    if (confidence < this.MIN_CONFIDENCE) {
      return { bpm: 0, confidence: 0 };
    }
    
    return { 
      bpm: Math.max(40, Math.min(180, bpm)), // Clamp to realistic range
      confidence
    };
  }
  
  // Detrend signal to remove slow variations
  private detrendSignal(signal: number[]): number[] {
    const result = [...signal];
    
    // Simple moving average detrending
    const windowSize = 30; // 1 second at 30 FPS
    
    for (let i = windowSize; i < signal.length; i++) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        sum += signal[i - j];
      }
      const average = sum / windowSize;
      result[i] = signal[i] - average;
    }
    
    return result;
  }
  
  // Apply bandpass filter to isolate heart rate frequencies
  private bandpassFilter(signal: number[]): number[] {
    // Simple IIR bandpass filter
    const filtered: number[] = new Array(signal.length).fill(0);
    
    // These coefficients roughly correspond to a 0.7-4Hz bandpass
    const a = [1, -1.7, 0.74];
    const b = [0.15, 0, -0.15];
    
    for (let i = 2; i < signal.length; i++) {
      filtered[i] = 
        b[0] * signal[i] + 
        b[1] * signal[i-1] + 
        b[2] * signal[i-2] - 
        a[1] * filtered[i-1] - 
        a[2] * filtered[i-2];
    }
    
    return filtered;
  }
  
  // Compute FFT spectrum (simplified implementation)
  private computeFFT(signal: number[]): { frequencies: number[], magnitudes: number[] } {
    // In a real implementation, we'd use a proper FFT library
    // This is a simplified version for demonstration
    
    const N = signal.length;
    const samplingRate = this.SAMPLE_RATE;
    const frequencies: number[] = [];
    const magnitudes: number[] = [];
    
    // Only compute for frequencies in the heart rate range (0.7-4Hz)
    const minFreq = 0.7; // 42 BPM
    const maxFreq = 3.0; // 180 BPM
    
    // Step through frequencies in the heart rate range
    const freqStep = samplingRate / N;
    for (let f = minFreq; f <= maxFreq; f += freqStep) {
      frequencies.push(f);
      
      // Compute DFT for this frequency
      let re = 0;
      let im = 0;
      
      for (let t = 0; t < N; t++) {
        const phase = 2 * Math.PI * f * t / samplingRate;
        re += signal[t] * Math.cos(phase);
        im -= signal[t] * Math.sin(phase);
      }
      
      // Magnitude of the frequency component
      const magnitude = Math.sqrt(re * re + im * im) / N;
      magnitudes.push(magnitude);
    }
    
    return { frequencies, magnitudes };
  }
  
  // Find the peak frequency in the spectrum
  private findPeakFrequency(spectrum: { frequencies: number[], magnitudes: number[] }): { frequency: number, magnitude: number } {
    const { frequencies, magnitudes } = spectrum;
    
    // Find index of maximum magnitude
    let maxIndex = 0;
    let maxMagnitude = 0;
    
    for (let i = 0; i < magnitudes.length; i++) {
      if (magnitudes[i] > maxMagnitude) {
        maxMagnitude = magnitudes[i];
        maxIndex = i;
      }
    }
    
    return {
      frequency: frequencies[maxIndex],
      magnitude: maxMagnitude
    };
  }
  
  // Clear buffer and reset
  public reset(): void {
    this.colorSignalBuffer = [];
    this.lastBPM = 0;
    this.lastConfidence = 0;
  }
}

// Create singleton instance
const heartRateEstimator = new HeartRateEstimator();
export default heartRateEstimator;
