import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  SunMedium,
  Sun,
  Sparkles,
  Cloud,
  Moon,
  Layers,
  Copy,
} from 'lucide-react';
import { LightConfig, LightingPreset, ModelItem, RenderingSettings } from '../types';
import { hsvToHex, hexToHsv } from '../utils/colorUtils';

interface LightingControlsProps {
  settings: RenderingSettings;
  onChange: (updater: (prev: RenderingSettings) => RenderingSettings) => void;
  disabled?: boolean;
  models?: ModelItem[];
  activeTargetId?: string;
  onSelectTarget?: (targetId: string) => void;
  onApplyToAll?: () => void;
}

export const LightingControls: React.FC<LightingControlsProps> = ({
  settings,
  onChange,
  disabled,
  models = [],
  activeTargetId = 'all',
  onSelectTarget,
  onApplyToAll,
}) => {
  // Track open/collapsed state for each light accordion
  const [openLights, setOpenLights] = useState<Record<string, boolean>>({
    'light-1': true,
    'light-2': true,
    'light-3': true,
  });

  const toggleLightAccordion = (id: string) => {
    setOpenLights((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const lights = settings.lights || [
    {
      id: 'light-1',
      name: 'Light 1',
      enabled: true,
      colorMode: 'HSV',
      hex: '#FF9000',
      hue: 34,
      saturation: 100,
      value: 100,
      intensity: 200,
    },
    {
      id: 'light-2',
      name: 'Light 2',
      enabled: true,
      colorMode: 'HSV',
      hex: '#546AFF',
      hue: 232,
      saturation: 67,
      value: 100,
      intensity: 170,
    },
    {
      id: 'light-3',
      name: 'Light 3',
      enabled: true,
      colorMode: 'HSV',
      hex: '#FFFFFF',
      hue: 0,
      saturation: 0,
      value: 100,
      intensity: 120,
    },
  ];

  const updateLight = (lightId: string, updates: Partial<LightConfig>) => {
    if (disabled) return;
    onChange((prev) => {
      const currentLights = prev.lights || lights;
      const updated = currentLights.map((l) => (l.id === lightId ? { ...l, ...updates } : l));
      return {
        ...prev,
        preset: 'custom',
        lights: updated,
      };
    });
  };

  const handleHsvChange = (
    lightId: string,
    field: 'hue' | 'saturation' | 'value',
    val: number
  ) => {
    const light = lights.find((l) => l.id === lightId);
    if (!light) return;

    const clampedVal =
      field === 'hue'
        ? Math.max(0, Math.min(360, val))
        : Math.max(0, Math.min(100, val));

    const newHue = field === 'hue' ? clampedVal : light.hue;
    const newSat = field === 'saturation' ? clampedVal : light.saturation;
    const newVal = field === 'value' ? clampedVal : light.value;

    const newHex = hsvToHex(newHue, newSat, newVal);
    updateLight(lightId, {
      [field]: clampedVal,
      hex: newHex,
    });
  };

  const handleHexChange = (lightId: string, hexStr: string) => {
    let cleanHex = hexStr.trim();
    if (!cleanHex.startsWith('#')) cleanHex = `#${cleanHex}`;
    const hsv = hexToHsv(cleanHex);
    updateLight(lightId, {
      hex: cleanHex.toUpperCase(),
      hue: hsv.h,
      saturation: hsv.s,
      value: hsv.v,
    });
  };

  const handleIntensityChange = (lightId: string, intensityVal: number) => {
    const clamped = Math.max(0, Math.min(500, intensityVal));
    updateLight(lightId, { intensity: clamped });
  };

  // Find active target display name
  const activeModel = models.find((m) => m.id === activeTargetId);
  const targetLabel = activeModel
    ? `${activeModel.partNumber}: ${activeModel.displayName}`
    : 'All Selected Products (Synchronized)';

  return (
    <div className="space-y-4 text-neutral-900 animate-fade-in">
      {/* Title matching user's image */}
      <div className="border-b border-neutral-200 pb-3">
        <h2 className="text-base font-extrabold tracking-tight text-black flex items-center justify-between">
          <span>Environment & Lighting</span>
        </h2>
        <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
          Multi-source directional key, fill & accent photometrics
        </p>

        {/* Dynamic Target Indicator: Adapts when product components are selected/deselected */}
        {models.length > 0 && onSelectTarget && (
          <div className="mt-2.5 p-2 rounded-xl bg-neutral-100 border border-neutral-200 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-600 font-medium flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-black" />
                Profile Target:
              </span>
              <span className="text-[10px] font-mono font-bold text-black uppercase">
                {activeModel ? activeModel.partNumber : 'Master'}
              </span>
            </div>
            <select
              value={activeTargetId}
              onChange={(e) => onSelectTarget(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded-lg px-2 py-1 text-xs font-semibold text-neutral-900 outline-none focus:border-black"
            >
              <option value="all">★ All Selected Products (Master)</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.partNumber}: {m.displayName} {m.selected ? '✓' : '(hidden)'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Accordion Lights (Light 1, Light 2, Light 3) */}
      <div className="space-y-3">
        {lights.map((light, index) => {
          const isOpen = openLights[light.id] ?? true;
          // Representative accent dot color
          const dotColor = light.hex || '#FF9000';

          return (
            <div
              key={light.id}
              className="bg-neutral-50 border border-neutral-200 rounded-2xl overflow-hidden shadow-sm transition-all"
            >
              {/* Header Bar */}
              <div
                onClick={() => toggleLightAccordion(light.id)}
                className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-100/70 hover:bg-neutral-100 cursor-pointer select-none transition"
              >
                <div className="flex items-center gap-2.5">
                  {/* Colored circular dot */}
                  <span
                    className="w-3 h-3 rounded-full border border-neutral-300 shadow-sm transition-colors"
                    style={{ backgroundColor: dotColor }}
                  />
                  <span className="text-xs font-bold text-neutral-900 tracking-wide">
                    {light.name || `Light ${index + 1}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-semibold text-neutral-600">
                    {light.hex}
                  </span>
                  <button className="text-neutral-500 hover:text-black">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Accordion Body */}
              {isOpen && (
                <div className="p-3.5 space-y-3 bg-white">
                  {/* Top Row: Mode Dropdown & Hex Input */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Dropdown: HSV */}
                    <div className="relative">
                      <select
                        disabled={disabled}
                        value={light.colorMode || 'HSV'}
                        onChange={(e) =>
                          updateLight(light.id, {
                            colorMode: e.target.value as 'HSV' | 'RGB' | 'HEX',
                          })
                        }
                        className="w-full appearance-none bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-800 outline-none focus:border-black pr-7 cursor-pointer"
                      >
                        <option value="HSV">HSV</option>
                        <option value="RGB">RGB</option>
                        <option value="HEX">HEX</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Hex Code Input Box */}
                    <input
                      type="text"
                      disabled={disabled}
                      value={light.hex}
                      onChange={(e) => handleHexChange(light.id, e.target.value)}
                      placeholder="#FF9000"
                      maxLength={7}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-center text-neutral-900 outline-none focus:border-black uppercase"
                    />
                  </div>

                  {/* 1. Hue Slider */}
                  <div className="space-y-1">
                    <span className="text-xs text-neutral-700 font-medium block">Hue</span>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="360"
                          disabled={disabled}
                          value={light.hue}
                          onChange={(e) =>
                            handleHsvChange(light.id, 'hue', parseFloat(e.target.value) || 0)
                          }
                          style={{
                            background:
                              'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                          }}
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="360"
                        disabled={disabled}
                        value={light.hue}
                        onChange={(e) =>
                          handleHsvChange(light.id, 'hue', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 px-2 py-1 bg-white border border-neutral-300 rounded-lg text-xs text-right font-mono font-bold text-neutral-900 outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  {/* 2. Saturation Slider */}
                  <div className="space-y-1">
                    <span className="text-xs text-neutral-700 font-medium block">Saturation</span>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          disabled={disabled}
                          value={light.saturation}
                          onChange={(e) =>
                            handleHsvChange(light.id, 'saturation', parseFloat(e.target.value) || 0)
                          }
                          style={{
                            background: `linear-gradient(to right, #ffffff, ${hsvToHex(
                              light.hue,
                              100,
                              light.value
                            )})`,
                          }}
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={disabled}
                        value={light.saturation}
                        onChange={(e) =>
                          handleHsvChange(light.id, 'saturation', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 px-2 py-1 bg-white border border-neutral-300 rounded-lg text-xs text-right font-mono font-bold text-neutral-900 outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  {/* 3. Value (Brightness) Slider */}
                  <div className="space-y-1">
                    <span className="text-xs text-neutral-700 font-medium block">Value</span>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          disabled={disabled}
                          value={light.value}
                          onChange={(e) =>
                            handleHsvChange(light.id, 'value', parseFloat(e.target.value) || 0)
                          }
                          style={{
                            background: `linear-gradient(to right, #000000, ${hsvToHex(
                              light.hue,
                              light.saturation,
                              100
                            )})`,
                          }}
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={disabled}
                        value={light.value}
                        onChange={(e) =>
                          handleHsvChange(light.id, 'value', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 px-2 py-1 bg-white border border-neutral-300 rounded-lg text-xs text-right font-mono font-bold text-neutral-900 outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  {/* 4. Intensity Slider */}
                  <div className="space-y-1">
                    <span className="text-xs text-neutral-700 font-medium block">Intensity</span>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="500"
                          disabled={disabled}
                          value={light.intensity}
                          onChange={(e) =>
                            handleIntensityChange(light.id, parseFloat(e.target.value) || 0)
                          }
                          style={{
                            background:
                              'linear-gradient(to right, #3b82f6 0%, #1d4ed8 100%)',
                          }}
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        disabled={disabled}
                        value={light.intensity}
                        onChange={(e) =>
                          handleIntensityChange(light.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-16 px-2 py-1 bg-white border border-neutral-300 rounded-lg text-xs text-right font-mono font-bold text-neutral-900 outline-none focus:border-black"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global Photometrics & Presets Section */}
      <div className="pt-3 border-t border-neutral-200 space-y-3">
        <label className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block font-semibold">
          Master Photometrics
        </label>

        {/* Ambient Light */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-700 font-medium">Ambient Base Light</span>
            <span className="font-mono text-black font-bold">
              {settings.ambientIntensity.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.05"
            disabled={disabled}
            value={settings.ambientIntensity}
            onChange={(e) =>
              onChange((p) => ({ ...p, ambientIntensity: parseFloat(e.target.value) }))
            }
            className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black disabled:opacity-50"
          />
        </div>

        {/* Camera Exposure */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-700 font-medium">Camera Exposure</span>
            <span className="font-mono text-black font-bold">
              {settings.exposure.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3"
            step="0.05"
            disabled={disabled}
            value={settings.exposure}
            onChange={(e) =>
              onChange((p) => ({ ...p, exposure: parseFloat(e.target.value) }))
            }
            className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
};
