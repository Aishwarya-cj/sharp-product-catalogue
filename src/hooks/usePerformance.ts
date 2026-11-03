import { useState, useCallback } from 'react';
import { BenchmarkRecord, Recommendation } from '../types';
import { computeStatistics, getDeviceInfo, getHeapMemoryInfo } from '../utils/performance';
import { globalMemoryManager } from '../utils/memoryManager';
import { saveBenchmarkApi } from '../services/modelService';

export function calculateRecommendation(
  originalBenchmark: BenchmarkRecord | null,
  compressedBenchmark: BenchmarkRecord | null
): Recommendation {
  if (!originalBenchmark || !compressedBenchmark) {
    return {
      recommendedVariant: 'Original',
      compositeScore: 0,
      fileSizeSavedMB: 0,
      fileSizeReductionPercent: 0,
      loadingTimeImprovementPercent: 0,
      visualFidelitySSIM: 1.0,
      reason: 'Run both Original and Meshopt benchmarks to generate a transparent recommendation.',
      breakdown: { fidelityScore: 0, sizeScore: 0, speedScore: 0, fpsScore: 0 },
    };
  }

  const ssim = compressedBenchmark.visualFidelitySSIM || 0.998;
  const originalSizeMB = originalBenchmark.fileSize / (1024 * 1024);
  const compressedSizeMB = compressedBenchmark.fileSize / (1024 * 1024);
  const sizeSavedMB = Math.max(0, originalSizeMB - compressedSizeMB);
  const sizeReductionPercent = Number((((originalBenchmark.fileSize - compressedBenchmark.fileSize) / originalBenchmark.fileSize) * 100).toFixed(1));

  const origLoadTime = originalBenchmark.totalLoadTimeMs || 100;
  const compLoadTime = compressedBenchmark.totalLoadTimeMs || 100;
  const speedImprovementPercent = Number((((origLoadTime - compLoadTime) / origLoadTime) * 100).toFixed(1));

  // 1. Fidelity Score (40% weight): SSIM >= 0.99 => 100, drops sharply if < 0.95
  let fidelityScore = 0;
  if (ssim >= 0.99) fidelityScore = 100;
  else if (ssim >= 0.95) fidelityScore = 80 + ((ssim - 0.95) / 0.04) * 20;
  else if (ssim >= 0.90) fidelityScore = 50 + ((ssim - 0.90) / 0.05) * 30;
  else fidelityScore = Math.max(0, ssim * 50);

  // 2. Size Score (25% weight): based on percentage reduction
  const sizeScore = Math.min(100, Math.max(0, sizeReductionPercent * 1.5));

  // 3. Speed Score (20% weight): based on loading time improvement
  const speedScore = Math.min(100, Math.max(0, 50 + speedImprovementPercent));

  // 4. FPS Score (15% weight)
  const fpsScore = Math.min(100, Math.max(0, (compressedBenchmark.fps / 60) * 100));

  // Weighted composite score (0 - 100)
  let compositeScore = (fidelityScore * 0.40) + (sizeScore * 0.25) + (speedScore * 0.20) + (fpsScore * 0.15);

  // Strict quality constraint: If visual fidelity is poor (< 0.92), cannot recommend compressed variant
  if (ssim < 0.92) {
    compositeScore = Math.min(compositeScore, 40);
  }

  const isRecommended = compositeScore >= 70 && ssim >= 0.95 && sizeReductionPercent > 10;
  const recommendedVariant = isRecommended ? 'Meshopt' : 'Original';

  let reason = '';
  if (isRecommended) {
    reason = `Meshopt is strongly recommended: preserves exceptional visual clarity (SSIM ${ssim}), slashes transfer size by ${sizeReductionPercent}% (saves ${sizeSavedMB.toFixed(2)} MB), and maintains smooth ${compressedBenchmark.fps} FPS.`;
  } else if (ssim < 0.95) {
    reason = `Original variant recommended: Meshopt visual fidelity fell below threshold (SSIM ${ssim} < 0.95). Visual accuracy is prioritized over compression ratio.`;
  } else {
    reason = `Original variant currently preferred: compression reduction (${sizeReductionPercent}%) or load time improvement does not justify transformation overhead.`;
  }

  return {
    recommendedVariant,
    compositeScore: Number(compositeScore.toFixed(1)),
    fileSizeSavedMB: Number(sizeSavedMB.toFixed(2)),
    fileSizeReductionPercent: sizeReductionPercent,
    loadingTimeImprovementPercent: speedImprovementPercent,
    visualFidelitySSIM: ssim,
    reason,
    breakdown: {
      fidelityScore: Number(fidelityScore.toFixed(1)),
      sizeScore: Number(sizeScore.toFixed(1)),
      speedScore: Number(speedScore.toFixed(1)),
      fpsScore: Number(fpsScore.toFixed(1)),
    },
  };
}

export function usePerformance() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkRecord[]>([]);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [currentRunProgress, setCurrentRunProgress] = useState<{ current: number; total: number } | null>(null);

  const addBenchmark = useCallback((record: BenchmarkRecord) => {
    setBenchmarks((prev) => [record, ...prev]);
    saveBenchmarkApi(record).catch(console.error);
  }, []);

  const clearAllBenchmarks = useCallback(() => {
    setBenchmarks([]);
  }, []);

  return {
    benchmarks,
    setBenchmarks,
    isBenchmarking,
    setIsBenchmarking,
    currentRunProgress,
    setCurrentRunProgress,
    addBenchmark,
    clearAllBenchmarks,
  };
}

