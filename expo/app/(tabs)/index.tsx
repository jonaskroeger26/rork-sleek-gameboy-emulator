import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Gamepad2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRoms } from '@/contexts/RomContext';
import { Rom, PLATFORM_CORES } from '@/types/rom';
import RomCard from '@/components/RomCard';
import EmptyLibrary from '@/components/EmptyLibrary';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { roms, isLoading, importRom, deleteRom, getRomBase64, updateLastPlayed } = useRoms();
  const [launching, setLaunching] = useState<string | null>(null);
  const fabScale = useRef(new Animated.Value(1)).current;

  const handlePlay = useCallback(async (rom: Rom) => {
    try {
      setLaunching(rom.id);
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const base64 = await getRomBase64(rom.id);
      if (!base64) {
        Alert.alert('Error', 'ROM data not found. Please re-import.');
        setLaunching(null);
        return;
      }

      await updateLastPlayed(rom.id);
      const core = PLATFORM_CORES[rom.platform];

      router.push({
        pathname: '/emulator',
        params: { romId: rom.id, romName: rom.name, core, base64Length: base64.length.toString() },
      });

      setTimeout(() => setLaunching(null), 1000);
    } catch {
      Alert.alert('Error', 'Failed to load ROM. The file may have been deleted.');
      setLaunching(null);
    }
  }, [getRomBase64, updateLastPlayed, router]);

  const handleDelete = useCallback(async (id: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await deleteRom(id);
  }, [deleteRom]);

  const handleImport = useCallback(async () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await importRom();
  }, [importRom]);

  const handleFabPressIn = useCallback(() => {
    Animated.spring(fabScale, { toValue: 0.9, useNativeDriver: true, friction: 8 }).start();
  }, [fabScale]);

  const handleFabPressOut = useCallback(() => {
    Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  }, [fabScale]);

  const renderItem = useCallback(({ item }: { item: Rom }) => (
    <RomCard
      rom={item}
      onPlay={handlePlay}
      onDelete={handleDelete}
    />
  ), [handlePlay, handleDelete]);

  const keyExtractor = useCallback((item: Rom) => item.id, []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Gamepad2 size={22} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.title}>Retryx</Text>
            <Text style={styles.subtitle}>
              {roms.length > 0 ? `${roms.length} game${roms.length !== 1 ? 's' : ''}` : 'Game Library'}
            </Text>
          </View>
        </View>
      </View>

      {roms.length === 0 ? (
        <EmptyLibrary onImport={handleImport} />
      ) : (
        <FlatList
          data={roms}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {roms.length > 0 ? (
        <Animated.View
          style={[
            styles.fabContainer,
            { bottom: insets.bottom + 90, transform: [{ scale: fabScale }] },
          ]}
        >
          <TouchableOpacity
            style={styles.fab}
            activeOpacity={0.85}
            onPress={handleImport}
            onPressIn={handleFabPressIn}
            onPressOut={handleFabPressOut}
            testID="import-fab"
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      ) : null}

      {launching ? (
        <View style={styles.launchOverlay}>
          <View style={styles.launchCard}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.launchText}>Loading ROM...</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  listContent: {
    paddingTop: 4,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  launchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  launchText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
});
