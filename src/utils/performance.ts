export interface LoadingMetrics {
  downloadTimeMs: number;
  parsingTimeMs: number;
  decodingTimeMs: number;
  firstFrameTimeMs: number;
  totalTimeMs: number;
}

export function getHeapMemoryInfo(): { usedMB: number | null; limitMB: number | null; supported: boolean } {
  const perf = window.performance as any;
  if (perf && perf.memory) {
    const usedMB = Number((perf.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2));
    const limitMB = Number((perf.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2));
    return { usedMB, limitMB, supported: true };
  }
  return { usedMB: null, limitMB: null, supported: false };
}

export function getDeviceInfo(): { browser: string; platform: string; viewport: string; renderer: string } {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  const platform = navigator.platform || (navigator as any).userAgentData?.platform || 'Windows';
  const viewport = `${window.innerWidth}x${window.innerHeight}`;

  let renderer = 'WebGL 2.0';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (e) {
    // ignore
  }

  return { browser, platform, viewport, renderer };
}

export function computeStatistics(values: number[]): { min: number; max: number; avg: number; median: number } {
  if (values.length === 0) return { min: 0, max: 0, avg: 0, median: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const min = Number(sorted[0].toFixed(2));
  const max = Number(sorted[sorted.length - 1].toFixed(2));
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  const avg = Number((sum / values.length).toFixed(2));
  const mid = Math.floor(sorted.length / 2);
  const median = Number((sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
  return { min, max, avg, median };
}

export class FpsMeter {
  private frameCount = 0;
  private lastTime = performance.now();
  private currentFps = 60;
  private fpsHistory: number[] = [];
  private rafId: number | null = null;
  private onUpdate?: (fps: number, avgFps: number) => void;

  public start(callback: (fps: number, avgFps: number) => void) {
    this.onUpdate = callback;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsHistory = [];

    const loop = (now: number) => {
      this.frameCount++;
      const elapsed = now - this.lastTime;
      if (elapsed >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
        this.fpsHistory.push(this.currentFps);
        if (this.fpsHistory.length > 30) this.fpsHistory.shift();

        const avgFps = Math.round(
          this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
        );

        if (this.onUpdate) {
          this.onUpdate(this.currentFps, avgFps);
        }

        this.frameCount = 0;
        this.lastTime = now;
      }
      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public getFps() {
    return this.currentFps;
  }
}

