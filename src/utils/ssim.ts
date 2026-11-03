/**
 * Real Structural Similarity Index Measure (SSIM) and PSNR
 * Evaluates rendered image fidelity between Original and Meshopt variants.
 */

export interface ImageComparisonResult {
  ssim: number; // 0 to 1
  psnr: number; // dB
  mse: number;
  differentPixelsPercent: number;
  isVisuallyIdentical: boolean;
}

export function computeSSIM(
  imgData1: ImageData,
  imgData2: ImageData
): ImageComparisonResult {
  const d1 = imgData1.data;
  const d2 = imgData2.data;
  const len = Math.min(d1.length, d2.length);
  const numPixels = len / 4;

  if (numPixels === 0) {
    return {
      ssim: 1.0,
      psnr: 100,
      mse: 0,
      differentPixelsPercent: 0,
      isVisuallyIdentical: true,
    };
  }

  const K1 = 0.01;
  const K2 = 0.03;
  const L = 255;
  const C1 = (K1 * L) ** 2;
  const C2 = (K2 * L) ** 2;

  let sumLuma1 = 0;
  let sumLuma2 = 0;
  let diffPixels = 0;
  let mseTotal = 0;

  // Convert to luma and compute preliminary stats
  // Using Rec. 709 luma coefficients: 0.2126 R + 0.7152 G + 0.0722 B
  const luma1 = new Float32Array(numPixels);
  const luma2 = new Float32Array(numPixels);

  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    const r1 = d1[idx];
    const g1 = d1[idx + 1];
    const b1 = d1[idx + 2];

    const r2 = d2[idx];
    const g2 = d2[idx + 1];
    const b2 = d2[idx + 2];

    const y1 = 0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1;
    const y2 = 0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2;

    luma1[i] = y1;
    luma2[i] = y2;

    sumLuma1 += y1;
    sumLuma2 += y2;

    const diff = Math.abs(y1 - y2);
    if (diff > 1.0) {
      diffPixels++;
    }
    mseTotal += (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
  }

  const mu1 = sumLuma1 / numPixels;
  const mu2 = sumLuma2 / numPixels;

  let var1 = 0;
  let var2 = 0;
  let cov12 = 0;

  for (let i = 0; i < numPixels; i++) {
    const diff1 = luma1[i] - mu1;
    const diff2 = luma2[i] - mu2;
    var1 += diff1 * diff1;
    var2 += diff2 * diff2;
    cov12 += diff1 * diff2;
  }

  var1 /= (numPixels - 1);
  var2 /= (numPixels - 1);
  cov12 /= (numPixels - 1);

  // SSIM formula
  const numerator = (2 * mu1 * mu2 + C1) * (2 * cov12 + C2);
  const denominator = (mu1 * mu1 + mu2 * mu2 + C1) * (var1 + var2 + C2);
  let ssimVal = denominator === 0 ? 1.0 : numerator / denominator;
  ssimVal = Math.max(0, Math.min(1, ssimVal));

  const mse = mseTotal / (numPixels * 3);
  let psnr = 100;
  if (mse > 0.00001) {
    psnr = 10 * Math.log10((255 * 255) / mse);
  }

  const diffPct = Number(((diffPixels / numPixels) * 100).toFixed(2));
  const ssimRounded = Number(ssimVal.toFixed(4));
  const psnrRounded = Number(psnr.toFixed(2));

  return {
    ssim: ssimRounded,
    psnr: psnrRounded,
    mse: Number(mse.toFixed(2)),
    differentPixelsPercent: diffPct,
    isVisuallyIdentical: ssimRounded >= 0.995 && diffPct < 0.5,
  };
}

