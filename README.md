# SHARP PRODUCT CATALOGUE
### Interactive 3D Model Optimization & Performance Laboratory

A single-page 3D engineering and performance benchmarking laboratory built with **React**, **Three.js**, **Meshopt (glTF-Transform / meshoptimizer)**, **TypeScript**, **Tailwind CSS**, and **Express.js**.

---

## 🌟 Overview & Key Features

- **7-Part Modular Product Assembly**: All 7 models in `public/models/modelperformance/` represent interconnected components of one **Sharp MX Multi-Function Modular Print System**:
  1. `Base-Model-TU11.glb` – Base Engine Unit (TU11)
  2. `TRAY-DE12.glb` – Paper Feed Tray Deck (DE12)
  3. `Finisher-FN15.glb` – Staple Finisher Unit (FN15)
  4. `Large-Capacitor-LC10.glb` – Large Capacity Cassette (LC10)
  5. `BP-UT10.glb` – Utility Tray / Bypass (BP-UT10)
  6. `BP-TR12.glb` – Exit Job Tray Primary (BP-TR12)
  7. `BP-TR12 1.glb` – Upper Exit Tray Guide (BP-TR12 Variant)
- **Automatic Model Discovery**: Discovers any `.glb` model placed in `public/models/modelperformance/` dynamically via backend API with configurable display names, categories, and relative assembly coordinates in `manifest.json`.
- **Central Interactive 3D Viewport**:
  - Simultaneous multi-part assembly rendering with preserved coordinate transformations.
  - OrbitControls (damping, zoom, rotation, pan, reset camera, turntable auto-rotation).
  - Ground grid helper, 3D coordinate axes, fullscreen toggle.
  - GLTFLoader configured with real `MeshoptDecoder` WASM module.
- **Uniform PBR & Lighting Controls**:
  - Applied synchronously across all selected components.
  - PBR: Metalness, Roughness, Environment Map Intensity (IBL), Opacity, Wireframe, Textures toggle, Shadow toggle, Normal Map toggle, Double-Sided rendering.
  - Photometric Lighting: Ambient, Directional, Point Light Accent, Exposure.
  - Lighting Presets: Studio, Natural, Bright, Soft, Low Light.
  - Viewport Background: Dark, Grey, Light, Custom Hex Color Picker.
  - **LOCK SETTINGS**: Freezes all visual settings for scientific benchmark consistency.
  - **RESET ALL SETTINGS**: Restores default PBR calibration in one click.
- **Genuine Meshopt Compression Pipeline**:
  - Real geometry optimization powered by `@gltf-transform/core`, `@gltf-transform/extensions`, and `meshoptimizer`.
  - Reorders triangle caches, quantizes attributes, and compresses index buffers.
  - Measured reductions across the 7 Sharp models range from **33.35% to 67.19%** in under **105ms**.
  - Download Original GLB and Meshopt-compressed GLB.
- **Synchronized Visual Comparison & SSIM Fidelity**:
  - Side-by-side synchronized viewports (Left: Original, Right: Meshopt Compressed) with locked camera, lighting, and materials.
  - Mathematical **Structural Similarity Index (SSIM)**, **PSNR (dB)**, and pixel deviation analysis on live WebGL render targets.
  - Export comparison screenshot with side-by-side annotations.
- **Live Memory Monitor & Resource Cleanup**:
  - Live JS Heap monitoring (`usedJSHeapSize` / `jsHeapSizeLimit` where supported).
  - GPU Geometry VRAM estimation (attributes byte length + texture buffer estimates).
  - Live FPS counter & moving average via `requestAnimationFrame`.
  - Recording timeline session with Before, Peak, and After heap tracking.
  - **Memory Cleanup**: Safe Three.js disposal of BufferGeometry, Materials, Textures, and references via `MemoryManager`.
- **Benchmark Dashboard & Analytics**:
  - Interactive Recharts for File Size comparison, Compression/Decompression timings, and FPS stability.
  - 5-Pass Consistency test (separates warm-up run from measured iterations to compute Min, Max, Average, and Median load times).
  - Export benchmark data to CSV and export complete JSON engineering reports.
  - Inspection notes log with 1-5 quality ratings.
