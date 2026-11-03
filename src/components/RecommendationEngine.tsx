import React from 'react';
import { Award, CheckCircle2, AlertTriangle, ShieldCheck, Scale, Cpu, Zap, Eye, HelpCircle } from 'lucide-react';
import { Recommendation } from '../types';

interface RecommendationEngineProps {
  recommendation: Recommendation;
}

export const RecommendationEngine: React.FC<RecommendationEngineProps> = ({ recommendation }) => {
  const isMeshoptRecommended = recommendation.recommendedVariant === 'Meshopt';

  return (
    <div className="bg-charcoal-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-electric-cyan/20 border border-electric-cyan/40 text-electric-cyan">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-white uppercase flex items-center gap-2">
              TRANSPARENT AUTOMATIC RECOMMENDATION ENGINE
            </h2>
            <p className="text-[11px] text-slate-400">
              Deterministic multi-criteria scoring algorithm with strict visual fidelity gating
            </p>
          </div>
        </div>

        {/* Recommended Variant Badge */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold tracking-wide ${
            isMeshoptRecommended
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'bg-navy-800 text-slate-300 border-slate-700'
          }`}
        >
          {isMeshoptRecommended ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
          <span>RECOMMENDED: {recommendation.recommendedVariant.toUpperCase()} VARIANT</span>
        </div>
      </div>

      {/* Main Score & Recommendation Reason Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Composite Score Card */}
        <div className="bg-navy-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between items-center text-center">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
            Composite Optimization Score
          </span>
          <div className="my-2">
            <span
              className={`text-4xl font-black font-mono tracking-tight ${
                recommendation.compositeScore >= 75
                  ? 'text-emerald-400'
                  : recommendation.compositeScore >= 50
                  ? 'text-cyan-400'
                  : 'text-amber-400'
              }`}
            >
              {recommendation.compositeScore}
            </span>
            <span className="text-sm font-mono text-slate-500"> / 100</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {recommendation.compositeScore >= 70 ? 'Production Ready' : 'Optimization Optional'}
          </span>
        </div>

        {/* Reason Banner Card */}
        <div className="md:col-span-3 bg-navy-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-electric-cyan font-bold tracking-wider block mb-1">
              Optimization Verdict & Engineering Justification
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">{recommendation.reason}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 mt-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block">VRAM / Storage Saved</span>
              <span className="font-bold text-emerald-400">
                {recommendation.fileSizeSavedMB} MB ({recommendation.fileSizeReductionPercent}%)
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Load Speedup</span>
              <span className="font-bold text-cyan-300">
                {recommendation.loadingTimeImprovementPercent > 0
                  ? `+${recommendation.loadingTimeImprovementPercent}% faster`
                  : 'Comparable'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Visual SSIM Fidelity</span>
              <span className="font-bold text-electric-cyan">
                {recommendation.visualFidelitySSIM.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transparent Formula Breakdown */}
      <div className="bg-navy-950 p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5 uppercase">
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            Transparent Scoring Formula & Weighted Metrics
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Formula: 0.40(Fidelity) + 0.25(Size) + 0.20(Speed) + 0.15(FPS)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* 1. Visual Fidelity (40%) */}
          <div className="p-2.5 rounded-lg bg-navy-900 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                <Eye className="w-3 h-3 text-electric-cyan" />
                Visual Fidelity
              </span>
              <span className="text-electric-cyan font-mono font-bold">40% Weight</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mb-0.5">
              {recommendation.breakdown.fidelityScore}
              <span className="text-xs font-normal text-slate-500"> / 100</span>
            </div>
            <span className="text-[9px] text-slate-400 block">Strict gate: SSIM &lt; 0.92 caps score</span>
          </div>

          {/* 2. Transfer Size (25%) */}
          <div className="p-2.5 rounded-lg bg-navy-900 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-emerald-400" />
                Size Reduction
              </span>
              <span className="text-emerald-400 font-mono font-bold">25% Weight</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mb-0.5">
              {recommendation.breakdown.sizeScore}
              <span className="text-xs font-normal text-slate-500"> / 100</span>
            </div>
            <span className="text-[9px] text-slate-400 block">Byte savings & CDN load</span>
          </div>

          {/* 3. Load & Decompress (20%) */}
          <div className="p-2.5 rounded-lg bg-navy-900 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Load & Decompress
              </span>
              <span className="text-amber-400 font-mono font-bold">20% Weight</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mb-0.5">
              {recommendation.breakdown.speedScore}
              <span className="text-xs font-normal text-slate-500"> / 100</span>
            </div>
            <span className="text-[9px] text-slate-400 block">Meshopt WASM decode speed</span>
          </div>

          {/* 4. Frame Rate Stability (15%) */}
          <div className="p-2.5 rounded-lg bg-navy-900 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-300" />
                FPS Stability
              </span>
              <span className="text-cyan-300 font-mono font-bold">15% Weight</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mb-0.5">
              {recommendation.breakdown.fpsScore}
              <span className="text-xs font-normal text-slate-500"> / 100</span>
            </div>
            <span className="text-[9px] text-slate-400 block">GPU vertex shader throughput</span>
          </div>
        </div>
      </div>
    </div>
  );
};

