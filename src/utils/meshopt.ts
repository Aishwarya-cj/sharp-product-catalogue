import { MeshoptDecoder } from 'meshoptimizer';

let isDecoderInitialized = false;

export async function getMeshoptDecoder() {
  if (!isDecoderInitialized) {
    if (MeshoptDecoder.ready) {
      await MeshoptDecoder.ready;
    }
    isDecoderInitialized = true;
  }
  return MeshoptDecoder;
}

