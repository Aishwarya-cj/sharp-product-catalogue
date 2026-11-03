import React, { useState } from 'react';
import { Sun, Sparkles, Video, Lock, SlidersHorizontal } from 'lucide-react';
import { ModelItem, RenderingSettings } from '../types';
import { LightingControls } from './LightingControls';
import { MaterialControls } from './MaterialControls';
import { CameraControls } from './CameraControls';

interface RenderingPanelProps {
  settings: RenderingSettings;
  onUpdateSettings: (updater: (prev: RenderingSettings) => RenderingSettings) => void;
  onResetAllSettings: () => void;
  models?: ModelItem[];
  activeTargetId?: string;
  onSelectTarget?: (targetId: string) => void;
  onApplyToAll?: () => void;
}

export const RenderingPanel: React.FC<RenderingPanelProps> = ({
  settings,
  onUpdateSettings,
  onResetAllSettings,
  models,
  activeTargetId,
  onSelectTarget,
  onApplyToAll,
}) => {
  const [activeTab, setActiveTab] = useState<'lighting' | 'materials' | 'camera'>('lighting');

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-black text-white font-bold shadow-sm">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Rendering Controls
            </h3>
            <p className="text-[10px] text-neutral-500">PBR Materials, Multi-Light & Camera</p>
          </div>
        </div>

        {/* Lock indicator */}
        {settings.locked && (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-black text-white font-bold">
            <Lock className="w-3 h-3" />
            LOCKED
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 rounded-xl mb-4 border border-neutral-200">
        <button
          onClick={() => setActiveTab('lighting')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'lighting'
              ? 'bg-black text-white font-bold shadow-sm'
              : 'text-neutral-600 hover:text-black'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Lighting</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'materials'
              ? 'bg-black text-white font-bold shadow-sm'
              : 'text-neutral-600 hover:text-black'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Materials</span>
        </button>

        <button
          onClick={() => setActiveTab('camera')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'camera'
              ? 'bg-black text-white font-bold shadow-sm'
              : 'text-neutral-600 hover:text-black'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Camera</span>
        </button>
      </div>

      {/* Content Area with smooth scroll */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
        {activeTab === 'lighting' && (
          <LightingControls
            settings={settings}
            onChange={onUpdateSettings}
            disabled={settings.locked}
            models={models}
            activeTargetId={activeTargetId}
            onSelectTarget={onSelectTarget}
            onApplyToAll={onApplyToAll}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialControls
            settings={settings}
            onChange={onUpdateSettings}
            disabled={settings.locked}
          />
        )}

        {activeTab === 'camera' && (
          <CameraControls
            settings={settings}
            onChange={onUpdateSettings}
            onResetAllSettings={onResetAllSettings}
            disabled={settings.locked}
          />
        )}
      </div>
    </div>
  );
};
