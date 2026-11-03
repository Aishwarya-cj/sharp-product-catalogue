import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { compressGlbFile } from '../services/meshoptService';

export const compressModel = async (req: Request, res: Response) => {
  try {
    const { filename, settings } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, error: 'Filename is required' });
    }

    const result = await compressGlbFile(filename, settings);
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Compression error:', error);
    res.status(500).json({ success: false, error: error.message || 'Compression failed' });
  }
};

export const downloadModel = async (req: Request, res: Response) => {
  try {
    const { filename, type } = req.query;
    if (!filename || typeof filename !== 'string') {
      return res.status(400).send('Filename query parameter required');
    }

    const modelsDir = path.resolve(process.cwd(), 'public/models/modelperformance');
    let filePath = path.join(modelsDir, filename);

    if (type === 'compressed') {
      filePath = path.join(modelsDir, 'compressed', filename);
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Requested model file does not exist');
    }

    res.download(filePath, filename);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
};