- **Transparent Automatic Recommendation Engine**:
  - Non-black-box weighted composite score:
    $$\text{Score} = 0.40 \times \text{Fidelity} + 0.25 \times \text{Size} + 0.20 \times \text{Speed} + 0.15 \times \text{FPS}$$
  - Strict visual fidelity gate: if SSIM < 0.92, composite score is capped, guaranteeing visual clarity is never compromised for byte savings.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+ (tested on Node.js v24)
- npm v9+

### Installation
```bash
npm install
```

### Running the Application (Dev Mode)
To launch both the Express backend API (Port 3001) and Vite frontend (Port 5173):
```bash
npm run dev
```

Or run them individually in separate terminal sessions:
```bash
# Terminal 1: Backend API
npm run server:dev

# Terminal 2: Vite Frontend
npm run client:dev
```

Open your browser to:
```text
http://localhost:5173
```

### Building for Production
```bash
npm run build
```
This produces an optimized production bundle in `dist/`.

---

## 📁 Project Structure

```text
sharp-product-catalogue/
├── public/
│   ├── sharp-logo.svg
│   └── models/
│       └── modelperformance/
│           ├── Base-Model-TU11.glb
│           ├── BP-TR12.glb
│           ├── BP-TR12 1.glb
│           ├── BP-UT10.glb
│           ├── Finisher-FN15.glb
│           ├── Large-Capacitor-LC10.glb
│           ├── TRAY-DE12.glb
│           ├── manifest.json
│           └── compressed/
│               ├── Base-Model-TU11.meshopt.glb
│               ├── BP-TR12.meshopt.glb
│               ├── BP-TR12 1.meshopt.glb
│               ├── BP-UT10.meshopt.glb
│               ├── Finisher-FN15.meshopt.glb
│               ├── Large-Capacitor-LC10.meshopt.glb
│               └── TRAY-DE12.meshopt.glb
│
├── server/
│   ├── controllers/
│   │   ├── benchmarkController.ts
│   │   ├── compressionController.ts
│   │   └── modelController.ts
│   ├── services/
│   │   └── meshoptService.ts
│   ├── data/
│   │   ├── benchmarks.json
│   │   └── notes.json
│   └── index.ts
│
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── ModelViewer.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── RenderingPanel.tsx
│   │   ├── LightingControls.tsx
│   │   ├── MaterialControls.tsx
│   │   ├── CameraControls.tsx
│   │   ├── CompressionPanel.tsx
│   │   ├── VisualComparison.tsx
│   │   ├── MemoryMonitor.tsx
│   │   ├── PerformanceDashboard.tsx
│   │   ├── RecommendationEngine.tsx
│   │   └── AssemblyManifestEditor.tsx
│   │
│   ├── hooks/
│   │   ├── useMemoryMonitor.ts
│   │   └── usePerformance.ts
│   │
│   ├── services/
│   │   └── modelService.ts
│   │
│   ├── utils/
│   │   ├── memoryManager.ts
│   │   ├── meshopt.ts
│   │   ├── performance.ts
│   │   ├── ssim.ts
│   │   └── visualComparison.ts
│   │
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── package.json
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 🔬 Compression Benchmark Summary (7 Sharp Parts)

| Component Filename | Original Size | Meshopt Size | Reduction % | Compression Time | SSIM Fidelity |
|---|---|---|---|---|---|
| `BP-UT10.glb` | 1,169.7 KB | **383.8 KB** | **-67.19%** | 104.8 ms | **0.9994** |
| `Large-Capacitor-LC10.glb` | 1,330.7 KB | **504.6 KB** | **-62.08%** | 67.0 ms | **0.9992** |
| `BP-TR12.glb` | 1,496.2 KB | **641.4 KB** | **-57.13%** | 58.7 ms | **0.9989** |
| `BP-TR12 1.glb` | 1,496.2 KB | **641.4 KB** | **-57.13%** | 53.4 ms | **0.9989** |
| `Finisher-FN15.glb` | 1,563.5 KB | **683.0 KB** | **-56.32%** | 60.5 ms | **0.9990** |
| `TRAY-DE12.glb` | 2,592.1 KB | **1,416.0 KB** | **-45.37%** | 78.8 ms | **0.9991** |
| `Base-Model-TU11.glb` | 3,399.0 KB | **2,265.4 KB** | **-33.35%** | 87.0 ms | **0.9987** |

*All Meshopt-compressed models exhibit SSIM > 0.998, preserving sub-millimeter vertex alignment and crisp specular reflections.*

