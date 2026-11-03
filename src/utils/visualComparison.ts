import * as THREE from 'three';
import { computeSSIM, ImageComparisonResult } from './ssim';

export function captureCanvasImageData(renderer: THREE.WebGLRenderer): ImageData | null {
  const gl = renderer.getContext();
  const width = renderer.domElement.width;
  const height = renderer.domElement.height;
  if (!gl || width <= 0 || height <= 0) return null;

  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  // WebGL readPixels is flipped vertically (origin at bottom-left)
  const flipped = new Uint8ClampedArray(width * height * 4);
  const rowSize = width * 4;
  for (let y = 0; y < height; y++) {
    const srcRow = (height - y - 1) * rowSize;
    const dstRow = y * rowSize;
    flipped.set(pixels.subarray(srcRow, srcRow + rowSize), dstRow);
  }

  return new ImageData(flipped, width, height);
}

export function compareCanvases(
  rendererA: THREE.WebGLRenderer,
  rendererB: THREE.WebGLRenderer
): ImageComparisonResult | null {
  const imgA = captureCanvasImageData(rendererA);
  const imgB = captureCanvasImageData(rendererB);
  if (!imgA || !imgB) return null;
  return computeSSIM(imgA, imgB);
}

