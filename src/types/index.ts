export interface ModelItem {
  id: string;
  filename: string;
  displayName: string;
  partNumber: string;
  category: string;
  description: string;
  originalSizeBytes: number;
  formattedOriginalSize: string;
  compressedSizeBytes?: number;
  formattedCompressedSize?: string;
  isCompressed: boolean;
  hasCompressedVariant: boolean;
  compressedFilename?: string;
  loadingStatus: 'idle' | 'loading' | 'loaded' | 'error';
  errorMessage?: string;
  selected: boolean;
  color?: string;
  meshCount?: number;
  vertexCount?: number;
  indicesCount?: number;
  materialCount?: number;
  textureCount?: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  visibleDefault?: boolean;
}

export type LightingPreset = 'studio' | 'natural' | 'bright' | 'soft' | 'low-light' | 'custom';
export type BackgroundTheme = 'dark' | 'light' | 'grey' | 'custom';

export interface LightConfig {
  id: string;
  name: string;
  enabled: boolean;
  colorMode: 'HSV' | 'RGB' | 'HEX';
  hex: string;
  hue: number;        // 0 - 360
  saturation: number; // 0 - 100
  value: number;      // 0 - 100
  intensity: number;  // 0 - 500
}

export interface RenderingSettings {
  ambientIntensity: number;
  directionalIntensity: number;
  pointIntensity: number;
  envIntensity: number;
  exposure: number;
  preset: LightingPreset;
  lights: LightConfig[];
  metalness: number;
  roughness: number;
  envMapIntensity: number;
  opacity: number;
  wireframe: boolean;
  showTextures: boolean;
  showShadows: boolean;
  showNormals: boolean;
  doubleSided: boolean;
  backgroundColor: string;
  backgroundTheme: BackgroundTheme;
  orbitControlsEnabled: boolean;
  rotationSpeed: number;
  zoomSpeed: number;
  panSpeed: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
  locked: boolean;
}

export interface CompressionSettings {
  level: 'medium' | 'high';
  reorder: boolean;
  quantize: boolean;
}

export interface BenchmarkRecord {
  id: string;
  timestamp: number;
  modelId: string;
  modelName: string;
  variant: 'Original' | 'Meshopt';
  fileSize: number;
  reductionPercentage: number;
  compressionTimeMs: number;
  decompressionTimeMs: number;
  totalLoadTimeMs: number;
  parsingTimeMs: number;
  downloadTimeMs: number;
  firstFrameTimeMs: number;
  heapUsedMB: number | null;
  heapLimitMB: number | null;
  gpuMemoryMB: number;
  fps: number;
  visualFidelitySSIM: number;
  deviceInfo: {
    browser: string;
    platform: string;
    viewport: string;
    renderer: string;
  };
  runs?: {
    runIndex: number;
    loadTimeMs: number;
    decodeTimeMs: number;
  }[];
  stats?: {
    minLoadTimeMs: number;
    maxLoadTimeMs: number;
    avgLoadTimeMs: number;
    medianLoadTimeMs: number;
  };
}

export interface MemorySample {
  timestamp: number;
  timeLabel: string;
  heapUsedMB: number | null;
  fps: number;
  gpuMemoryMB: number;
  event?: string;
}

export interface Recommendation {
  recommendedVariant: 'Original' | 'Meshopt';
  compositeScore: number;
  fileSizeSavedMB: number;
  fileSizeReductionPercent: number;
  loadingTimeImprovementPercent: number;
  visualFidelitySSIM: number;
  reason: string;
  breakdown: {
    fidelityScore: number;
    sizeScore: number;
    speedScore: number;
    fpsScore: number;
  };
}

export interface AssemblyManifest {
  productName: string;
  description: string;
  components: Record<string, {
    displayName: string;
    partNumber: string;
    category: string;
    description: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    visibleDefault?: boolean;
  }>;
}

export interface InspectionNote {
  id: string;
  timestamp: number;
  modelId: string;
  author: string;
  text: string;
  visualRating: number;
}
