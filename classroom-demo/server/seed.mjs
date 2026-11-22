import { resolveDataFile, seedStateFile } from './continuity/storage.mjs';

const file = resolveDataFile();
try {
  seedStateFile(file);
  console.log('Seeded the PANTRI classroom dataset at ' + file);
} catch {
  console.error('Could not seed PANTRI. Check the data directory and stop any running demo server.');
  process.exitCode = 1;
}
