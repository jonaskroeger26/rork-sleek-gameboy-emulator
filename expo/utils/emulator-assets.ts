/**
 * Ensures EmulatorJS data is available locally for offline use.
 * On first run (with internet), downloads and caches. After that, fully offline.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const CDN_BASE = 'https://cdn.emulatorjs.org/stable/data/';
// Bump this when we change the set of required offline files.
const STORAGE_KEY = 'retryx_emulator_ready_v4';

const MAIN_FILES = ['loader.js', 'emulator.min.js', 'emulator.min.css'];
const LOCALE_FILES = [
  // EmulatorJS may fetch this at runtime; missing it causes "network error" overlays.
  'localization/en-US.json',
];
const CORE_FILES = [
  'cores/cores.json',
  'cores/gambatte-wasm.data',
  'cores/mgba-wasm.data',
  'cores/fceumm-wasm.data',
  'cores/snes9x-wasm.data',
  'cores/mupen64plus_next-wasm.data',
  'cores/melonds-wasm.data',
  'cores/desmume2015-wasm.data',
  'cores/genesis_plus_gx-wasm.data',
];

export async function getEmulatorDataPath(): Promise<string> {
  if (Platform.OS === 'web') {
    return CDN_BASE;
  }

  const baseDir = (FileSystem.documentDirectory ?? '') + 'emulatorjs/';
  const loaderPath = baseDir + 'loader.js';
  const localePath = baseDir + 'localization/en-US.json';
  const dirInfo = await FileSystem.getInfoAsync(baseDir, { type: 'dir' });
  const loaderInfo = await FileSystem.getInfoAsync(loaderPath, { type: 'file' });
  const localeInfo = await FileSystem.getInfoAsync(localePath, { type: 'file' });

  if (loaderInfo.exists && localeInfo.exists) {
    return baseDir;
  }

  const cached = await AsyncStorage.getItem(STORAGE_KEY);
  if (cached === 'true' && dirInfo.exists) {
    return baseDir;
  }

  // Offline-first: if we can't download the emulator pack, we should fail loudly
  // (rather than silently falling back to the CDN, which causes "network error" + black screen offline).
  return await downloadEmulatorData(baseDir);
}

export async function ensureEmulatorAsset(relPath: string): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!relPath) return;
  if (relPath.startsWith('/')) relPath = relPath.slice(1);
  if (relPath.includes('..')) return;

  const baseDir = (FileSystem.documentDirectory ?? '') + 'emulatorjs/';
  const localPath = baseDir + relPath;
  const info = await FileSystem.getInfoAsync(localPath, { type: 'file' });
  if (info.exists) return;

  await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
  const parts = relPath.split('/');
  if (parts.length > 1) {
    const dirRel = parts.slice(0, -1).join('/') + '/';
    await FileSystem.makeDirectoryAsync(baseDir + dirRel, { intermediates: true });
  }

  const url = CDN_BASE + relPath;
  const result = await FileSystem.downloadAsync(url, localPath);
  if (result.status !== 200) {
    throw new Error(`HTTP ${result.status}`);
  }
}

async function downloadEmulatorData(baseDir: string): Promise<string> {
  await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
  const ensureDirForRelPath = async (relPath: string) => {
    const parts = relPath.split('/');
    if (parts.length <= 1) return;
    const dirRel = parts.slice(0, -1).join('/') + '/';
    await FileSystem.makeDirectoryAsync(baseDir + dirRel, { intermediates: true });
  };

  const downloadFile = async (relPath: string) => {
    try {
      await ensureEmulatorAsset(relPath);
    } catch {
      throw new Error(
        `Cannot download emulator (need WiFi). Failed: ${relPath}. Connect and try again.`
      );
    }
  };

  // Download known required files first (includes cores/cores.json).
  const baseFiles = [...MAIN_FILES, ...LOCALE_FILES, ...CORE_FILES];
  for (const relPath of baseFiles) {
    // eslint-disable-next-line no-await-in-loop
    await downloadFile(relPath);
  }

  // Some EmulatorJS cores fetch extra metadata files at runtime (e.g. cores/reports/*.json).
  // Instead of guessing a static list, derive them from cores/cores.json.
  try {
    const coresJsonPath = baseDir + 'cores/cores.json';
    const text = await FileSystem.readAsStringAsync(coresJsonPath);
    const matches = text.match(/(?:cores\/)?reports\/[^"]+\.json/g) ?? [];
    const reportFiles = Array.from(new Set(matches)).map((p) =>
      p.startsWith('cores/') ? p : `cores/${p}`
    );
    for (const relPath of reportFiles) {
      // eslint-disable-next-line no-await-in-loop
      await downloadFile(relPath);
    }
  } catch {
    // If this fails, we still have the known minimum set; runtime will surface an explicit URL.
  }

  await AsyncStorage.setItem(STORAGE_KEY, 'true');
  return baseDir;
}
