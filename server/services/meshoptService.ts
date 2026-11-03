import fs from 'fs';
import path from 'path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt, reorder, quantize } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

let isEncoderReady = false;

export async function initMeshopt() {
  if (!isEncoderReady) {
    await MeshoptEncoder.ready;
    await MeshoptDecoder.ready;
    isEncoderReady = true;
  }
}

export interface CompressionResult {
  filename: string;
  compressedFilename: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  reductionPercentage: number;
  compressionTimeMs: number;
  compressedRelativeUrl: string;
  success: boolean;
  error?: string;
}

export async function compressGlbFile(
  filename: string,
  options: { level?: 'medium' | 'high'; reorder?: boolean; quantize?: boolean } = {}
): Promise<CompressionResult> {
  await initMeshopt();

  const modelsDir = path.resolve(process.cwd(), 'public/models/modelperformance');
  const compressedDir = path.join(modelsDir, 'compressed');
  if (!fs.existsSync(compressedDir)) {
    fs.mkdirSync(compressedDir, { recursive: true });
  }

  const inputPath = path.join(modelsDir, filename);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Original model file not found: ${filename}`);
  }

  const baseName = path.basename(filename, path.extname(filename));
  const compressedFilename = `${baseName}.meshopt.glb`;
  const outputPath = path.join(compressedDir, compressedFilename);

  const originalStat = fs.statSync(inputPath);
  const originalSizeBytes = originalStat.size;

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  io.registerDependencies({
    'meshopt.encoder': MeshoptEncoder,
    'meshopt.decoder': MeshoptDecoder,
  });

  const tStart = performance.now();

  const doc = await io.read(inputPath);

  // Apply transforms based on options
  const transforms = [];
  if (options.reorder !== false) {
    transforms.push(reorder({ encoder: MeshoptEncoder }));
  }
  if (options.quantize) {
    transforms.push(quantize());
  }
  transforms.push(meshopt({ encoder: MeshoptEncoder, level: options.level || 'medium' }));

  // @ts-ignore
  await doc.transform(...transforms);

  const outBuffer = await io.writeBinary(doc);
  const compressionTimeMs = performance.now() - tStart;

  fs.writeFileSync(outputPath, Buffer.from(outBuffer));
  const compressedSizeBytes = outBuffer.byteLength;
  const reductionPercentage = Number(((1 - compressedSizeBytes / originalSizeBytes) * 100).toFixed(2));

  return {
    filename,
    compressedFilename,
    originalSizeBytes,
    compressedSizeBytes,
    reductionPercentage,
    compressionTimeMs: Number(compressionTimeMs.toFixed(2)),
    compressedRelativeUrl: `/models/modelperformance/compressed/${compressedFilename}`,
    success: true,
  };
}

