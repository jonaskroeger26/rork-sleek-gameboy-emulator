import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform, Alert, Image as RNImage } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Rom, RomPlatform, SUPPORTED_EXTENSIONS, EXT_TO_PLATFORM, PLATFORM_LIBRETRO_SYSTEM } from '@/types/rom';

const ROMS_STORAGE_KEY = 'retryx_roms';
const webRomCache = new Map<string, string>();

const THUMBNAIL_BASE = 'https://thumbnails.libretro.com';

async function tryImageUrl(url: string): Promise<boolean> {
  try {
    if (Platform.OS !== 'web') {
      await RNImage.prefetch(url);
      return true;
    }
    return await new Promise<boolean>((resolve) => {
      const img = new (globalThis as any).Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      setTimeout(() => resolve(false), 5000);
    });
  } catch {
    return false;
  }
}

async function fetchBoxArt(romName: string, platform: RomPlatform): Promise<string | null> {
  const system = PLATFORM_LIBRETRO_SYSTEM[platform];
  if (!system) return null;
  const systemEncoded = encodeURIComponent(system);

  const baseName = romName.replace(/\s*\[.*?\]/g, '').trim();
  const stripped = baseName.replace(/\s*\(.*?\)/g, '').trim();
  const normalized = stripped.replace(/_/g, ' ');

  const attempts = [baseName, stripped, normalized];
  if (!baseName.includes('(')) {
    for (const region of ['(USA)', '(USA, Europe)', '(World)', '(Europe)', '(Japan)']) {
      attempts.push(`${normalized} ${region}`);
    }
  }

  const seen = new Set<string>();
  for (const name of attempts) {
    if (seen.has(name)) continue;
    seen.add(name);
    const url = `${THUMBNAIL_BASE}/${systemEncoded}/Named_Boxarts/${encodeURIComponent(name)}.png`;
    if (await tryImageUrl(url)) {
      console.log('[BoxArt] Found:', name);
      return url;
    }
  }
  return null;
}

const copyRomToStorage = async (sourceUri: string, fileName: string): Promise<string> => {
  if (Platform.OS === 'web') return sourceUri;

  const { File, Directory, Paths } = require('expo-file-system') as typeof import('expo-file-system');
  const romsDir = new Directory(Paths.document, 'roms');
  if (!romsDir.exists) {
    romsDir.create({ intermediates: true });
  }
  const uniqueName = `${Date.now()}_${fileName}`;
  const destFile = new File(romsDir, uniqueName);
  const sourceFile = new File(sourceUri);
  sourceFile.copy(destFile);
  console.log('[RomContext] Copied ROM to:', destFile.uri);
  return destFile.uri;
};

const readFileBase64 = async (fileUri: string): Promise<string> => {
  const { File } = require('expo-file-system') as typeof import('expo-file-system');
  const file = new File(fileUri);
  return await file.base64();
};

const removeFile = (fileUri: string): void => {
  try {
    const { File } = require('expo-file-system') as typeof import('expo-file-system');
    const file = new File(fileUri);
    if (file.exists) file.delete();
  } catch (e) {
    console.log('[RomContext] Failed to delete file:', e);
  }
};

function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

