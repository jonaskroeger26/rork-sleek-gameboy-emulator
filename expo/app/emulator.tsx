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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { ArrowLeft, AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRoms } from '@/contexts/RomContext';
import { getEmulatorHtml } from '@/utils/emulator-html';

export default function EmulatorScreen() {
  const { romId, romName, core } = useLocalSearchParams<{
    romId: string;
    romName: string;
    core: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getRomBase64, updateCoverImage } = useRoms();

  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const backButtonOpacity = useRef(new Animated.Value(1)).current;
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (!romId || !core) {
      setError('Missing ROM information.');
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        console.log('[Emulator] Loading ROM:', romId);
        const base64 = await getRomBase64(romId);
        if (!base64) {
          setError('ROM data not available.');
          setLoading(false);
          return;
        }
        // Rough estimate: base64 is ~4/3 of the original binary size.
        const approxBytes = base64.length * 0.75;
        console.log('[Emulator] ROM loaded, approx size:', approxBytes, 'bytes');

        // Soft safety guard: allow up to ~1GB on native before we give up.
        // Note: pushing this high increases the risk of WebView/OS OOM crashes,
        // but this matches the requested behavior.
        const ONE_GB = 1024 * 1024 * 1024;
        if (Platform.OS !== 'web' && approxBytes > ONE_GB) {
          console.log('[Emulator] ROM exceeds 1GB guard on Android');
          setError('This ROM file is larger than 1GB and cannot be loaded.');
          setLoading(false);
          return;
        }

        const emulatorHtml = getEmulatorHtml(base64, core, romId);
        setHtml(emulatorHtml);
      } catch (err) {
        console.log('[Emulator] Error loading ROM:', err);
        setError('Failed to load ROM. The file may have been deleted.');
        setLoading(false);
      }
    })();
  }, [romId, core, getRomBase64]);

  useEffect(() => {
    if (!html) return;
    const timeout = setTimeout(() => {
      if (loading && !gameStarted) {
        console.log('[Emulator] Timeout fallback - dismissing loading overlay');
        setLoading(false);
        setGameStarted(true);
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [html, loading, gameStarted]);

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

      {html ? (
        Platform.OS === 'web' ? (
          <iframe
            srcDoc={html}
            style={{ flex: 1, width: '100%', height: '100%', border: 'none', backgroundColor: '#000' } as any}
            allow="autoplay; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-popups"
            onLoad={() => {
              console.log('[Emulator] iframe loaded');
            }}
          />
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html }}
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
              setError('Emulator failed to load. Check your internet connection.');
            }}
            originWhitelist={['*']}
            allowsFullscreenVideo
            scrollEnabled={false}
            bounces={false}
            overScrollMode="never"
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
            mixedContentMode="always"
          />
        )
      ) : null}

      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingTitle}>{romName ?? 'Loading'}</Text>
            <Text style={styles.loadingSubtitle}>
              {html ? 'Starting emulator...' : 'Reading ROM file...'}
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
