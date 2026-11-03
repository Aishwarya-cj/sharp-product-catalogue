import React from 'react';
import { ToggleLeft, ToggleRight, Layers } from 'lucide-react';
import { RenderingSettings } from '../types';

interface MaterialControlsProps {
  settings: RenderingSettings;
  onChange: (updater: (prev: RenderingSettings) => RenderingSettings) => void;
  disabled?: boolean;
}

export const MaterialControls: React.FC<MaterialControlsProps> = ({ settings, onChange, disabled }) => {
  const updateField = <K extends keyof RenderingSettings>(field: K, value: RenderingSettings[K]) => {
    if (disabled) return;
    onChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-4 text-neutral-900">
      {/* Notice */}
      <div className="px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-[11px] text-neutral-700 flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-black shrink-0" />
        <span>Uniformly applied to all active assembly components</span>
      </div>

      {/* PBR Sliders */}
      <div className="space-y-3">
        {/* Metalness */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-700 font-medium">Metalness</span>
            <span className="font-mono text-black font-bold">{settings.metalness.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            disabled={disabled}
            value={settings.metalness}
            onChange={(e) => updateField('metalness', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black disabled:opacity-50"
          />
        </div>

        {/* Roughness */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-700 font-medium">Roughness</span>
            <span className="font-mono text-black font-bold">{settings.roughness.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            disabled={disabled}
            value={settings.roughness}
            onChange={(e) => updateField('roughness', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black disabled:opacity-50"
          />
        </div>

        {/* Environment Reflection Intensity */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-700 font-medium">Env Reflection (IBL)</span>
            <span className="font-mono text-black font-bold">{settings.envMapIntensity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.05"
            disabled={disabled}
            value={settings.envMapIntensity}
            onChange={(e) => updateField('envMapIntensity', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black disabled:opacity-50"
          />
        </div>

        {/* Opacity */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-700 font-medium">Opacity / Alpha</span>
            <span className="font-mono text-black font-bold">{settings.opacity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.01"
            disabled={disabled}
            value={settings.opacity}
            onChange={(e) => updateField('opacity', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black disabled:opacity-50"
          />
        </div>
      </div>

      {/* Surface & Topology Toggles */}
      <div className="pt-2 border-t border-neutral-200 space-y-2.5">
        <label className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block font-semibold">
          Surface & Topology
        </label>

        {/* Wireframe */}
        <div className="flex items-center justify-between text-xs text-neutral-800">
          <span className="font-medium">Wireframe Mesh</span>
          <button
            disabled={disabled}
            onClick={() => updateField('wireframe', !settings.wireframe)}
            className={`transition ${settings.wireframe ? 'text-black' : 'text-neutral-300'}`}
          >
            {settings.wireframe ? <ToggleRight className="w-6 h-6 stroke-[2.5]" /> : <ToggleLeft className="w-6 h-6" />}
          </button>
        </div>

        {/* Textures */}
        <div className="flex items-center justify-between text-xs text-neutral-800">
          <span className="font-medium">Base Color Textures</span>
          <button
            disabled={disabled}
            onClick={() => updateField('showTextures', !settings.showTextures)}
            className={`transition ${settings.showTextures ? 'text-black' : 'text-neutral-300'}`}
          >
            {settings.showTextures ? <ToggleRight className="w-6 h-6 stroke-[2.5]" /> : <ToggleLeft className="w-6 h-6" />}
          </button>
        </div>

        {/* Shadows */}
        <div className="flex items-center justify-between text-xs text-neutral-800">
          <span className="font-medium">Cast & Receive Shadows</span>
          <button
            disabled={disabled}
            onClick={() => updateField('showShadows', !settings.showShadows)}
            className={`transition ${settings.showShadows ? 'text-black' : 'text-neutral-300'}`}
          >
            {settings.showShadows ? <ToggleRight className="w-6 h-6 stroke-[2.5]" /> : <ToggleLeft className="w-6 h-6" />}
          </button>
        </div>

        {/* Normal Maps */}
        <div className="flex items-center justify-between text-xs text-neutral-800">
          <span className="font-medium">Surface Normal Maps</span>
          <button
            disabled={disabled}
            onClick={() => updateField('showNormals', !settings.showNormals)}
            className={`transition ${settings.showNormals ? 'text-black' : 'text-neutral-300'}`}
          >
            {settings.showNormals ? <ToggleRight className="w-6 h-6 stroke-[2.5]" /> : <ToggleLeft className="w-6 h-6" />}
          </button>
        </div>

        {/* Double-Sided */}
        <div className="flex items-center justify-between text-xs text-neutral-800">
          <span className="font-medium">Double-Sided Polygons</span>
          <button
            disabled={disabled}
            onClick={() => updateField('doubleSided', !settings.doubleSided)}
            className={`transition ${settings.doubleSided ? 'text-black' : 'text-neutral-300'}`}
          >
            {settings.doubleSided ? <ToggleRight className="w-6 h-6 stroke-[2.5]" /> : <ToggleLeft className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
};
