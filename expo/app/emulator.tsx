import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { ArrowLeft, AlertTriangle } from 'lucide-react-native';

// Native LibRetro is temporarily disabled in release builds because the native view isn't registering
// reliably yet (causes a fatal RN error). EmulatorJS path is stable and keeps the app usable.
const USE_NATIVE_LIBRETRO_ANDROID = false;

const NATIVE_CORES = ['gambatte', 'mgba', 'fceumm', 'snes9x', 'melonds', 'genesis_plus_gx'];
let LibretroView: React.ComponentType<{ style?: object; romPath: string; coreName: string }> | null = null;
if (Platform.OS === 'android' && USE_NATIVE_LIBRETRO_ANDROID) {
  try {
    LibretroView = require('react-native-libretro-view')?.LibretroView ?? null;
  } catch {
    LibretroView = null;
  }
}
import * as FileSystem from 'expo-file-system/legacy';
import Colors from '@/constants/colors';
import { useRoms } from '@/contexts/RomContext';
import { PLATFORM_CORES, PLATFORM_EJS_SYSTEM, EJS_CORE_OVERRIDES, type RomPlatform } from '@/types/rom';
import { getEmulatorDataPath, ensureEmulatorAsset } from '@/utils/emulator-assets';
import {
  getRomServerPath,
  startEmulatorServer,
  stopEmulatorServer,
} from '@/utils/emulator-server';
import { getEmulatorHtml, getEmulatorHtmlForFileUri } from '@/utils/emulator-html';

