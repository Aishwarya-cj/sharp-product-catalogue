import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  Activity,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  HardDrive,
  Cpu,
  Monitor,
  Flame,
  MessageSquare,
} from 'lucide-react';
import { BenchmarkRecord, InspectionNote, ModelItem } from '../types';

interface PerformanceDashboardProps {
  benchmarks: BenchmarkRecord[];
  onClearBenchmarks: () => void;
  onRunMultiIterationBenchmark: (model: ModelItem, variant: 'Original' | 'Meshopt') => void;
  isBenchmarking: boolean;
  activeModel: ModelItem | null;
  notes: InspectionNote[];
  onAddNote: (text: string, rating: number) => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  benchmarks,
  onClearBenchmarks,
  onRunMultiIterationBenchmark,
  isBenchmarking,
  activeModel,
  notes,
  onAddNote,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'size' | 'timing' | 'fps'>('size');
  const [newNoteText, setNewNoteText] = useState('');
  const [noteRating, setNoteRating] = useState(5);

  // Prepare chart data comparing Original vs Meshopt for recorded models
  const modelMap = new Map<string, { name: string; origSize: number; compSize: number; origLoad: number; compLoad: number; decodeTime: number; compressTime: number; fps: number }>();

  for (const b of benchmarks) {
    let entry = modelMap.get(b.modelName);
    if (!entry) {
      entry = {
        name: b.modelName.replace('.glb', '').slice(0, 15),
        origSize: 0,
        compSize: 0,
        origLoad: 0,
        compLoad: 0,
        decodeTime: 0,
        compressTime: 0,
        fps: b.fps,
      };
      modelMap.set(b.modelName, entry);
    }

    if (b.variant === 'Original') {
      entry.origSize = Number((b.fileSize / (1024 * 1024)).toFixed(2));
      entry.origLoad = Number(b.totalLoadTimeMs.toFixed(1));
    } else {
      entry.compSize = Number((b.fileSize / (1024 * 1024)).toFixed(2));
      entry.compLoad = Number(b.totalLoadTimeMs.toFixed(1));
      entry.decodeTime = Number(b.decompressionTimeMs.toFixed(1));
      entry.compressTime = Number(b.compressionTimeMs.toFixed(1));
    }
  }

  const chartData = Array.from(modelMap.values());

