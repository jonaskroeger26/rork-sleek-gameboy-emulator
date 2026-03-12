/**
 * Local HTTP server for serving emulator + ROMs. Delta-style: everything from local files.
 * Avoids file:// origin restrictions in WebView.
 */
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

let StaticServer: any = null;
let serverInstance: any = null;

async function getStaticServer() {
  if (StaticServer) return StaticServer;
  StaticServer = (await import('react-native-static-server')).default;
  return StaticServer;
}

/** Path for native modules - strips file:// prefix for server root */
function toNativePath(uri: string): string {
  if (!uri) return '';
  return uri.replace(/^file:\/\//, '');
}

/** Convert ROM file URI to server-relative path (e.g. roms/123_game.gba) */
export function getRomServerPath(romFileUri: string): string {
  const docDir = (FileSystem.documentDirectory ?? '').replace(/\/?$/, '/');
  if (romFileUri.startsWith(docDir)) {
    return romFileUri.slice(docDir.length);
  }
  const filename = romFileUri.split('/').pop() ?? 'rom.bin';
  return 'roms/' + filename;
}

export async function startEmulatorServer(): Promise<string> {
  if (Platform.OS === 'web') {
    return '';
  }

  const SS = await getStaticServer();
  const docDir = FileSystem.documentDirectory ?? '';
  const rootPath = toNativePath(docDir);

  if (serverInstance) {
    try {
      const running = await serverInstance.isRunning();
      if (running && serverInstance.origin) {
        const base = serverInstance.origin.replace(/\/$/, '');
        return base + '/';
      }
    } catch {}
    serverInstance = null;
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      serverInstance = new SS(0, rootPath, { localOnly: true });
      const origin = await serverInstance.start();
      const baseUrl = (origin ?? '').replace(/\/$/, '');
      if (baseUrl) {
        console.log('[EmulatorServer] Serving at', baseUrl);
        return baseUrl + '/';
      }
    } catch (e) {
      console.warn('[EmulatorServer] Start attempt', attempt + 1, 'failed:', e);
      serverInstance = null;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }
  return '';
}

export async function stopEmulatorServer(): Promise<void> {
  if (serverInstance) {
    try {
      serverInstance.stop?.();
    } catch {}
    serverInstance = null;
  }
}
