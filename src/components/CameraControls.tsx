import React from 'react';
import { ToggleLeft, ToggleRight, RotateCcw, RotateCw } from 'lucide-react';
import { BackgroundTheme, RenderingSettings } from '../types';

interface CameraControlsProps {
  settings: RenderingSettings;
  onChange: (updater: (prev: RenderingSettings) => RenderingSettings) => void;
  onResetAllSettings: () => void;
  disabled?: boolean;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  settings,
  onChange,
  onResetAllSettings,
  disabled,
}) => {
  const updateField = <K extends keyof RenderingSettings>(field: K, value: RenderingSettings[K]) => {
    if (disabled) return;
    onChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const setBackgroundTheme = (theme: BackgroundTheme, color: string) => {
    if (disabled) return;
    onChange((prev) => ({
      ...prev,
      backgroundTheme: theme,
      backgroundColor: color,
    }));
  };

  return (
    <div className="space-y-4 text-neutral-900">
      {/* Orbit Navigation Options */}
      <div className="space-y-3">
        <label className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block font-semibold">
          Viewport & Camera Navigation
        </label>

        {/* Enable / Disable Controls */}
        <div className="flex items-center justify-between text-xs text-neutral-800">
          <span className="font-medium">Enable Orbit Controls</span>
          <button
            disabled={disabled}
            onClick={() => updateField('orbitControlsEnabled', !settings.orbitControlsEnabled)}
            className={`transition ${settings.orbitControlsEnabled ? 'text-black' : 'text-neutral-300'}`}
          >
            {settings.orbitControlsEnabled ? <ToggleRight className="w-6 h-6 stroke-[2.5]" /> : <ToggleLeft className="w-6 h-6" />}
          </button>
        </div>

        {/* Auto-Rotation Toggle */}
        <div className="flex items-center justify-between text-xs text-neutral-800">
          <span className="flex items-center gap-1.5 font-medium">
            <RotateCw className="w-3.5 h-3.5 text-black" />
            Turntable Auto-Rotation
          </span>
          <button
            disabled={disabled}
            onClick={() => updateField('autoRotate', !settings.autoRotate)}
            className={`transition ${settings.autoRotate ? 'text-black' : 'text-neutral-300'}`}
          >
            {settings.autoRotate ? <ToggleRight className="w-6 h-6 stroke-[2.5]" /> : <ToggleLeft className="w-6 h-6" />}
          </button>
        </div>

        {/* Auto Rotate Speed */}
        {settings.autoRotate && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-500 text-[11px]">Auto-Rotate Speed</span>
              <span className="font-mono text-black font-bold">{settings.autoRotateSpeed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="6.0"
              step="0.2"
              disabled={disabled}
              value={settings.autoRotateSpeed}
              onChange={(e) => updateField('autoRotateSpeed', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black disabled:opacity-50"
            />
          </div>
        )}

        {/* Rotation Sensitivity */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-700 font-medium">Rotation Sensitivity</span>
            <span className="font-mono text-black font-bold">{settings.rotationSpeed.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            disabled={disabled}
            value={settings.rotationSpeed}
            onChange={(e) => updateField('rotationSpeed', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black disabled:opacity-50"
          />
        </div>

        {/* Zoom Speed */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-700 font-medium">Zoom Sensitivity</span>
            <span className="font-mono text-black font-bold">{settings.zoomSpeed.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            disabled={disabled}
            value={settings.zoomSpeed}
            onChange={(e) => updateField('zoomSpeed', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black disabled:opacity-50"
          />
        </div>

        {/* Pan Speed */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-700 font-medium">Pan Sensitivity</span>
            <span className="font-mono text-black font-bold">{settings.panSpeed.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            disabled={disabled}
            value={settings.panSpeed}
            onChange={(e) => updateField('panSpeed', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black disabled:opacity-50"
          />
        </div>
      </div>

      {/* Viewport Background Controls: Pure White & Shadow Evaluation */}
      <div className="pt-3 border-t border-neutral-200 space-y-2.5">
        <label className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block font-semibold">
          Viewport Background & Studio Floor
        </label>
        <div className="grid grid-cols-4 gap-2">
          {/* Pure White (Default Studio) */}
          <button
            disabled={disabled}
            onClick={() => setBackgroundTheme('light', '#ffffff')}
            className={`p-2 rounded-xl text-center border text-xs font-medium transition ${
              settings.backgroundColor === '#ffffff'
                ? 'border-black bg-neutral-100 text-black font-bold shadow-sm'
                : 'border-neutral-200 bg-white text-neutral-600 hover:text-black'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white border border-neutral-400 mx-auto mb-1 shadow-inner" />
            <span>White</span>
          </button>

          {/* Soft Grey */}
          <button
            disabled={disabled}
            onClick={() => setBackgroundTheme('grey', '#f1f5f9')}
            className={`p-2 rounded-xl text-center border text-xs font-medium transition ${
              settings.backgroundColor === '#f1f5f9'
                ? 'border-black bg-neutral-100 text-black font-bold shadow-sm'
                : 'border-neutral-200 bg-white text-neutral-600 hover:text-black'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-[#f1f5f9] border border-neutral-300 mx-auto mb-1" />
            <span>Light</span>
          </button>

          {/* Studio Charcoal */}
          <button
            disabled={disabled}
            onClick={() => setBackgroundTheme('dark', '#1a1a1a')}
            className={`p-2 rounded-xl text-center border text-xs font-medium transition ${
              settings.backgroundColor === '#1a1a1a'
                ? 'border-black bg-neutral-100 text-black font-bold shadow-sm'
                : 'border-neutral-200 bg-white text-neutral-600 hover:text-black'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-[#1a1a1a] border border-neutral-600 mx-auto mb-1" />
            <span>Dark</span>
          </button>

          {/* Custom Color */}
          <label
            className={`p-2 rounded-xl text-center border text-xs font-medium transition cursor-pointer flex flex-col items-center justify-center ${
              settings.backgroundTheme === 'custom'
                ? 'border-black bg-neutral-100 text-black font-bold shadow-sm'
                : 'border-neutral-200 bg-white text-neutral-600 hover:text-black'
            }`}
          >
            <input
              type="color"
              disabled={disabled}
              value={settings.backgroundColor}
              onChange={(e) => setBackgroundTheme('custom', e.target.value)}
              className="w-4 h-4 rounded-full border-0 p-0 mb-1 cursor-pointer"
            />
            <span>Custom</span>
          </label>
        </div>
      </div>

      {/* Reset All Settings Button */}
      <div className="pt-3 border-t border-neutral-200">
        <button
          onClick={onResetAllSettings}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 text-xs font-semibold transition"
          title="Restore standard default rendering & material settings"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET ALL SETTINGS</span>
        </button>
      </div>
    </div>
  );
};
