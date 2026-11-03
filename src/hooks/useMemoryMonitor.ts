import { useState, useEffect, useRef, useCallback } from 'react';
import { MemorySample } from '../types';
import { getHeapMemoryInfo, FpsMeter } from '../utils/performance';
import { globalMemoryManager } from '../utils/memoryManager';

export interface MemoryStats {
  heapUsedMB: number | null;
  heapLimitMB: number | null;
  heapSupported: boolean;
  gpuMemoryMB: number;
  geometryCount: number;
  materialCount: number;
  textureCount: number;
  loadedModelCount: number;
  currentFps: number;
  avgFps: number;
}

export function useMemoryMonitor() {
  const [stats, setStats] = useState<MemoryStats>({
    heapUsedMB: null,
    heapLimitMB: null,
    heapSupported: false,
    gpuMemoryMB: 0,
    geometryCount: 0,
    materialCount: 0,
    textureCount: 0,
    loadedModelCount: 0,
    currentFps: 60,
    avgFps: 60,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [samples, setSamples] = useState<MemorySample[]>([]);
  const [recordingSummary, setRecordingSummary] = useState<{
    beforeMB: number | null;
    peakMB: number | null;
    afterMB: number | null;
    startTime: number;
    durationSeconds: number;
  } | null>(null);

  const fpsMeterRef = useRef<FpsMeter | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  isRecordingRef.current = isRecording;

  const updateStats = useCallback(() => {
    const heap = getHeapMemoryInfo();
    const counts = globalMemoryManager.getCounts();
    const gpuBytes = globalMemoryManager.estimateGpuMemoryBytes();
    const gpuMB = Number((gpuBytes / (1024 * 1024)).toFixed(2));

    setStats((prev) => ({
      ...prev,
      heapUsedMB: heap.usedMB,
      heapLimitMB: heap.limitMB,
      heapSupported: heap.supported,
      gpuMemoryMB: gpuMB,
      geometryCount: counts.geometries,
      materialCount: counts.materials,
      textureCount: counts.textures,
      loadedModelCount: counts.models,
    }));

    if (isRecordingRef.current) {
      const now = Date.now();
      const timeLabel = new Date(now).toLocaleTimeString().split(' ')[0];
      setSamples((prev) => [
        ...prev,
        {
          timestamp: now,
          timeLabel,
          heapUsedMB: heap.usedMB,
          fps: prev.length > 0 ? prev[prev.length - 1].fps : 60,
          gpuMemoryMB: gpuMB,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    fpsMeterRef.current = new FpsMeter();
    fpsMeterRef.current.start((fps, avgFps) => {
      setStats((prev) => ({ ...prev, currentFps: fps, avgFps }));
    });

    const interval = window.setInterval(updateStats, 1000);
    intervalRef.current = interval;

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (fpsMeterRef.current) fpsMeterRef.current.stop();
    };
  }, [updateStats]);

  const startRecording = useCallback(() => {
    const heap = getHeapMemoryInfo();
    setSamples([]);
    setIsRecording(true);
    setRecordingSummary({
      beforeMB: heap.usedMB,
      peakMB: heap.usedMB,
      afterMB: null,
      startTime: Date.now(),
      durationSeconds: 0,
    });
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setRecordingSummary((prev) => {
      if (!prev) return null;
      const heap = getHeapMemoryInfo();
      const now = Date.now();
      const peakMB = samples.reduce((max, s) => {
        if (s.heapUsedMB && s.heapUsedMB > max) return s.heapUsedMB;
        return max;
      }, prev.beforeMB || 0);

      return {
        ...prev,
        peakMB: peakMB || heap.usedMB,
        afterMB: heap.usedMB,
        durationSeconds: Number(((now - prev.startTime) / 1000).toFixed(1)),
      };
    });
  }, [samples]);

  const clearRecording = useCallback(() => {
    setIsRecording(false);
    setSamples([]);
    setRecordingSummary(null);
  }, []);

  return {
    stats,
    isRecording,
    samples,
    recordingSummary,
    startRecording,
    stopRecording,
    clearRecording,
    updateStats,
  };
}

