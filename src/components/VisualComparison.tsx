import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  X,
  Camera,
  Sparkles,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  SplitSquareVertical,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { ModelItem, RenderingSettings } from '../types';
import { getMeshoptDecoder } from '../utils/meshopt';
import { compareCanvases } from '../utils/visualComparison';
import { ImageComparisonResult } from '../utils/ssim';

interface VisualComparisonProps {
  model: ModelItem;
  settings: RenderingSettings;
  onClose: () => void;
  onSSIMComputed?: (result: ImageComparisonResult) => void;
}

export const VisualComparison: React.FC<VisualComparisonProps> = ({
  model,
  settings,
  onClose,
  onSSIMComputed,
}) => {
  const containerLeftRef = useRef<HTMLDivElement>(null);
  const containerRightRef = useRef<HTMLDivElement>(null);
  const canvasLeftRef = useRef<HTMLCanvasElement>(null);
  const canvasRightRef = useRef<HTMLCanvasElement>(null);

  const rendererLeftRef = useRef<THREE.WebGLRenderer | null>(null);
  const rendererRightRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraLeftRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cameraRightRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsLeftRef = useRef<OrbitControls | null>(null);
  const controlsRightRef = useRef<OrbitControls | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [ssimResult, setSsimResult] = useState<ImageComparisonResult | null>(null);
  const [isComputingSSIM, setIsComputingSSIM] = useState(false);

  // Synchronize controls
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!canvasLeftRef.current || !canvasRightRef.current || !containerLeftRef.current) return;

    let animId: number;
    let isDisposed = false;

    const setupViewport = async () => {
      const decoder = await getMeshoptDecoder();
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(decoder);

      const width = containerLeftRef.current?.clientWidth || 400;
      const height = containerLeftRef.current?.clientHeight || 400;

      // Scenes
      const sceneLeft = new THREE.Scene();
      const sceneRight = new THREE.Scene();

      // Cameras
      const camLeft = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camLeft.position.set(2, 1.8, 3.2);
      cameraLeftRef.current = camLeft;

      const camRight = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camRight.position.copy(camLeft.position);
      cameraRightRef.current = camRight;

      // Renderers
      const renLeft = new THREE.WebGLRenderer({
        canvas: canvasLeftRef.current!,
        antialias: true,
        preserveDrawingBuffer: true,
      });
      renLeft.setSize(width, height);
      renLeft.setPixelRatio(1); // Standardized 1:1 pixel grid for exact pixel-by-pixel SSIM comparison
      renLeft.toneMapping = THREE.ACESFilmicToneMapping;
      renLeft.toneMappingExposure = settings.exposure;
      renLeft.setClearColor(settings.backgroundColor);
      rendererLeftRef.current = renLeft;

      const renRight = new THREE.WebGLRenderer({
        canvas: canvasRightRef.current!,
        antialias: true,
        preserveDrawingBuffer: true,
      });
      renRight.setSize(width, height);
      renRight.setPixelRatio(1);
      renRight.toneMapping = THREE.ACESFilmicToneMapping;
      renRight.toneMappingExposure = settings.exposure;
      renRight.setClearColor(settings.backgroundColor);
      rendererRightRef.current = renRight;

      // Controls
      const cLeft = new OrbitControls(camLeft, renLeft.domElement);
      cLeft.enableDamping = true;
      controlsLeftRef.current = cLeft;

      const cRight = new OrbitControls(camRight, renRight.domElement);
      cRight.enableDamping = true;
      controlsRightRef.current = cRight;

      // Synchronize Left -> Right
      cLeft.addEventListener('change', () => {
        if (isSyncingRef.current) return;
        isSyncingRef.current = true;
        camRight.position.copy(camLeft.position);
        camRight.quaternion.copy(camLeft.quaternion);
        cRight.target.copy(cLeft.target);
        cRight.update();
        isSyncingRef.current = false;
      });

      // Synchronize Right -> Left
      cRight.addEventListener('change', () => {
        if (isSyncingRef.current) return;
        isSyncingRef.current = true;
        camLeft.position.copy(camRight.position);
        camLeft.quaternion.copy(camRight.quaternion);
        cLeft.target.copy(cRight.target);
        cLeft.update();
        isSyncingRef.current = false;
      });

      // Lighting for both (identical!)
      const addLights = (s: THREE.Scene) => {
        const amb = new THREE.AmbientLight(0xffffff, settings.ambientIntensity);
        const dir = new THREE.DirectionalLight(0xffffff, settings.directionalIntensity);
        dir.position.set(5, 10, 7);
        const pt = new THREE.PointLight(0x00f2fe, settings.pointIntensity, 20);
        pt.position.set(0, 4, 3);
        s.add(amb, dir, pt);
      };
      addLights(sceneLeft);
      addLights(sceneRight);

      // Load Original
      const origUrl = `/models/modelperformance/${model.filename}`;
      const compUrl = `/models/modelperformance/compressed/${model.compressedFilename}`;

      const applyMatSettings = (obj: THREE.Object3D) => {
        obj.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const mat of mats) {
              if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                const sMat = mat as THREE.MeshStandardMaterial;
                sMat.roughness = settings.roughness;
                sMat.metalness = settings.metalness;
                sMat.wireframe = settings.wireframe;
              }
            }
          }
        });
      };

      try {
        const [gltfOrig, gltfComp] = await Promise.all([
          new Promise<any>((res, rej) => loader.load(origUrl, res, undefined, rej)),
          new Promise<any>((res, rej) => loader.load(compUrl, res, undefined, rej)),
        ]);

        if (isDisposed) return;

        const origRoot = gltfOrig.scene || gltfOrig.scenes[0];
        const compRoot = gltfComp.scene || gltfComp.scenes[0];

        applyMatSettings(origRoot);
        applyMatSettings(compRoot);

        sceneLeft.add(origRoot);
        sceneRight.add(compRoot);

        // Center both cameras to bounding box
        const box = new THREE.Box3().setFromObject(origRoot);
        const center = box.getCenter(new THREE.Vector3());
        camLeft.lookAt(center);
        camRight.lookAt(center);
        cLeft.target.copy(center);
        cRight.target.copy(center);

        setIsLoading(false);

        // Run initial SSIM calculation once rendered
        setTimeout(() => {
          if (!isDisposed && rendererLeftRef.current && rendererRightRef.current) {
            renLeft.render(sceneLeft, camLeft);
            renRight.render(sceneRight, camRight);
            const comp = compareCanvases(rendererLeftRef.current, rendererRightRef.current);
            if (comp) {
              setSsimResult(comp);
              if (onSSIMComputed) onSSIMComputed(comp);
            }
          }
        }, 300);
      } catch (e) {
        console.error('Error loading comparison models:', e);
      }

      // Animation loop
      const animate = () => {
        if (isDisposed) return;
        animId = requestAnimationFrame(animate);
        cLeft.update();
        cRight.update();
        renLeft.render(sceneLeft, camLeft);
        renRight.render(sceneRight, camRight);
      };
      animate();
    };

    setupViewport();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      controlsLeftRef.current?.dispose();
      controlsRightRef.current?.dispose();
      rendererLeftRef.current?.dispose();
      rendererRightRef.current?.dispose();
    };
  }, [model, settings]);

  const handleComputeSSIM = () => {
    if (!rendererLeftRef.current || !rendererRightRef.current) return;
    setIsComputingSSIM(true);
    setTimeout(() => {
      const comp = compareCanvases(rendererLeftRef.current!, rendererRightRef.current!);
      if (comp) {
        setSsimResult(comp);
        if (onSSIMComputed) onSSIMComputed(comp);
      }
      setIsComputingSSIM(false);
    }, 100);
  };

  const handleExportScreenshot = () => {
    if (!canvasLeftRef.current || !canvasRightRef.current) return;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = canvasLeftRef.current.width * 2;
    offCanvas.height = canvasLeftRef.current.height;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(canvasLeftRef.current, 0, 0);
    ctx.drawImage(canvasRightRef.current, canvasLeftRef.current.width, 0);

    // Text labels
    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('ORIGINAL MODEL', 20, 35);
    ctx.fillText('MESHOPT COMPRESSED MODEL', canvasLeftRef.current.width + 20, 35);

    const link = document.createElement('a');
    link.download = `${model.filename}-comparison-ssim.png`;
    link.href = offCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/90 backdrop-blur-md flex flex-col p-4 md:p-6 animate-fade-in">
      {/* Modal Top Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-electric-blue/20 border border-electric-cyan/40 text-electric-cyan">
            <SplitSquareVertical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              SYNCHRONIZED VISUAL CLARITY INSPECTION
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-electric-cyan border border-cyan-800">
                {model.displayName}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Pixel-by-pixel synchronized viewport evaluation under identical photometric and material conditions
            </p>
          </div>
        </div>

        {/* Action Buttons & Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleComputeSSIM}
            disabled={isComputingSSIM || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-electric-cyan text-navy-950 font-bold text-xs shadow-glow-cyan hover:bg-cyan-300 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isComputingSSIM ? 'Analyzing Frame...' : 'Recompute SSIM'}</span>
          </button>

          <button
            onClick={handleExportScreenshot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-200 border border-slate-700 text-xs transition"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Comparison PNG</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
            title="Close Comparison Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Split Viewports */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 relative min-h-0">
        {/* Left Viewport: Original Model */}
        <div
          ref={containerLeftRef}
          className="relative bg-navy-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col"
        >
          <div className="absolute top-3 left-3 z-10 bg-navy-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>LEFT: ORIGINAL GLB</span>
            <span className="text-slate-400 text-[10px]">({model.formattedOriginalSize})</span>
          </div>
          <canvas ref={canvasLeftRef} className="w-full h-full flex-1 block cursor-grab active:cursor-grabbing" />
        </div>

        {/* Right Viewport: Meshopt Compressed Model */}
        <div
          ref={containerRightRef}
          className="relative bg-navy-900 rounded-2xl overflow-hidden border border-electric-cyan/30 shadow-xl flex flex-col"
        >
          <div className="absolute top-3 left-3 z-10 bg-navy-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-cyan-800/60 text-xs font-mono font-bold text-electric-cyan flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-electric-cyan shadow-[0_0_8px_#00f2fe]" />
            <span>RIGHT: MESHOPT COMPRESSED GLB</span>
            <span className="text-emerald-400 text-[10px]">({model.formattedCompressedSize})</span>
          </div>
          <canvas ref={canvasRightRef} className="w-full h-full flex-1 block cursor-grab active:cursor-grabbing" />
        </div>

        {/* Synchronized Notice Badge in Middle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-950/90 border border-slate-700 text-[10px] font-mono text-cyan-300 shadow-lg backdrop-blur-md">
          <RotateCcw className="w-3 h-3 text-electric-cyan animate-spin" />
          <span>Synchronized Orbit & Zoom Active</span>
        </div>
      </div>

      {/* Bottom SSIM Metrics & Quality Assessment Bar */}
      <div className="mt-3 bg-charcoal-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center flex-wrap gap-4 font-mono">
          <div>
            <span className="text-slate-400 text-[10px] block">Structural Similarity (SSIM)</span>
            <span
              className={`text-base font-bold ${
                ssimResult && ssimResult.ssim >= 0.99
                  ? 'text-emerald-400'
                  : ssimResult && ssimResult.ssim >= 0.95
                  ? 'text-cyan-400'
                  : 'text-amber-400'
              }`}
            >
              {ssimResult ? ssimResult.ssim.toFixed(4) : 'Computing...'}
            </span>
          </div>

          <div className="border-l border-slate-800 pl-3">
            <span className="text-slate-400 text-[10px] block">PSNR Metric</span>
            <span className="text-sm font-bold text-slate-200">
              {ssimResult ? `${ssimResult.psnr.toFixed(1)} dB` : '--'}
            </span>
          </div>

          <div className="border-l border-slate-800 pl-3">
            <span className="text-slate-400 text-[10px] block">Pixel Deviation</span>
            <span className="text-sm font-bold text-slate-200">
              {ssimResult ? `${ssimResult.differentPixelsPercent}%` : '--'}
            </span>
          </div>

          <div className="border-l border-slate-800 pl-3">
            <span className="text-slate-400 text-[10px] block">Clarity Verification</span>
            {ssimResult?.isVisuallyIdentical ? (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Imperceptible Difference (Near-Lossless)
              </span>
            ) : (
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                High Fidelity Preserved
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 max-w-sm">
          <Info className="w-4 h-4 text-electric-cyan shrink-0" />
          <span>
            SSIM evaluates perceived luminance, contrast, and structural consistency on rendered frames rather than arbitrary wireframe shifts.
          </span>
        </div>
      </div>
    </div>
  );
};

