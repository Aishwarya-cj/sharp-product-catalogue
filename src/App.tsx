import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ModelViewer } from './components/ModelViewer';
import { ModelSelector } from './components/ModelSelector';
import { RenderingPanel } from './components/RenderingPanel';
import { LightConfig, ModelItem, RenderingSettings } from './types';
import { fetchDiscoveredModels } from './services/modelService';

const DEFAULT_LIGHTS: LightConfig[] = [
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
    hex: '#000000',
    hue: 0,
    saturation: 0,
    value: 0,
    intensity: 100,
  },
];

const DEFAULT_RENDERING_SETTINGS: RenderingSettings = {
  ambientIntensity: 0.9,
  directionalIntensity: 1.8,
  pointIntensity: 0.8,
  envIntensity: 1.1,
  exposure: 1.0,
  preset: 'studio',
  lights: DEFAULT_LIGHTS,
  metalness: 0.25,
  roughness: 0.45,
  envMapIntensity: 1.0,
  opacity: 1.0,
  wireframe: false,
  showTextures: true,
  showShadows: true,
  showNormals: true,
  doubleSided: true,
  backgroundColor: '#ffffff',
  backgroundTheme: 'light',
  orbitControlsEnabled: true,
  rotationSpeed: 1.0,
  zoomSpeed: 1.0,
  panSpeed: 1.0,
  autoRotate: false,
  autoRotateSpeed: 1.5,
  locked: false,
};

