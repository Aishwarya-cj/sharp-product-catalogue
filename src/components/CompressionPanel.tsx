import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Play,
  RotateCcw,
  SplitSquareVertical,
  CheckCircle2,
  Clock,
  HardDrive,
  Loader2,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { CompressionSettings, ModelItem } from '../types';
import { compressModelApi } from '../services/modelService';

interface CompressionPanelProps {
  models: ModelItem[];
  selectedModelId: string | null;
  onSelectModel: (id: string) => void;
  onToggleUseCompressed: (useCompressed: boolean) => void;
  useCompressed: boolean;
  onOpenComparison: (model: ModelItem) => void;
  onCompressionSuccess: (modelId: string, result: any) => void;
  onBenchmarkRun: (model: ModelItem, variant: 'Original' | 'Meshopt') => void;
}

export const CompressionPanel: React.FC<CompressionPanelProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  onToggleUseCompressed,
  useCompressed,
  onOpenComparison,
  onCompressionSuccess,
  onBenchmarkRun,
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressStatus, setCompressStatus] = useState<string | null>(null);
  const [compressionSettings, setCompressionSettings] = useState<CompressionSettings>({
    level: 'medium',
    reorder: true,
    quantize: false,
  });

  const activeModel = models.find((m) => m.id === selectedModelId) || models[0];

  const handleRunMeshoptCompression = async () => {
    if (!activeModel) return;
    setIsCompressing(true);
    setCompressStatus(`Running real Meshopt encoding on ${activeModel.filename}...`);

    try {
      const result = await compressModelApi(activeModel.filename, compressionSettings);
      setCompressStatus(`Successfully compressed! Slashed size by ${result.reductionPercentage}% in ${result.compressionTimeMs}ms.`);
      onCompressionSuccess(activeModel.id, result);
    } catch (err: any) {
      console.error('Compression failed:', err);
      setCompressStatus(`Compression failed: ${err.message}`);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownloadOriginal = () => {
    if (!activeModel) return;
    window.location.href = `/api/download?filename=${encodeURIComponent(activeModel.filename)}&type=original`;
  };

  const handleDownloadCompressed = () => {
    if (!activeModel || !activeModel.compressedFilename) return;
    window.location.href = `/api/download?filename=${encodeURIComponent(activeModel.compressedFilename)}&type=compressed`;
  };

  return (
    <div className="bg-charcoal-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-electric-blue/20 border border-electric-cyan/40 text-electric-cyan">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-white uppercase flex items-center gap-2">
              MODEL OPTIMIZATION & MESHOPT PIPELINE
            </h2>
            <p className="text-[11px] text-slate-400">
              Deterministic glTF-Transform geometry quantization & Meshopt index/vertex compression
            </p>
          </div>
        </div>

        {/* Model Target Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Target:</span>
          <select
            value={activeModel?.id || ''}
            onChange={(e) => onSelectModel(e.target.value)}
            className="bg-navy-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-electric-cyan"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.partNumber}: {m.displayName} ({m.formattedOriginalSize})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Model Stats Card & Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Model Metrics Card */}
        <div className="bg-navy-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase text-electric-cyan font-bold tracking-wider">
                {activeModel?.partNumber || 'Part'} Spec
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-navy-850 text-slate-300 border border-slate-700">
                {activeModel?.category || 'Component'}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{activeModel?.displayName}</h3>
            <p className="text-[11px] text-slate-400 font-mono mb-3">{activeModel?.filename}</p>

            {/* Sizes Comparison */}
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-navy-900 border border-slate-800 mb-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-mono">Original GLB</span>
                <span className="text-slate-100 font-bold font-mono">
                  {activeModel?.formattedOriginalSize || '0 KB'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-mono">Meshopt GLB</span>
                {activeModel?.hasCompressedVariant ? (
                  <span className="text-emerald-400 font-bold font-mono flex items-center gap-1">
                    {activeModel.formattedCompressedSize}
                    <span className="text-[10px] text-emerald-300">
                      (-
                      {(
                        ((activeModel.originalSizeBytes - (activeModel.compressedSizeBytes || 0)) /
                          activeModel.originalSizeBytes) *
                        100
                      ).toFixed(1)}
                      %)
                    </span>
                  </span>
                ) : (
                  <span className="text-amber-400 font-mono text-[11px]">Pending Meshopt</span>
                )}
              </div>
            </div>
          </div>

          {/* Toggle between Original and Meshopt in the main viewer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-300">Viewer Variant:</span>
            <div className="flex gap-1 bg-navy-900 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => onToggleUseCompressed(false)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  !useCompressed ? 'bg-cyan-950 text-electric-cyan border border-cyan-800' : 'text-slate-400'
                }`}
              >
                Original
              </button>
              <button
                disabled={!activeModel?.hasCompressedVariant}
                onClick={() => onToggleUseCompressed(true)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  useCompressed ? 'bg-electric-blue text-white shadow-glow-blue' : 'text-slate-400'
                } ${!activeModel?.hasCompressedVariant ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                Meshopt
              </button>
            </div>
          </div>
        </div>

        {/* Middle Column: Compression Settings */}
        <div className="bg-navy-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono uppercase text-slate-300 font-bold tracking-wider">
                Meshopt Parameters
              </span>
            </div>

            {/* Compression Level */}
            <div className="mb-3">
              <label className="text-xs text-slate-300 block mb-1">Compression Level</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCompressionSettings((s) => ({ ...s, level: 'medium' }))}
                  className={`py-1.5 text-xs rounded-lg font-medium border transition ${
                    compressionSettings.level === 'medium'
                      ? 'bg-electric-cyan text-navy-950 font-bold border-electric-cyan shadow-glow-cyan'
                      : 'bg-navy-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  Medium (Fast)
                </button>
                <button
                  onClick={() => setCompressionSettings((s) => ({ ...s, level: 'high' }))}
                  className={`py-1.5 text-xs rounded-lg font-medium border transition ${
                    compressionSettings.level === 'high'
                      ? 'bg-electric-cyan text-navy-950 font-bold border-electric-cyan shadow-glow-cyan'
                      : 'bg-navy-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  High (Max Ratio)
                </button>
              </div>
            </div>

            {/* Reorder Vertices */}
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-300">Vertex Cache Reordering</span>
              <input
                type="checkbox"
                checked={compressionSettings.reorder}
                onChange={(e) => setCompressionSettings((s) => ({ ...s, reorder: e.target.checked }))}
                className="w-4 h-4 rounded accent-electric-cyan cursor-pointer"
              />
            </div>

            {/* Quantize Geometry */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Attribute Quantization</span>
              <input
                type="checkbox"
                checked={compressionSettings.quantize}
                onChange={(e) => setCompressionSettings((s) => ({ ...s, quantize: e.target.checked }))}
                className="w-4 h-4 rounded accent-electric-cyan cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-2 text-[10px] text-slate-400 font-mono">
            Meshopt encodes index buffer triangles & vertex attributes losslessly or near-losslessly without destroying UVs.
          </div>
        </div>

        {/* Right Column: Execution Buttons & Output */}
        <div className="bg-navy-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-300 font-bold tracking-wider block mb-2">
              Actions
            </span>

            {/* 1. Compress Model */}
            <button
              disabled={isCompressing || !activeModel}
              onClick={handleRunMeshoptCompression}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-navy-950 font-bold text-xs shadow-glow-cyan transition disabled:opacity-50 disabled:cursor-not-allowed mb-2"
            >
              {isCompressing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-navy-950" />
                  <span>Compressing Geometry...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Compress Model (Meshopt)</span>
                </>
              )}
            </button>

            {/* Compare Original vs Compressed */}
            <button
              disabled={!activeModel?.hasCompressedVariant}
              onClick={() => onOpenComparison(activeModel)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-electric-cyan border border-cyan-800/70 hover:border-cyan-600 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed mb-2"
            >
              <SplitSquareVertical className="w-4 h-4" />
              <span>Compare Original vs Compressed (SSIM)</span>
            </button>

            {/* Benchmark buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onBenchmarkRun(activeModel, 'Original')}
                className="py-1.5 px-2 rounded-lg bg-navy-900 hover:bg-navy-850 text-slate-200 border border-slate-800 text-[11px] font-mono transition"
              >
                Bench Original
              </button>
              <button
                disabled={!activeModel?.hasCompressedVariant}
                onClick={() => onBenchmarkRun(activeModel, 'Meshopt')}
                className="py-1.5 px-2 rounded-lg bg-navy-900 hover:bg-navy-850 text-emerald-400 border border-slate-800 text-[11px] font-mono transition disabled:opacity-40"
              >
                Bench Meshopt
              </button>
            </div>
          </div>

          {/* Downloads */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
            <button
              onClick={handleDownloadOriginal}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-navy-900 hover:bg-navy-850 text-slate-300 text-[11px] border border-slate-800 transition"
              title="Download original uncompressed GLB"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Original GLB</span>
            </button>
            <button
              disabled={!activeModel?.hasCompressedVariant}
              onClick={handleDownloadCompressed}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 text-[11px] border border-emerald-800/50 transition disabled:opacity-40"
              title="Download Meshopt-compressed GLB"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Meshopt GLB</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compression Status Output Line */}
      {compressStatus && (
        <div className="mt-3 p-2.5 rounded-xl bg-navy-950 border border-slate-800 text-xs font-mono text-electric-cyan flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{compressStatus}</span>
        </div>
      )}
    </div>
  );
};

