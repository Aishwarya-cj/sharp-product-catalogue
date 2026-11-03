import React from 'react';
import {
  Cpu,
  Activity,
  Layers,
  HardDrive,
  Trash2,
  Play,
  Square,
  RotateCcw,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { MemoryStats } from '../hooks/useMemoryMonitor';
import { MemorySample } from '../types';

interface MemoryMonitorProps {
  stats: MemoryStats;
  isRecording: boolean;
  samples: MemorySample[];
  recordingSummary: {
    beforeMB: number | null;
    peakMB: number | null;
    afterMB: number | null;
    startTime: number;
    durationSeconds: number;
  } | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearRecording: () => void;
  onCleanUnselected: () => void;
  onClearViewer: () => void;
}

export const MemoryMonitor: React.FC<MemoryMonitorProps> = ({
  stats,
  isRecording,
  samples,
  recordingSummary,
  onStartRecording,
  onStopRecording,
  onClearRecording,
  onCleanUnselected,
  onClearViewer,
}) => {
  return (
    <div className="bg-charcoal-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800/60 text-electric-cyan">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-white uppercase flex items-center gap-2">
              LIVE MEMORY MONITOR & RESOURCE MANAGEMENT
            </h2>
            <p className="text-[11px] text-slate-400">
              Real-time JS Heap, GPU geometry VRAM estimation, and resource disposal tracking
            </p>
          </div>
        </div>

        {/* Recording Session Controls */}
        <div className="flex items-center gap-2 text-xs">
          {!isRecording ? (
            <button
              onClick={onStartRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 font-semibold transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START RECORDING</span>
            </button>
          ) : (
            <button
              onClick={onStopRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-semibold transition animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>STOP RECORDING</span>
            </button>
          )}

          <button
            onClick={onClearRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {/* JS Heap Used */}
        <div className="bg-navy-950 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            JS Heap Used
          </span>
          {stats.heapSupported ? (
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold font-mono text-electric-cyan">
                {stats.heapUsedMB}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">MB</span>
            </div>
          ) : (
            <span className="text-[11px] text-amber-400 font-mono">Unsupported</span>
          )}
        </div>

        {/* JS Heap Limit */}
        <div className="bg-navy-950 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            JS Heap Limit
          </span>
          {stats.heapSupported ? (
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold font-mono text-slate-200">
                {stats.heapLimitMB}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">MB</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500 font-mono">N/A</span>
          )}
        </div>

        {/* Estimated GPU VRAM */}
        <div className="bg-navy-950 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            GPU Geometry VRAM
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-emerald-400">
              {stats.gpuMemoryMB}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">MB</span>
          </div>
        </div>

        {/* Live Frame Rate */}
        <div className="bg-navy-950 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Frame Rate (FPS)
          </span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-lg font-bold font-mono ${
                stats.currentFps >= 55 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {stats.currentFps}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">/ {stats.avgFps} avg</span>
          </div>
        </div>

        {/* Active Geometries */}
        <div className="bg-navy-950 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Geometries
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-cyan-300">
              {stats.geometryCount}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">buffers</span>
          </div>
        </div>

        {/* Textures / Materials */}
        <div className="bg-navy-950 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Materials / Textures
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-slate-200">
              {stats.materialCount}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">/ {stats.textureCount} tex</span>
          </div>
        </div>
      </div>

      {!stats.heapSupported && (
        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Detailed JavaScript heap monitoring is not supported in this browser. Estimated GPU geometry buffer memory and real WebGL draw counters remain fully operational.</span>
        </div>
      )}

      {/* Recording Summary Cards & Chart */}
      {recordingSummary && (
        <div className="mb-4 p-3 rounded-xl bg-navy-950 border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80 text-xs">
            <span className="font-mono text-electric-cyan font-bold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Recording Summary ({recordingSummary.durationSeconds}s session)
            </span>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span>
                Before: <strong className="text-white">{recordingSummary.beforeMB || 'N/A'} MB</strong>
              </span>
              <span>
                Peak: <strong className="text-amber-400">{recordingSummary.peakMB || 'N/A'} MB</strong>
              </span>
              <span>
                After: <strong className="text-emerald-400">{recordingSummary.afterMB || 'N/A'} MB</strong>
              </span>
            </div>
          </div>

          {/* Timeline Chart */}
          {samples.length > 1 && (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={samples}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b101f', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="heapUsedMB" name="JS Heap (MB)" stroke="#00f2fe" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="gpuMemoryMB" name="GPU VRAM (MB)" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Resource Management & Garbage Collection Cleanup Section */}
      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-400">
            Memory Cleanup: Explicit Three.js BufferGeometry, Material & Texture deallocation with reference tracking.
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onCleanUnselected}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-200 border border-slate-700 font-medium transition"
            title="Safely dispose all unselected models and unreferenced textures"
          >
            <Trash2 className="w-3.5 h-3.5 text-amber-400" />
            <span>CLEAN UNSELECTED</span>
          </button>

          <button
            onClick={onClearViewer}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-semibold transition"
            title="Dispose all loaded geometries and clear the viewer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>CLEAR VIEWER</span>
          </button>
        </div>
      </div>
    </div>
  );
};

