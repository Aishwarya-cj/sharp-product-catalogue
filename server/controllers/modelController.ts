import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AssemblyManifest, ModelItem } from '../../src/types';

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const getModels = async (_req: Request, res: Response) => {
  try {
    const modelsDir = path.resolve(process.cwd(), 'public/models/modelperformance');
    const compressedDir = path.join(modelsDir, 'compressed');
    const manifestPath = path.join(modelsDir, 'manifest.json');

    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }
    if (!fs.existsSync(compressedDir)) {
      fs.mkdirSync(compressedDir, { recursive: true });
    }

    let manifest: AssemblyManifest = {
      productName: 'Sharp MX Multi-Function Modular Print System',
      description: 'Modular 7-Part Industrial Office Printing and Finishing System',
      components: {},
    };

    if (fs.existsSync(manifestPath)) {
      try {
        const raw = fs.readFileSync(manifestPath, 'utf-8');
        manifest = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse manifest.json', e);
      }
    }

    const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.glb'));
    const compressedFiles = fs.existsSync(compressedDir)
      ? fs.readdirSync(compressedDir).filter(f => f.endsWith('.glb'))
      : [];

    const models: ModelItem[] = files.map((filename, index) => {
      const filePath = path.join(modelsDir, filename);
      const stat = fs.statSync(filePath);
      const baseName = path.basename(filename, path.extname(filename));
      const expectedCompressed = `${baseName}.meshopt.glb`;
      const hasCompressed = compressedFiles.includes(expectedCompressed);

      let compressedSizeBytes: number | undefined;
      let formattedCompressedSize: string | undefined;

      if (hasCompressed) {
        const compStat = fs.statSync(path.join(compressedDir, expectedCompressed));
        compressedSizeBytes = compStat.size;
        formattedCompressedSize = formatBytes(compStat.size);
      }

      const componentMeta = manifest.components[filename] || {
        displayName: baseName,
        partNumber: `Part ${index + 1}`,
        category: 'Component',
        description: `Modular component part ${index + 1}`,
        position: [0, 0, 0] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number],
        visibleDefault: true,
      };

      return {
        id: `model-${index + 1}`,
        filename,
        displayName: componentMeta.displayName || baseName,
        partNumber: componentMeta.partNumber || `Part ${index + 1}`,
        category: componentMeta.category || 'Component',
        description: componentMeta.description || '',
        originalSizeBytes: stat.size,
        formattedOriginalSize: formatBytes(stat.size),
        compressedSizeBytes,
        formattedCompressedSize,
        isCompressed: false,
        hasCompressedVariant: hasCompressed,
        compressedFilename: hasCompressed ? expectedCompressed : undefined,
        loadingStatus: 'idle',
        selected: false,
        position: componentMeta.position || [0, 0, 0],
        rotation: componentMeta.rotation || [0, 0, 0],
        scale: componentMeta.scale || [1, 1, 1],
        visibleDefault: componentMeta.visibleDefault !== false,
      };
    });

    res.json({
      success: true,
      count: models.length,
      manifest,
      models,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getManifest = async (_req: Request, res: Response) => {
  try {
    const manifestPath = path.resolve(process.cwd(), 'public/models/modelperformance/manifest.json');
    if (fs.existsSync(manifestPath)) {
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      res.json({ success: true, manifest: JSON.parse(raw) });
    } else {
      res.json({ success: true, manifest: { productName: 'Product', components: {} } });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateManifest = async (req: Request, res: Response) => {
  try {
    const manifestPath = path.resolve(process.cwd(), 'public/models/modelperformance/manifest.json');
    const newManifest = req.body;
    fs.writeFileSync(manifestPath, JSON.stringify(newManifest, null, 2), 'utf-8');
    res.json({ success: true, manifest: newManifest });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

