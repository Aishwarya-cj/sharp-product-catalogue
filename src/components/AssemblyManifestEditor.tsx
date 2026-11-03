import React, { useState } from 'react';
import { X, Save, Sliders, CheckCircle2, RotateCcw } from 'lucide-react';
import { AssemblyManifest } from '../types';

interface AssemblyManifestEditorProps {
  manifest: AssemblyManifest;
  onSave: (newManifest: AssemblyManifest) => Promise<void>;
  onClose: () => void;
}

export const AssemblyManifestEditor: React.FC<AssemblyManifestEditorProps> = ({
  manifest,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<AssemblyManifest>(JSON.parse(JSON.stringify(manifest)));
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTransformChange = (
    filename: string,
    field: 'position' | 'rotation' | 'scale',
    axisIndex: number,
    value: number
  ) => {
    setFormData((prev) => {
      const copy = { ...prev };
      const comp = { ...copy.components[filename] };
      const arr = [...comp[field]] as [number, number, number];
      arr[axisIndex] = value;
      comp[field] = arr;
      copy.components[filename] = comp;
      return copy;
    });
  };

  const handleFieldChange = (filename: string, key: 'displayName' | 'category' | 'description', value: string) => {
    setFormData((prev) => {
      const copy = { ...prev };
      copy.components[filename] = {
        ...copy.components[filename],
        [key]: value,
      };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save manifest:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-charcoal-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-electric-cyan">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                EDIT ASSEMBLY MANIFEST
              </h3>
              <p className="text-xs text-slate-400">
                Configure relative assembly coordinate offsets [X, Y, Z], rotation, scale and display labels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-navy-950 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {Object.entries(formData.components).map(([filename, comp]) => (
            <div key={filename} className="bg-navy-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div>
                  <span className="text-[10px] font-mono uppercase text-electric-cyan font-bold block">
                    {comp.partNumber || filename}
                  </span>
                  <input
                    type="text"
                    value={comp.displayName}
                    onChange={(e) => handleFieldChange(filename, 'displayName', e.target.value)}
                    className="bg-navy-900 border border-slate-700 rounded px-2 py-1 text-xs font-semibold text-white outline-none focus:border-electric-cyan w-64"
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-500 truncate">{filename}</span>
              </div>

              {/* Transforms: Position, Rotation, Scale */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                {/* Position */}
                <div>
                  <span className="text-slate-400 text-[10px] block mb-1">Position Offset (X, Y, Z)</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[0, 1, 2].map((idx) => (
                      <input
                        key={idx}
                        type="number"
                        step="0.05"
                        value={comp.position[idx]}
                        onChange={(e) =>
                          handleTransformChange(filename, 'position', idx, parseFloat(e.target.value) || 0)
                        }
                        className="bg-navy-900 border border-slate-700 rounded p-1 text-center text-xs text-slate-200 outline-none focus:border-electric-cyan"
                      />
                    ))}
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <span className="text-slate-400 text-[10px] block mb-1">Euler Rotation (Rad)</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[0, 1, 2].map((idx) => (
                      <input
                        key={idx}
                        type="number"
                        step="0.05"
                        value={comp.rotation[idx]}
                        onChange={(e) =>
                          handleTransformChange(filename, 'rotation', idx, parseFloat(e.target.value) || 0)
                        }
                        className="bg-navy-900 border border-slate-700 rounded p-1 text-center text-xs text-slate-200 outline-none focus:border-electric-cyan"
                      />
                    ))}
                  </div>
                </div>

                {/* Scale */}
                <div>
                  <span className="text-slate-400 text-[10px] block mb-1">Scale Multiplier</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[0, 1, 2].map((idx) => (
                      <input
                        key={idx}
                        type="number"
                        step="0.05"
                        value={comp.scale[idx]}
                        onChange={(e) =>
                          handleTransformChange(filename, 'scale', idx, parseFloat(e.target.value) || 1)
                        }
                        className="bg-navy-900 border border-slate-700 rounded p-1 text-center text-xs text-slate-200 outline-none focus:border-electric-cyan"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-navy-950 flex items-center justify-between">
          {saveSuccess ? (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              Assembly manifest successfully updated and saved.
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              Changes take effect immediately across all active 3D components.
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 text-xs transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-electric-cyan text-navy-950 font-bold text-xs shadow-glow-cyan hover:bg-cyan-300 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Manifest'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

