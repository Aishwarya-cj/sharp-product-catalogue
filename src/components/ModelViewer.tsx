import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Grid,
  Compass,
  Eye,
  Loader2,
} from 'lucide-react';
import { ModelItem, RenderingSettings } from '../types';
import { getMeshoptDecoder } from '../utils/meshopt';

interface ModelViewerProps {
  models: ModelItem[];
  settings: RenderingSettings;
  useCompressedVariant?: boolean;
  resetTrigger?: number;
}

export const ModelViewer: React.FC<ModelViewerProps> = ({
  models,
  settings,
  useCompressedVariant = false,
  resetTrigger = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const lightsRef = useRef<{
    ambient: THREE.AmbientLight;
    directional: THREE.DirectionalLight;
    directionalBack: THREE.DirectionalLight;
    point: THREE.PointLight;
  } | null>(null);

  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
  const shadowPlaneRef = useRef<THREE.Mesh | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);

  // Cache loaded 3D models in memory so switching is instantaneous with zero reload glitches
  const modelCacheRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const hasInitializedCameraRef = useRef(false);

  // UI state
  const [loadingCount, setLoadingCount] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const selectedModels = models.filter((m) => m.selected);
  const selectedIdsStr = selectedModels.map((m) => m.id).sort().join(',');

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.8, 1.8, 2.6);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = settings.exposure;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(settings.backgroundColor || '#ffffff');
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.maxDistance = 25;
    controls.minDistance = 0.3;
    controls.target.set(0.42, 0.62, 0.0);
    controls.update();
    controlsRef.current = controls;

    // Root group for assembled product parts
    const rootGroup = new THREE.Group();
    rootGroup.name = 'productAssemblyRoot';
    scene.add(rootGroup);
    rootGroupRef.current = rootGroup;

    // Ground Shadow Catcher Plane: Catches realistic contact shadows on the white floor!
    const shadowGeo = new THREE.PlaneGeometry(25, 25);
    const shadowMat = new THREE.ShadowMaterial({
      opacity: 0.22,
      color: 0x000000,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0.42, -0.005, 0.0);
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);
    shadowPlaneRef.current = shadowPlane;

    // Subtle Studio Ground Grid
    const grid = new THREE.GridHelper(10, 20, 0xcccccc, 0xeeeeee);
    grid.position.set(0.42, -0.01, 0.0);
    scene.add(grid);
    gridHelperRef.current = grid;

    const axes = new THREE.AxesHelper(1.2);
    axes.position.set(0.42, 0, 0);
    axes.visible = false;
    scene.add(axes);
    axesHelperRef.current = axes;

    // Studio Lights
    const ambient = new THREE.AmbientLight(0xffffff, settings.ambientIntensity);
    scene.add(ambient);

    // Primary Key Light with Soft Contact Shadows
    const dirLight = new THREE.DirectionalLight(0xffffff, settings.directionalIntensity);
    dirLight.position.set(4.5, 9.0, 5.5);
    dirLight.target.position.set(0.42, 0.6, 0.0);
    scene.add(dirLight.target);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.camera.left = -2.5;
    dirLight.shadow.camera.right = 2.5;
    dirLight.shadow.camera.top = 2.5;
    dirLight.shadow.camera.bottom = -2.5;
    dirLight.shadow.bias = -0.0003;
    scene.add(dirLight);

    // Fill Light
    const dirLightBack = new THREE.DirectionalLight(0xf1f5f9, settings.directionalIntensity * 0.45);
    dirLightBack.position.set(-4, 3, -5);
    scene.add(dirLightBack);

    // Overhead Accent Light
    const point = new THREE.PointLight(0xffffff, settings.pointIntensity, 15);
    point.position.set(0.42, 3.5, 2.0);
    scene.add(point);

    lightsRef.current = {
      ambient,
      directional: dirLight,
      directionalBack: dirLightBack,
      point,
    };

    // Environment Lighting (procedural clean neutral white studio reflection map)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    const envLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    envLight1.position.set(2, 4, 2);
    const envLight2 = new THREE.DirectionalLight(0xdddddd, 1.2);
    envLight2.position.set(-2, -3, -2);
    envScene.add(envLight1, envLight2, new THREE.AmbientLight(0xaaaaaa, 1.0));
    const renderTarget = pmremGenerator.fromScene(envScene);
    scene.environment = renderTarget.texture;
    pmremGenerator.dispose();

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize handling
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      renderTarget.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
    };
  }, []);

  // Update rendering settings smoothly without re-allocating shaders
  useEffect(() => {
    if (!rendererRef.current || !sceneRef.current || !controlsRef.current) return;

    // Viewport background
    rendererRef.current.setClearColor(settings.backgroundColor);
    rendererRef.current.toneMappingExposure = settings.exposure;
    rendererRef.current.shadowMap.enabled = settings.showShadows;

    if (shadowPlaneRef.current) {
      shadowPlaneRef.current.visible = settings.showShadows;
    }

    // Controls
    controlsRef.current.enabled = settings.orbitControlsEnabled;
    controlsRef.current.rotateSpeed = settings.rotationSpeed;
    controlsRef.current.zoomSpeed = settings.zoomSpeed;
    controlsRef.current.panSpeed = settings.panSpeed;
    controlsRef.current.autoRotate = settings.autoRotate;
    controlsRef.current.autoRotateSpeed = settings.autoRotateSpeed;

    // Lights
    if (lightsRef.current) {
      lightsRef.current.ambient.intensity = settings.ambientIntensity;

      // Multi-Light Setup from settings.lights (Light 1, Light 2, Light 3)
      const light1 = settings.lights?.[0];
      const light2 = settings.lights?.[1];
      const light3 = settings.lights?.[2];

      if (light1) {
        lightsRef.current.directional.color.set(light1.hex);
        lightsRef.current.directional.intensity = (light1.intensity / 100);
        lightsRef.current.directional.castShadow = settings.showShadows && (light1.intensity > 0);
      } else {
        lightsRef.current.directional.intensity = settings.directionalIntensity;
        lightsRef.current.directional.castShadow = settings.showShadows;
      }

      if (light2) {
        lightsRef.current.directionalBack.color.set(light2.hex);
        lightsRef.current.directionalBack.intensity = (light2.intensity / 100);
      } else {
        lightsRef.current.directionalBack.intensity = settings.directionalIntensity * 0.45;
      }

      if (light3) {
        lightsRef.current.point.color.set(light3.hex);
        lightsRef.current.point.intensity = (light3.intensity / 100);
      } else {
        lightsRef.current.point.intensity = settings.pointIntensity;
      }
    }

    // Apply material properties directly without triggering costly shader recompiles
    if (rootGroupRef.current) {
      rootGroupRef.current.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          mesh.castShadow = settings.showShadows;
          mesh.receiveShadow = settings.showShadows;

          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of mats) {
            if (!mat) continue;

            if ('wireframe' in mat) {
              (mat as any).wireframe = settings.wireframe;
            }
            mat.side = settings.doubleSided ? THREE.DoubleSide : THREE.FrontSide;
            mat.opacity = settings.opacity;
            mat.transparent = settings.opacity < 1.0;

            if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
              const stdMat = mat as THREE.MeshStandardMaterial;
              stdMat.roughness = settings.roughness;
              stdMat.metalness = settings.metalness;
              stdMat.envMapIntensity = settings.envMapIntensity;

              // Texture toggling
              if (!settings.showTextures) {
                if (stdMat.map && !(stdMat as any)._savedMap) {
                  (stdMat as any)._savedMap = stdMat.map;
                  stdMat.map = null;
                  stdMat.needsUpdate = true;
                }
              } else {
                if ((stdMat as any)._savedMap) {
                  stdMat.map = (stdMat as any)._savedMap;
                  (stdMat as any)._savedMap = null;
                  stdMat.needsUpdate = true;
                }
              }

              // Normal map toggling
              if (!settings.showNormals) {
                if (stdMat.normalMap && !(stdMat as any)._savedNormalMap) {
                  (stdMat as any)._savedNormalMap = stdMat.normalMap;
                  stdMat.normalMap = null;
                  stdMat.needsUpdate = true;
                }
              } else {
                if ((stdMat as any)._savedNormalMap) {
                  stdMat.normalMap = (stdMat as any)._savedNormalMap;
                  (stdMat as any)._savedNormalMap = null;
                  stdMat.needsUpdate = true;
                }
              }
            }
          }
        }
      });
    }
  }, [settings]);

  // Update helpers
  useEffect(() => {
    if (gridHelperRef.current) gridHelperRef.current.visible = showGrid;
    if (axesHelperRef.current) axesHelperRef.current.visible = showAxes;
  }, [showGrid, showAxes]);

  // Center camera to Sharp assembly
  const fitCameraToSelection = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(2.8, 1.8, 2.6);
    controlsRef.current.target.set(0.42, 0.62, 0.0);
    controlsRef.current.update();
  }, []);

  // Reset Camera Viewpoint when resetTrigger fires
  useEffect(() => {
    if (resetTrigger > 0) {
      fitCameraToSelection();
    }
  }, [resetTrigger, fitCameraToSelection]);

  // Manage loaded/visible models in rootGroup without flickering or reloading
  useEffect(() => {
    if (!rootGroupRef.current) return;
    const rootGroup = rootGroupRef.current;
    const activeIds = new Set(selectedIdsStr.split(',').filter(Boolean));

    // 1. Toggle visibility of existing cached models
    modelCacheRef.current.forEach((obj, modelId) => {
      obj.visible = activeIds.has(modelId);
    });

    // 2. Identify models that need to be loaded into cache
    const modelsToLoad = selectedModels.filter((m) => !modelCacheRef.current.has(m.id));

    if (modelsToLoad.length === 0) {
      if (!hasInitializedCameraRef.current && activeIds.size > 0) {
        hasInitializedCameraRef.current = true;
        fitCameraToSelection();
      }
      return;
    }

    let isCancelled = false;
    setLoadingCount((c) => c + modelsToLoad.length);

    const loadMissing = async () => {
      const decoder = await getMeshoptDecoder();
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(decoder);

      for (const model of modelsToLoad) {
        if (isCancelled) break;
        const url = useCompressedVariant && model.hasCompressedVariant && model.compressedFilename
          ? `/models/modelperformance/compressed/${model.compressedFilename}`
          : `/models/modelperformance/${model.filename}`;

        try {
          const gltf = await new Promise<any>((resolve, reject) => {
            loader.load(url, resolve, undefined, reject);
          });

          if (isCancelled) break;

          const sceneObject = gltf.scene || gltf.scenes[0];
          sceneObject.name = model.filename;
          sceneObject.position.set(model.position[0], model.position[1], model.position[2]);
          sceneObject.rotation.set(model.rotation[0], model.rotation[1], model.rotation[2]);
          sceneObject.scale.set(model.scale[0], model.scale[1], model.scale[2]);

          // Enable shadow flags on model meshes
          sceneObject.traverse((node: THREE.Object3D) => {
            if ((node as THREE.Mesh).isMesh) {
              const mesh = node as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });

          sceneObject.visible = activeIds.has(model.id);
          rootGroup.add(sceneObject);
          modelCacheRef.current.set(model.id, sceneObject);
        } catch (e) {
          console.error(`Failed to load ${model.filename}:`, e);
        } finally {
          setLoadingCount((c) => Math.max(0, c - 1));
        }
      }

      if (!hasInitializedCameraRef.current && activeIds.size > 0) {
        hasInitializedCameraRef.current = true;
        fitCameraToSelection();
      }
    };

    loadMissing();

    return () => {
      isCancelled = true;
    };
  }, [selectedIdsStr, useCompressedVariant, fitCameraToSelection]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-lg flex flex-col"
    >
      {/* WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full flex-1 block outline-none cursor-grab active:cursor-grabbing" />

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Active Product Count Badge */}
          <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-neutral-200 shadow-md flex items-center gap-2 text-neutral-900">
            <span className="w-2.5 h-2.5 rounded-full bg-black shadow-sm" />
            <span className="text-xs font-semibold tracking-wide">
              {selectedModels.length > 0 ? (
                <>
                  <span className="font-mono text-black font-bold">{selectedModels.length}</span> Component{selectedModels.length > 1 ? 's' : ''} Active
                </>
              ) : (
                'Select Components Below'
              )}
            </span>
          </div>

          {/* Loading Pill */}
          {loadingCount > 0 && (
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-200 shadow-md flex items-center gap-2 text-neutral-800 text-xs font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
              <span>Loading 3D mesh...</span>
            </div>
          )}
        </div>

        {/* Viewport Action Icons */}
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-neutral-200 shadow-md pointer-events-auto">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-colors ${
              showGrid ? 'bg-black text-white font-bold' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
            }`}
            title="Toggle Ground Grid"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAxes(!showAxes)}
            className={`p-2 rounded-lg transition-colors ${
              showAxes ? 'bg-black text-white font-bold' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
            }`}
            title="Toggle Coordinate Axes"
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            onClick={fitCameraToSelection}
            className="p-2 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
            title="Reset Camera & Center View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Center Empty State / Prompt */}
      {selectedModels.length === 0 && loadingCount === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center z-10 bg-white/60 backdrop-blur-[2px]">
          <div className="w-16 h-16 rounded-2xl bg-white border border-neutral-200 shadow-lg flex items-center justify-center mb-4 text-black">
            <Eye className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-neutral-900 mb-1">
            Select a product component to begin 3D inspection.
          </h3>
          <p className="text-xs text-neutral-500 max-w-md">
            Click on any of the product parts below to display them together in this high-definition viewport.
          </p>
        </div>
      )}
    </div>
  );
};