  const handleExportCSV = () => {
    if (benchmarks.length === 0) return;
    const headers = [
      'Model',
      'Variant',
      'File Size (Bytes)',
      'Reduction (%)',
      'Compression Time (ms)',
      'Decompression Time (ms)',
      'Total Load (ms)',
      'Heap RAM (MB)',
      'GPU VRAM (MB)',
      'FPS',
      'Fidelity (SSIM)',
      'Min Load (ms)',
      'Max Load (ms)',
      'Avg Load (ms)',
      'Median Load (ms)',
      'Browser',
      'Renderer',
      'Timestamp',
    ];

    const rows = benchmarks.map((b) => [
      `"${b.modelName}"`,
      b.variant,
      b.fileSize,
      b.reductionPercentage,
      b.compressionTimeMs,
      b.decompressionTimeMs,
      b.totalLoadTimeMs,
      b.heapUsedMB ?? 'N/A',
      b.gpuMemoryMB,
      b.fps,
      b.visualFidelitySSIM,
      b.stats?.minLoadTimeMs ?? b.totalLoadTimeMs,
      b.stats?.maxLoadTimeMs ?? b.totalLoadTimeMs,
      b.stats?.avgLoadTimeMs ?? b.totalLoadTimeMs,
      b.stats?.medianLoadTimeMs ?? b.totalLoadTimeMs,
      `"${b.deviceInfo.browser}"`,
      `"${b.deviceInfo.renderer}"`,
      new Date(b.timestamp).toISOString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sharp-3d-meshopt-benchmark-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportReport = () => {
    const report = {
      title: 'SHARP PRODUCT CATALOGUE - 3D Optimization Benchmark Report',
      generatedAt: new Date().toISOString(),
      benchmarkCount: benchmarks.length,
      records: benchmarks,
      notes,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sharp-performance-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddNote(newNoteText.trim(), noteRating);
    setNewNoteText('');
  };

  return (
    <div className="bg-charcoal-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-electric-cyan/20 border border-electric-cyan/40 text-electric-cyan">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-white uppercase flex items-center gap-2">
              PERFORMANCE BENCHMARK DASHBOARD
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-navy-800 text-electric-cyan border border-slate-700">
                {benchmarks.length} Records
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Comparative metrics across Original and Meshopt-compressed geometries under consistent test rigs
            </p>
          </div>
        </div>

        {/* Global Dashboard Actions */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* 5-Iteration Consistency Test Button */}
          {activeModel && (
            <button
              disabled={isBenchmarking}
              onClick={() => onRunMultiIterationBenchmark(activeModel, 'Meshopt')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition shadow-glow-cyan/40 disabled:opacity-50"
              title="Run 5 warm-up and measured iterations to determine min, max, avg, and median load timings"
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>{isBenchmarking ? 'Running 5-Pass Benchmark...' : '5-Pass Consistency Test'}</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            disabled={benchmarks.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 font-semibold transition disabled:opacity-40"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportReport}
            disabled={benchmarks.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-200 border border-slate-700 transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download Report</span>
          </button>

          <button
            onClick={onClearBenchmarks}
            disabled={benchmarks.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition disabled:opacity-40"
            title="Clear benchmark records"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Charts Tab Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveChartTab('size')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeChartTab === 'size'
                ? 'bg-electric-cyan text-navy-950 shadow-glow-cyan'
                : 'bg-navy-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            File Size Comparison (MB)
          </button>
          <button
            onClick={() => setActiveChartTab('timing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeChartTab === 'timing'
                ? 'bg-electric-cyan text-navy-950 shadow-glow-cyan'
                : 'bg-navy-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Load & Decode Timings (ms)
          </button>
          <button
            onClick={() => setActiveChartTab('fps')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeChartTab === 'fps'
                ? 'bg-electric-cyan text-navy-950 shadow-glow-cyan'
                : 'bg-navy-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            FPS Stability
          </button>
        </div>
      </div>

      {/* Chart Display Area */}
      <div className="h-56 w-full bg-navy-950/80 p-3 rounded-xl border border-slate-800">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {activeChartTab === 'size' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b101f', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="origSize" name="Original File Size (MB)" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="compSize" name="Meshopt File Size (MB)" fill="#00f2fe" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : activeChartTab === 'timing' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b101f', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="origLoad" name="Original Load Time (ms)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="compLoad" name="Meshopt Load Time (ms)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="decodeTime" name="Meshopt Decode Time (ms)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 75]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b101f', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="fps" name="Render Frame Rate (FPS)" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
            Execute benchmarks or load models to populate comparative analytics.
          </div>
        )}
      </div>

      {/* Main Benchmark Results Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3">Model</th>
              <th className="p-3">Variant</th>
              <th className="p-3">File Size</th>
              <th className="p-3">Reduction</th>
              <th className="p-3">Compression</th>
              <th className="p-3">Decompression</th>
              <th className="p-3">Total Load</th>
              <th className="p-3">RAM</th>
              <th className="p-3">GPU VRAM</th>
              <th className="p-3">FPS</th>
              <th className="p-3">Fidelity (SSIM)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-navy-900/50">
            {benchmarks.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-4 text-center text-slate-500">
                  No benchmark records captured yet. Click "Bench Original" or "Bench Meshopt" above.
                </td>
              </tr>
            ) : (
              benchmarks.map((b) => (
                <tr key={b.id} className="hover:bg-navy-800/50 transition">
                  <td className="p-3 text-slate-200 font-medium">{b.modelName}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.variant === 'Meshopt'
                          ? 'bg-cyan-950 text-electric-cyan border border-cyan-800'
                          : 'bg-navy-800 text-slate-300'
                      }`}
                    >
                      {b.variant}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300 font-bold">
                    {(b.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </td>
                  <td className="p-3 text-emerald-400 font-bold">
                    {b.reductionPercentage > 0 ? `-${b.reductionPercentage}%` : '--'}
                  </td>
                  <td className="p-3 text-slate-400">
                    {b.compressionTimeMs > 0 ? `${b.compressionTimeMs} ms` : '--'}
                  </td>
                  <td className="p-3 text-cyan-300">
                    {b.decompressionTimeMs > 0 ? `${b.decompressionTimeMs} ms` : '--'}
                  </td>
                  <td className="p-3 text-slate-200">
                    {b.totalLoadTimeMs.toFixed(1)} ms
                    {b.stats && (
                      <span className="block text-[9px] text-slate-500">
                        min:{b.stats.minLoadTimeMs} / avg:{b.stats.avgLoadTimeMs}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-400">{b.heapUsedMB !== null ? `${b.heapUsedMB} MB` : 'N/A'}</td>
                  <td className="p-3 text-emerald-400">{b.gpuMemoryMB} MB</td>
                  <td className="p-3 text-slate-300">{b.fps}</td>
                  <td className="p-3 font-bold text-electric-cyan">
                    {b.visualFidelitySSIM > 0 ? b.visualFidelitySSIM.toFixed(4) : '1.0000'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inspection Notes & Feedback Section */}
      <div className="pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Add Note Form */}
        <form onSubmit={handleSaveNoteSubmit} className="bg-navy-950/80 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-electric-cyan" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Save Inspection Note
            </span>
          </div>
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Document visual clarity observations, artifact detection, or geometry topology details..."
            rows={2}
            className="w-full bg-navy-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-electric-cyan mb-2 resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Rating:</span>
              <select
                value={noteRating}
                onChange={(e) => setNoteRating(Number(e.target.value))}
                className="bg-navy-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-electric-cyan"
              >
                <option value={5}>5 - Flawless (Near-Lossless)</option>
                <option value={4}>4 - High Fidelity</option>
                <option value={3}>3 - Acceptable</option>
                <option value={2}>2 - Minor Artifacts</option>
                <option value={1}>1 - Significant Distortion</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={!newNoteText.trim()}
              className="px-3 py-1 rounded-lg bg-electric-cyan text-navy-950 font-bold text-xs shadow-glow-cyan disabled:opacity-40"
            >
              Save Note
            </button>
          </div>
        </form>

        {/* Existing Notes Feed */}
        <div className="bg-navy-950/80 p-3.5 rounded-xl border border-slate-800 overflow-y-auto max-h-36 custom-scrollbar space-y-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block mb-2">
            Inspection History ({notes.length})
          </span>
          {notes.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No notes recorded yet for this session.</p>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="p-2 rounded-lg bg-navy-900 border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                  <span>{new Date(n.timestamp).toLocaleTimeString()}</span>
                  <span className="text-amber-400">Score: {n.visualRating}/5</span>
                </div>
                <p className="text-slate-200">{n.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