export const App: React.FC = () => {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [renderingSettings, setRenderingSettings] = useState<RenderingSettings>(DEFAULT_RENDERING_SETTINGS);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Per-component lighting profiles: maps modelId -> LightConfig[]
  const [lightingProfiles, setLightingProfiles] = useState<Record<string, LightConfig[]>>({});
  const [activeLightingTarget, setActiveLightingTarget] = useState<string>('all');

  // Load models on mount (all 7 parts selected by default for complete assembly display)
  useEffect(() => {
    fetchDiscoveredModels()
      .then((data) => {
        const loadedModels = data.models.map((m) => ({ ...m, selected: true }));
        setModels(loadedModels);

        // Initialize unique default lighting profiles for each of the 7 parts
        const initialProfiles: Record<string, LightConfig[]> = {
          all: JSON.parse(JSON.stringify(DEFAULT_LIGHTS)),
        };

        loadedModels.forEach((m, idx) => {
          const copy = JSON.parse(JSON.stringify(DEFAULT_LIGHTS)) as LightConfig[];
          if (idx % 2 === 1) {
            copy[0] = { ...copy[0], hex: '#E0F2FE', hue: 204, saturation: 12, value: 100, intensity: 220 };
            copy[1] = { ...copy[1], hex: '#38BDF8', hue: 199, saturation: 77, value: 97, intensity: 150 };
          } else if (idx === 2) {
            copy[0] = { ...copy[0], hex: '#FFFFFF', hue: 0, saturation: 0, value: 100, intensity: 240 };
            copy[1] = { ...copy[1], hex: '#6366F1', hue: 239, saturation: 59, value: 95, intensity: 180 };
          }
          initialProfiles[m.id] = copy;
        });

        setLightingProfiles(initialProfiles);
        if (loadedModels.length > 0) {
          setActiveLightingTarget(loadedModels[0].id);
          setRenderingSettings((prev) => ({
            ...prev,
            lights: initialProfiles[loadedModels[0].id] || DEFAULT_LIGHTS,
          }));
        }
      })
      .catch((err) => {
        console.error('Failed to load models:', err);
      });
  }, []);

  // When a product component is selected/deselected or clicked:
  // Dynamically update the lighting profile to match the selected product!
  const handleToggleSelect = (modelId: string) => {
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, selected: !m.selected } : m))
    );

    // Switch lighting target to this product and activate its custom lighting profile
    setActiveLightingTarget(modelId);
    if (lightingProfiles[modelId]) {
      setRenderingSettings((prev) => ({
        ...prev,
        lights: lightingProfiles[modelId],
      }));
    }
  };

  // Switch lighting target manually from the dropdown
  const handleSelectLightingTarget = (targetId: string) => {
    setActiveLightingTarget(targetId);
    if (lightingProfiles[targetId]) {
      setRenderingSettings((prev) => ({
        ...prev,
        lights: lightingProfiles[targetId],
      }));
    }
  };

  // When the user adjusts lights in the UI, persist to active profile
  const handleUpdateRenderingSettings = (
    updater: (prev: RenderingSettings) => RenderingSettings
  ) => {
    setRenderingSettings((prev) => {
      const next = updater(prev);
      if (next.lights && activeLightingTarget) {
        setLightingProfiles((profiles) => ({
          ...profiles,
          [activeLightingTarget]: next.lights,
        }));
      }
      return next;
    });
  };

  // Copy current light configuration across all components
  const handleApplyToAll = () => {
    const currentLights = renderingSettings.lights;
    setLightingProfiles((prev) => {
      const updated: Record<string, LightConfig[]> = { ...prev, all: currentLights };
      models.forEach((m) => {
        updated[m.id] = JSON.parse(JSON.stringify(currentLights));
      });
      return updated;
    });
  };

  // Select All
  const handleSelectAll = () => {
    setModels((prev) => prev.map((m) => ({ ...m, selected: true })));
    setActiveLightingTarget('all');
    if (lightingProfiles['all']) {
      setRenderingSettings((prev) => ({
        ...prev,
        lights: lightingProfiles['all'],
      }));
    }
  };

  // Deselect All
  const handleDeselectAll = () => {
    setModels((prev) => prev.map((m) => ({ ...m, selected: false })));
  };

  // Full Reset to Original Model State
  const handleResetToOriginal = () => {
    // 1. Restore all 7 product components to selected (original complete product assembly)
    setModels((prev) => prev.map((m) => ({ ...m, selected: true })));

    // 2. Restore default lighting & PBR rendering configuration
    setRenderingSettings(JSON.parse(JSON.stringify(DEFAULT_RENDERING_SETTINGS)));

    // 3. Reset lighting target to master
    setActiveLightingTarget('all');

    // 4. Trigger camera viewpoint reset back to original coordinates in ModelViewer
    setResetTrigger((prev) => prev + 1);
  };

  // Reset rendering settings only
  const handleResetAllSettings = () => {
    setRenderingSettings(DEFAULT_RENDERING_SETTINGS);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      {/* 1. Header with Reset to Original */}
      <Header
        settings={renderingSettings}
        onUpdateSettings={handleUpdateRenderingSettings}
        selectedCount={models.filter((m) => m.selected).length}
        totalModels={models.length}
        onResetToOriginal={handleResetToOriginal}
      />

      {/* Main Layout: Aligned Central 3D Viewer & Rightmost Controls */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto p-4 md:p-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[580px] lg:h-[620px] xl:h-[650px]">
          {/* Central 3D Product Viewer (8 cols on lg, 9 on xl) */}
          <div className="lg:col-span-8 xl:col-span-9 h-full flex flex-col">
            <ModelViewer
              models={models}
              settings={renderingSettings}
              resetTrigger={resetTrigger}
            />
          </div>

          {/* Rightmost Rendering & Material Controls (4 cols on lg, 3 on xl) */}
          <div className="lg:col-span-4 xl:col-span-3 h-full">
            <RenderingPanel
              settings={renderingSettings}
              onUpdateSettings={handleUpdateRenderingSettings}
              onResetAllSettings={handleResetAllSettings}
              models={models}
              activeTargetId={activeLightingTarget}
              onSelectTarget={handleSelectLightingTarget}
              onApplyToAll={handleApplyToAll}
            />
          </div>
        </div>

        {/* Bottom Area: Product Components Selector (Aligned across 7 columns) */}
        <div className="w-full">
          <ModelSelector
            models={models}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onResetToOriginal={handleResetToOriginal}
          />
        </div>
      </main>

      {/* Clean Studio White Footer */}
      <footer className="bg-white border-t border-neutral-200 py-3.5 px-6 text-center text-xs text-neutral-500 font-mono">
        SHARP PRODUCT CATALOGUE | 3D Interactive Studio © 2026
      </footer>
    </div>
  );
};

export default App;
