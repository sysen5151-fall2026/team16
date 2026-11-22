import { closeSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDemoService, createSeed, serializeState } from '../../src/domain.js';

const demoRoot = fileURLToPath(new URL('../../', import.meta.url));
const DEFAULT_DATA_FILE = join(demoRoot, 'data', 'pantri-state.json');

export function resolveDataFile(value = process.env.PANTRI_DATA_FILE) {
  return value ? resolve(value) : DEFAULT_DATA_FILE;
}

function atomicWrite(file, contents) {
  mkdirSync(dirname(file), { recursive: true });
  const temporary = file + '.' + randomUUID() + '.tmp';
  try {
    const descriptor = openSync(temporary, 'wx', 0o600);
    try {
      writeFileSync(descriptor, contents, 'utf8');
      fsyncSync(descriptor);
    } finally {
      closeSync(descriptor);
    }
    renameSync(temporary, file);
  } catch (error) {
    try {
      unlinkSync(temporary);
    } catch {
      // A failed cleanup cannot make the replacement successful.
    }
    throw error;
  }
}

function readState(file) {
  try {
    return readFileSync(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export function seedStateFile(file) {
  atomicWrite(file, serializeState(createSeed()));
}

export function openState(file) {
  let missing = false;
  try {
    missing = readState(file) === null;
  } catch {
    // Preserve an unreadable file so the shared service can report the recovery problem.
  }
  if (missing) seedStateFile(file);
  return createDemoService({
    getItem: () => readState(file),
    setItem: (_, data) => atomicWrite(file, data),
  });
}

export function storageStatus(service) {
  const problem = service.getProblem();
  return {
    status: problem ? 'quarantined' : 'ready',
    problem,
    hasCheckpoint: service.getCheckpointRevision() !== null,
    hasRaw: service.getRaw() !== null,
    revision: service.getSnapshot().revision,
    checkpointRevision: service.getCheckpointRevision(),
  };
}
