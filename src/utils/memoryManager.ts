import * as THREE from 'three';

interface ResourceRefCount {
  geometries: Map<string, { geometry: THREE.BufferGeometry; refCount: number }>;
  materials: Map<string, { material: THREE.Material; refCount: number }>;
  textures: Map<string, { texture: THREE.Texture; refCount: number }>;
}

export class MemoryManager {
  private refCounts: ResourceRefCount = {
    geometries: new Map(),
    materials: new Map(),
    textures: new Map(),
  };

  private registeredModels = new Map<string, THREE.Object3D>();

  /**
   * Tracks resources inside an imported model root object
   */
  public registerModel(modelId: string, rootObject: THREE.Object3D) {
    if (this.registeredModels.has(modelId)) {
      this.unregisterModel(modelId);
    }

    this.registeredModels.set(modelId, rootObject);

    rootObject.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;

        // Geometry tracking
        if (mesh.geometry) {
          const geoUuid = mesh.geometry.uuid;
          const current = this.refCounts.geometries.get(geoUuid);
          if (current) {
            current.refCount += 1;
          } else {
            this.refCounts.geometries.set(geoUuid, { geometry: mesh.geometry, refCount: 1 });
          }
        }

        // Material tracking
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats) {
          if (!mat) continue;
          const matUuid = mat.uuid;
          const currentMat = this.refCounts.materials.get(matUuid);
          if (currentMat) {
            currentMat.refCount += 1;
          } else {
            this.refCounts.materials.set(matUuid, { material: mat, refCount: 1 });
          }

          // Texture tracking on materials
          for (const key of Object.keys(mat)) {
            const val = (mat as any)[key];
            if (val && (val as THREE.Texture).isTexture) {
              const tex = val as THREE.Texture;
              const texUuid = tex.uuid;
              const currentTex = this.refCounts.textures.get(texUuid);
              if (currentTex) {
                currentTex.refCount += 1;
              } else {
                this.refCounts.textures.set(texUuid, { texture: tex, refCount: 1 });
              }
            }
          }
        }
      }
    });
  }

  /**
   * Safely disposes and unlinks a model, decreasing ref counts and only
   * disposing resources whose refCount reaches zero
   */
  public unregisterModel(modelId: string): THREE.Object3D | null {
    const rootObject = this.registeredModels.get(modelId);
    if (!rootObject) return null;

    rootObject.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;

        // Geometry cleanup
        if (mesh.geometry) {
          const geoEntry = this.refCounts.geometries.get(mesh.geometry.uuid);
          if (geoEntry) {
            geoEntry.refCount -= 1;
            if (geoEntry.refCount <= 0) {
              geoEntry.geometry.dispose();
              this.refCounts.geometries.delete(mesh.geometry.uuid);
            }
          }
        }

        // Material & texture cleanup
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats) {
          if (!mat) continue;

          for (const key of Object.keys(mat)) {
            const val = (mat as any)[key];
            if (val && (val as THREE.Texture).isTexture) {
              const tex = val as THREE.Texture;
              const texEntry = this.refCounts.textures.get(tex.uuid);
              if (texEntry) {
                texEntry.refCount -= 1;
                if (texEntry.refCount <= 0) {
                  tex.dispose();
                  this.refCounts.textures.delete(tex.uuid);
                }
              }
            }
          }

          const matEntry = this.refCounts.materials.get(mat.uuid);
          if (matEntry) {
            matEntry.refCount -= 1;
            if (matEntry.refCount <= 0) {
              mat.dispose();
              this.refCounts.materials.delete(mat.uuid);
            }
          }
        }
      }
    });

    if (rootObject.parent) {
      rootObject.parent.remove(rootObject);
    }
    this.registeredModels.delete(modelId);
    return rootObject;
  }

  /**
   * Dispose everything
   */
  public disposeAll() {
    const keys = Array.from(this.registeredModels.keys());
    for (const key of keys) {
      this.unregisterModel(key);
    }
    this.refCounts.geometries.clear();
    this.refCounts.materials.clear();
    this.refCounts.textures.clear();
    this.registeredModels.clear();
  }

  /**
   * Count live unique resources
   */
  public getCounts() {
    return {
      geometries: this.refCounts.geometries.size,
      materials: this.refCounts.materials.size,
      textures: this.refCounts.textures.size,
      models: this.registeredModels.size,
    };
  }

  /**
   * Calculate GPU memory estimation in bytes
   */
  public estimateGpuMemoryBytes(): number {
    let bytes = 0;
    this.refCounts.geometries.forEach(({ geometry }) => {
      // Attributes (position, normal, uv, etc.)
      for (const name in geometry.attributes) {
        const attr = geometry.attributes[name];
        if (attr && attr.array) {
          bytes += attr.array.byteLength;
        }
      }
      // Index buffer
      if (geometry.index && geometry.index.array) {
        bytes += geometry.index.array.byteLength;
      }
    });

    // Texture approximate GPU memory
    this.refCounts.textures.forEach(({ texture }) => {
      const img = texture.image;
      if (img && img.width && img.height) {
        // RGBA 4 bytes per pixel, plus ~33% for mipmaps
        bytes += img.width * img.height * 4 * 1.333;
      } else {
        // Fallback default estimate for typical 1024x1024 or 2048x2048
        bytes += 1024 * 1024 * 4;
      }
    });

    return bytes;
  }
}

export const globalMemoryManager = new MemoryManager();

