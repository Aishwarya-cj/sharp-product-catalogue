import React from 'react';
import { Box, Lock, Unlock, Layers, RotateCcw } from 'lucide-react';
import { RenderingSettings } from '../types';

interface HeaderProps {
  settings: RenderingSettings;
  onUpdateSettings: (updater: (prev: RenderingSettings) => RenderingSettings) => void;
  selectedCount: number;
  totalModels: number;
  onResetToOriginal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  selectedCount,
  totalModels,
  onResetToOriginal,
}) => {
  const toggleLock = () => {
    onUpdateSettings((prev) => ({ ...prev, locked: !prev.locked }));
  };

  return (
    <header className="bg-white/95 border-b border-neutral-200 backdrop-blur-md px-6 py-3.5 sticky top-0 z-50 transition-colors shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-[1800px] mx-auto">
        {/* Brand and Subtitle */}
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-black text-white p-0.5 flex items-center justify-center font-black shadow-md">
            <Box className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-wider text-black">
                SHARP <span className="text-neutral-500 font-bold">PRODUCT CATALOGUE</span>
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200 font-semibold tracking-wider">
                3D Studio
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium">
              Interactive 3D Model Optimization & Performance Laboratory
            </p>
          </div>
        </div>

        {/* Right Status & Actions */}
        <div className="flex items-center gap-2.5 text-xs">
          {/* Active Components Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-700 font-mono">
            <Layers className="w-3.5 h-3.5 text-black" />
            <span>
              Products: <strong className="text-black">{selectedCount}</strong> / {totalModels}
            </span>
          </div>

          {/* Reset to Original Model Button */}
          {onResetToOriginal && (
            <button
              onClick={onResetToOriginal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-semibold transition shadow-sm hover:shadow active:scale-95"
              title="Reset all parts, camera, lights, and materials to original product default"
            >
              <RotateCcw className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              <span>Reset to Original</span>
            </button>
          )}

          {/* Global Settings Lock Button */}
          <button
            onClick={toggleLock}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-medium transition-all ${
              settings.locked
                ? 'bg-neutral-900 text-white font-bold shadow-md'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200'
            }`}
            title={settings.locked ? 'Rendering controls are locked' : 'Click to lock rendering controls'}
          >
            {settings.locked ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>LOCKED</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-neutral-500" />
                <span>LOCK</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
