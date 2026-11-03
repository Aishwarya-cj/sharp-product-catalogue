import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { BenchmarkRecord, InspectionNote } from '../../src/types';

const dataDir = path.resolve(process.cwd(), 'server/data');
const benchmarksFile = path.join(dataDir, 'benchmarks.json');
const notesFile = path.join(dataDir, 'notes.json');

function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(benchmarksFile)) {
    fs.writeFileSync(benchmarksFile, JSON.stringify([]), 'utf-8');
  }
  if (!fs.existsSync(notesFile)) {
    fs.writeFileSync(notesFile, JSON.stringify([]), 'utf-8');
  }
}

export const getBenchmarks = async (_req: Request, res: Response) => {
  try {
    ensureDataFiles();
    const data = fs.readFileSync(benchmarksFile, 'utf-8');
    res.json({ success: true, data: JSON.parse(data) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const saveBenchmark = async (req: Request, res: Response) => {
  try {
    ensureDataFiles();
    const record: BenchmarkRecord = req.body;
    const data = fs.readFileSync(benchmarksFile, 'utf-8');
    const records: BenchmarkRecord[] = JSON.parse(data);
    records.unshift(record);
    // Keep max 100 historical benchmark records
    if (records.length > 100) records.length = 100;
    fs.writeFileSync(benchmarksFile, JSON.stringify(records, null, 2), 'utf-8');
    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const clearBenchmarks = async (_req: Request, res: Response) => {
  try {
    ensureDataFiles();
    fs.writeFileSync(benchmarksFile, JSON.stringify([]), 'utf-8');
    res.json({ success: true, message: 'Benchmark records cleared' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getNotes = async (_req: Request, res: Response) => {
  try {
    ensureDataFiles();
    const data = fs.readFileSync(notesFile, 'utf-8');
    res.json({ success: true, data: JSON.parse(data) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const saveNote = async (req: Request, res: Response) => {
  try {
    ensureDataFiles();
    const note: InspectionNote = req.body;
    const data = fs.readFileSync(notesFile, 'utf-8');
    const notes: InspectionNote[] = JSON.parse(data);
    notes.unshift(note);
    fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2), 'utf-8');
    res.json({ success: true, data: note });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

