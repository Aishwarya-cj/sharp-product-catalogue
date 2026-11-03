import { AssemblyManifest, BenchmarkRecord, CompressionSettings, InspectionNote, ModelItem } from '../types';

export async function fetchDiscoveredModels(): Promise<{ models: ModelItem[]; manifest: AssemblyManifest }> {
  const res = await fetch('/api/models');
  if (!res.ok) {
    throw new Error(`Failed to fetch models: ${res.statusText}`);
  }
  const data = await res.json();
  return { models: data.models, manifest: data.manifest };
}

export async function saveManifest(manifest: AssemblyManifest): Promise<AssemblyManifest> {
  const res = await fetch('/api/models/manifest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(manifest),
  });
  if (!res.ok) throw new Error('Failed to save manifest');
  const data = await res.json();
  return data.manifest;
}

export async function compressModelApi(
  filename: string,
  settings: CompressionSettings
): Promise<{
  filename: string;
  compressedFilename: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  reductionPercentage: number;
  compressionTimeMs: number;
  compressedRelativeUrl: string;
}> {
  const res = await fetch('/api/compress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, settings }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Compression request failed');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchBenchmarks(): Promise<BenchmarkRecord[]> {
  const res = await fetch('/api/benchmarks');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function saveBenchmarkApi(record: BenchmarkRecord): Promise<void> {
  await fetch('/api/benchmarks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
}

export async function clearBenchmarksApi(): Promise<void> {
  await fetch('/api/benchmarks', { method: 'DELETE' });
}

export async function fetchNotes(): Promise<InspectionNote[]> {
  const res = await fetch('/api/notes');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function saveNoteApi(note: InspectionNote): Promise<void> {
  await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
}

export async function uploadGlbFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('model', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('File upload failed');
  const json = await res.json();
  return json.file.filename;
}