export const [RomProvider, useRoms] = createContextHook(() => {
  const [roms, setRoms] = useState<Rom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(ROMS_STORAGE_KEY);
        if (stored) {
          const parsed: Rom[] = JSON.parse(stored);
          if (Platform.OS !== 'web') {
            const { File } = require('expo-file-system') as typeof import('expo-file-system');
            const valid = parsed.filter(r => {
              try {
                const f = new File(r.fileUri);
                return f.exists;
              } catch {
                return false;
              }
            });
            setRoms(valid);
            if (valid.length !== parsed.length) {
              await AsyncStorage.setItem(ROMS_STORAGE_KEY, JSON.stringify(valid));
            }
          } else {
            setRoms([]);
          }
        }
      } catch (e) {
        console.log('[RomContext] Failed to load ROMs:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const saveRoms = useCallback(async (updated: Rom[]) => {
    setRoms(updated);
    await AsyncStorage.setItem(ROMS_STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const importRom = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        console.log('[RomContext] Import cancelled');
        return;
      }

      const asset = result.assets[0];
      const ext = getExtension(asset.name);

      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        Alert.alert(
          'Unsupported File',
          'Supported formats: .gb, .gbc, .gba, .nes, .sfc, .smc, .n64, .z64, .v64, .nds, .gen, .md, .smd',
          [{ text: 'OK' }]
        );
        return;
      }

      const platform: RomPlatform = EXT_TO_PLATFORM[ext] ?? (ext as RomPlatform);
      let fileUri = asset.uri;

      if (Platform.OS !== 'web') {
        fileUri = await copyRomToStorage(asset.uri, asset.name);
      } else {
        const base64 = (asset as any).base64 as string | undefined;
        if (base64) {
          const romId = Date.now().toString();
          webRomCache.set(romId, base64);
          const rom: Rom = {
            id: romId,
            name: asset.name.replace(/\.(gb|gbc|gba|nes|sfc|smc|n64|z64|v64|nds|gen|md|smd)$/i, ''),
            fileName: asset.name,
            fileUri: asset.uri,
            platform,
            addedAt: new Date().toISOString(),
          };
          const updated = [...roms, rom];
          await saveRoms(updated);
          console.log('[RomContext] Imported ROM (web):', rom.name);
          void lookupBoxArt(rom);
          return;
        } else {
          try {
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const reader = new FileReader();
            const b64 = await new Promise<string>((resolve, reject) => {
              reader.onload = () => {
                const dataUrl = reader.result as string;
                const b64Part = dataUrl.split(',')[1] ?? '';
                resolve(b64Part);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            const romId = Date.now().toString();
            webRomCache.set(romId, b64);
            const rom: Rom = {
              id: romId,
              name: asset.name.replace(/\.(gb|gbc|gba|nes|sfc|smc|n64|z64|v64|nds|gen|md|smd)$/i, ''),
              fileName: asset.name,
              fileUri: asset.uri,
              platform,
              addedAt: new Date().toISOString(),
            };
            const updated = [...roms, rom];
            await saveRoms(updated);
            console.log('[RomContext] Imported ROM (web fallback):', rom.name);
            void lookupBoxArt(rom);
            return;
          } catch {
            Alert.alert('Error', 'Could not read file on web.');
            return;
          }
        }
      }

      const rom: Rom = {
        id: Date.now().toString(),
        name: asset.name.replace(/\.(gb|gbc|gba|nes|sfc|smc|n64|z64|v64|nds|gen|md|smd)$/i, ''),
        fileName: asset.name,
        fileUri,
        platform,
        addedAt: new Date().toISOString(),
      };

      const updated = [...roms, rom];
      await saveRoms(updated);
      console.log('[RomContext] Imported ROM:', rom.name);
      void lookupBoxArt(rom);
    } catch (err) {
      console.log('[RomContext] Import error:', err);
      Alert.alert('Import Error', 'Failed to import ROM file. Please try again.');
    }
  }, [roms, saveRoms]);

  const deleteRom = useCallback(async (id: string) => {
    const rom = roms.find(r => r.id === id);
    if (!rom) return;

    if (Platform.OS !== 'web') {
      removeFile(rom.fileUri);
    } else {
      webRomCache.delete(id);
    }

    const updated = roms.filter(r => r.id !== id);
    await saveRoms(updated);
    console.log('[RomContext] Deleted ROM:', rom.name);
  }, [roms, saveRoms]);

  const clearAllRoms = useCallback(async () => {
    if (Platform.OS !== 'web') {
      for (const rom of roms) {
        removeFile(rom.fileUri);
      }
    } else {
      webRomCache.clear();
    }

    await saveRoms([]);
    console.log('[RomContext] Cleared all ROMs');
  }, [roms, saveRoms]);

  const getRomBase64 = useCallback(async (id: string): Promise<string> => {
    const rom = roms.find(r => r.id === id);
    if (!rom) throw new Error('ROM not found');

    if (Platform.OS !== 'web') {
      return await readFileBase64(rom.fileUri);
    }

    const cached = webRomCache.get(id);
    if (cached) return cached;

    throw new Error('ROM data not available. Please re-import the ROM.');
  }, [roms]);

  const updateLastPlayed = useCallback(async (id: string) => {
    const updated = roms.map(r =>
      r.id === id ? { ...r, lastPlayed: new Date().toISOString() } : r
    );
    await saveRoms(updated);
  }, [roms, saveRoms]);

  const updateCoverImage = useCallback(async (id: string, imageDataUrl: string) => {
    const rom = roms.find(r => r.id === id);
    if (!rom || rom.coverImage) return;
    const updated = roms.map(r =>
      r.id === id ? { ...r, coverImage: imageDataUrl } : r
    );
    await saveRoms(updated);
    console.log('[RomContext] Cover image saved for:', rom.name);
  }, [roms, saveRoms]);

  const lookupBoxArt = useCallback(async (rom: Rom) => {
    try {
      const artUrl = await fetchBoxArt(rom.name, rom.platform);
      if (!artUrl) return;
      const stored = await AsyncStorage.getItem(ROMS_STORAGE_KEY);
      if (!stored) return;
      const current: Rom[] = JSON.parse(stored);
      const target = current.find(r => r.id === rom.id);
      if (!target || target.coverImage) return;
      const updated = current.map(r =>
        r.id === rom.id ? { ...r, coverImage: artUrl } : r
      );
      await AsyncStorage.setItem(ROMS_STORAGE_KEY, JSON.stringify(updated));
      setRoms(updated);
      console.log('[RomContext] Box art set for:', rom.name);
    } catch (e) {
      console.log('[RomContext] Box art lookup failed:', e);
    }
  }, []);

  return useMemo(() => ({
    roms: [...roms].sort((a, b) => {
      if (a.lastPlayed && b.lastPlayed) {
        return new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime();
      }
      if (a.lastPlayed) return -1;
      if (b.lastPlayed) return 1;
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    }),
    isLoading,
    importRom,
    deleteRom,
    clearAllRoms,
    getRomBase64,
    updateLastPlayed,
    updateCoverImage,
  }), [roms, isLoading, importRom, deleteRom, clearAllRoms, getRomBase64, updateLastPlayed, updateCoverImage]);
});
