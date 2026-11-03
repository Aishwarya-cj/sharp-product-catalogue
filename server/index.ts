import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import { getModels, getManifest, updateManifest } from './controllers/modelController';
import { compressModel, downloadModel } from './controllers/compressionController';
import { getBenchmarks, saveBenchmark, clearBenchmarks, getNotes, saveNote } from './controllers/benchmarkController';
import { initMeshopt } from './services/meshoptService';

const app = express();
const PORT = process.env.PORT || 3001;

// Multer storage for GLB uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.resolve(process.cwd(), 'public/models/modelperformance');
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.glb')) {
      cb(null, true);
    } else {
      cb(new Error('Only .glb 3D files are supported'));
    }
  },
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for public models
app.use('/models', express.static(path.resolve(process.cwd(), 'public/models')));
app.use(express.static(path.resolve(process.cwd(), 'public')));

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Models
app.get('/api/models', getModels);
app.get('/api/models/manifest', getManifest);
app.post('/api/models/manifest', updateManifest);

// Upload GLB
app.post('/api/upload', upload.single('model'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No GLB file uploaded' });
  }
  res.json({
    success: true,
    file: {
      filename: req.file.filename,
      size: req.file.size,
      path: `/models/modelperformance/${req.file.filename}`,
    },
  });
});

// Compression & Download
app.post('/api/compress', compressModel);
app.get('/api/download', downloadModel);

// Benchmarks & Notes
app.get('/api/benchmarks', getBenchmarks);
app.post('/api/benchmarks', saveBenchmark);
app.delete('/api/benchmarks', clearBenchmarks);
app.get('/api/notes', getNotes);
app.post('/api/notes', saveNote);

// Initialize Meshopt WASM modules on startup
initMeshopt()
  .then(() => {
    console.log('[Sharp 3D Lab Server] Meshopt WASM encoder & decoder ready.');
  })
  .catch((err) => {
    console.error('[Sharp 3D Lab Server] Failed to initialize Meshopt WASM:', err);
  });

app.listen(PORT, () => {
  console.log(`[Sharp 3D Lab Server] Running on http://localhost:${PORT}`);
});