export default function EmulatorScreen() {
  const { romId, romName, platform } = useLocalSearchParams<{
    romId: string;
    romName: string;
    platform: string;
  }>();
  const core = platform ? PLATFORM_CORES[platform as RomPlatform] : undefined;
  const ejsSystem = platform
    ? (EJS_CORE_OVERRIDES[platform as RomPlatform] ?? PLATFORM_EJS_SYSTEM[platform as RomPlatform])
    : undefined;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getRomBase64, getRomFileUri, updateCoverImage, isLoading: romsLoading } = useRoms();

  const [html, setHtml] = useState<string | null>(null);
  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [useNativeLibretro, setUseNativeLibretro] = useState(false);
  const [romPathForNative, setRomPathForNative] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [nativeFailed, setNativeFailed] = useState(false);
  const [webViewReloadKey, setWebViewReloadKey] = useState(0);
  const backButtonOpacity = useRef(new Animated.Value(1)).current;
  const webViewRef = useRef<WebView>(null);
  const autoFixAttemptsRef = useRef(0);
  const serverBaseRef = useRef<string | null>(null);
  const autoFixedUrlsRef = useRef<Set<string>>(new Set());

  // When native LibRetro fails (core missing, init error), fall back to EmulatorJS
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = DeviceEventEmitter.addListener('LibretroViewError', (ev: { message?: string }) => {
      console.log('[Emulator] Native LibRetro failed, falling back to EmulatorJS:', ev?.message);
      setUseNativeLibretro(false);
      setRomPathForNative(null);
      setNativeFailed(true);
      setLoading(true);
    });
    return () => sub.remove();
  }, []);

  // Reset native-failed state when switching ROMs so we retry native for each
  useEffect(() => {
    setNativeFailed(false);
  }, [romId, platform]);

  useEffect(() => {
    if (!romId || !platform || !ejsSystem) {
      setError('Missing ROM information.');
      setLoading(false);
      return;
    }
    if (romsLoading) return;

    void (async () => {
      try {
        console.log('[Emulator] Loading ROM:', romId);
        const pathtodata = await getEmulatorDataPath();
        const isLocalEmulator = pathtodata.startsWith('file://') || pathtodata.startsWith('/');

        if (
          USE_NATIVE_LIBRETRO_ANDROID &&
          LibretroView &&
          !nativeFailed &&
          Platform.OS === 'android' &&
          getRomFileUri &&
          NATIVE_CORES.includes(core)
        ) {
          try {
            const romUri = getRomFileUri(romId);
            if (romUri) {
              console.log('[Emulator] Using native Libretro:', core);
              setRomPathForNative(romUri);
              setUseNativeLibretro(true);
              setLoading(false);
              setGameStarted(true);
              return;
            }
          } catch (nativeErr) {
            console.log('[Emulator] Native Libretro failed, falling back to EmulatorJS:', nativeErr);
          }
        }
        if (USE_NATIVE_LIBRETRO_ANDROID && !LibretroView && Platform.OS === 'android') {
          console.log('[Emulator] Native Libretro unavailable (view not registered), using EmulatorJS.');
        }

        // Delta-style: no ROM size limit. On Android, serve ROM from local server (file URL in HTML, no Binder).
        if (Platform.OS !== 'web' && getRomFileUri) {
          try {
            const romUri = getRomFileUri(romId);
            if (romUri) {
              const serverUrl = await startEmulatorServer();
              if (serverUrl) {
                const romServerPath = getRomServerPath(romUri);
                const romUrl = serverUrl + romServerPath;
                // Always serve EmulatorJS assets locally from the same server origin.
                // This avoids EmulatorJS showing "network error" if it falls back to CDN or is offline.
                const dataPath = serverUrl + 'emulatorjs/';
                const emulatorHtml = getEmulatorHtmlForFileUri(romUrl, ejsSystem, romId, {
                  pathtodata: dataPath,
                });
                const htmlPath = (FileSystem.documentDirectory ?? '') + 'emulator.html';
                await FileSystem.writeAsStringAsync(htmlPath, emulatorHtml, {
                  encoding: FileSystem.EncodingType.UTF8,
                });
                serverBaseRef.current = serverUrl.replace(/\/$/, '');
                autoFixAttemptsRef.current = 0;
                autoFixedUrlsRef.current = new Set();
                setSourceUri(serverUrl + 'emulator.html');
                setHtml(null);
                return;
              }
            }
          } catch (fileErr) {
            console.log('[Emulator] Server-based load failed, falling back to base64:', fileErr);
          }
        }

        const base64 = await getRomBase64(romId);
        if (!base64) {
          setError('ROM data not available.');
          setLoading(false);
          return;
        }

        // Fallback: inline base64 (web, or server failed on Android). Android Binder limit ~1MB.
        const base64Size = base64.length * 0.75;
        const BASE64_MAX = 2.5 * 1024 * 1024;
        if (Platform.OS === 'android' && base64Size > BASE64_MAX) {
          setError(
            "Emulator server couldn't start. Try again or restart the app. (Large ROMs need the server.)"
          );
          setLoading(false);
          return;
        }

        console.log('[Emulator] ROM loaded, size:', base64.length, 'bytes base64');
        const pathtodataForBase64 = 'https://cdn.emulatorjs.org/stable/data/';
        const emulatorHtml = getEmulatorHtml(base64, ejsSystem, romId, {
          pathtodata: pathtodataForBase64,
        });
        setHtml(emulatorHtml);
        setSourceUri(null);
      } catch (err) {
        console.log('[Emulator] Error loading ROM:', err);
        const msg = err instanceof Error ? err.message : 'Unknown error';
        const friendly = msg.includes('need WiFi') || msg.includes('Cannot download')
          ? 'First-time setup needs internet. Connect and try again.'
          : msg.includes('not found')
          ? 'ROM not found. It may have been deleted or not yet loaded.'
          : 'Failed to load ROM. The file may have been deleted.';
        setError(friendly);
        setLoading(false);
      }
    })();
  }, [romId, platform, ejsSystem, core, romsLoading, nativeFailed, getRomBase64, getRomFileUri]);

  useEffect(() => {
    return () => {
      if (Platform.OS !== 'web') void stopEmulatorServer();
    };
  }, []);

  useEffect(() => {
    if (!html && !sourceUri) return;
    const timeout = setTimeout(() => {
      if (loading && !gameStarted) {
        console.log('[Emulator] Timeout fallback - dismissing loading overlay');
        setLoading(false);
        setGameStarted(true);
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [html, sourceUri, loading, gameStarted]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'gameStarted') {
          console.log('[Emulator] iframe game started');
          setGameStarted(true);
          setLoading(false);
        } else if (data.type === 'thumbnail') {
          if (romId && data.image) {
            void updateCoverImage(romId, data.image);
          }
        } else if (data.type === 'error') {
          console.log('[Emulator] iframe error:', data.message);
          setError(data.message ?? 'Emulator error.');
          setLoading(false);
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[Emulator] WebView message:', data.type);
      if (data.type === 'gameStarted') {
        console.log('[Emulator] Game started');
        setGameStarted(true);
        setLoading(false);
        Animated.timing(backButtonOpacity, {
          toValue: 0.5,
          duration: 2000,
          useNativeDriver: true,
        }).start();
      } else if (data.type === 'thumbnail') {
        if (romId && data.image) {
          void updateCoverImage(romId, data.image);
        }
      } else if (data.type === 'error') {
        console.log('[Emulator] Emulator error:', data.message);
        setError(data.message ?? 'Emulator encountered an error.');
        setLoading(false);
      } else if (data.type === 'fetchError') {
        const detail = data.url ? `${data.status ?? ''} ${data.url}`.trim() : (data.message ?? 'Fetch failed');
        console.log('[Emulator] Emulator fetch failed:', detail);

        const url: string | undefined = data.url;
        const status: number | undefined = data.status;
        const serverBase = serverBaseRef.current;

        if (
          Platform.OS === 'android' &&
          status === 404 &&
          url &&
          serverBase &&
          url.startsWith(serverBase) &&
          url.includes('/emulatorjs/')
        ) {
          const idx = url.indexOf('/emulatorjs/');
          const relPath = url.slice(idx + '/emulatorjs/'.length);
          const key = `${status} ${relPath}`;

          if (!autoFixedUrlsRef.current.has(key) && autoFixAttemptsRef.current < 5) {
            autoFixedUrlsRef.current.add(key);
            autoFixAttemptsRef.current += 1;
            console.log('[Emulator] Auto-fixing missing asset:', relPath);
            setLoading(true);
            void (async () => {
              try {
                await ensureEmulatorAsset(relPath);
                setWebViewReloadKey((k) => k + 1);
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                setError(`Cannot download emulator (need WiFi). Failed: ${relPath} (${msg})`);
                setLoading(false);
              }
            })();
            return;
          }
        }

        setError(`Network error loading emulator files: ${detail}`);
        setLoading(false);
      }
    } catch {
      console.log('[Emulator] Message parse error');
    }
  }, [backButtonOpacity, romId, updateCoverImage]);

  const handleBack = useCallback(() => {
    if (gameStarted) {
      Alert.alert(
        'Exit Game',
        'Are you sure you want to exit? Unsaved progress may be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  }, [gameStarted, router]);

  const handleBackButtonHover = useCallback(() => {
    Animated.timing(backButtonOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [backButtonOpacity]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar hidden />
        <AlertTriangle size={48} color={Colors.warning} />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {useNativeLibretro && LibretroView && romPathForNative && core ? (
        <LibretroView
          style={styles.nativeView}
          romPath={romPathForNative}
          coreName={core}
        />
      ) : html || sourceUri ? (
        Platform.OS === 'web' ? (
          <iframe
            srcDoc={html ?? ''}
            style={{ flex: 1, width: '100%', height: '100%', border: 'none', backgroundColor: '#000' } as any}
            allow="autoplay; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-popups"
            onLoad={() => {
              console.log('[Emulator] iframe loaded');
            }}
          />
        ) : (
          <WebView
            key={webViewReloadKey}
            ref={webViewRef}
            source={sourceUri ? { uri: sourceUri } : { html: html! }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            onMessage={handleMessage}
            onLoadEnd={() => {
              console.log('[Emulator] WebView loaded');
            }}
            onError={(e) => {
              console.log('[Emulator] WebView error:', e.nativeEvent.description);
              setError(
                'Emulator failed to load. Connect to Wi‑Fi (needed for first load) and try again.'
              );
            }}
            onHttpError={(e) => {
              console.log('[Emulator] WebView HTTP error:', e.nativeEvent.statusCode, e.nativeEvent.url);
            }}
            originWhitelist={['*', 'file://*', 'http://127.0.0.1:*', 'http://localhost:*', 'https://*']}
            allowsFullscreenVideo
            scrollEnabled={false}
            bounces={false}
            overScrollMode="never"
            allowFileAccess
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
            mixedContentMode="always"
            cacheEnabled
            setSupportMultipleWindows={false}
            androidLayerType="hardware"
            androidHardwareAccelerationDisabled={false}
          />
        )
      ) : null}

      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingTitle}>{romName ?? 'Loading'}</Text>
            <Text style={styles.loadingSubtitle}>
              {html || sourceUri ? 'Starting emulator...' : 'Reading ROM file...'}
            </Text>
          </View>
        </View>
      ) : null}

      <Animated.View
        style={[
          styles.backButtonContainer,
          { top: insets.top + 10, opacity: backButtonOpacity },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          onPressIn={handleBackButtonHover}
          activeOpacity={0.8}
          testID="emulator-back-btn"
        >
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  nativeView: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    alignItems: 'center',
    gap: 12,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 8,
  },
  loadingSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  backButtonContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  errorButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
