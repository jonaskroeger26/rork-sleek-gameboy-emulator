import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Gamepad2, Plus, Download } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface EmptyLibraryProps {
  onImport: () => void;
}

export default function EmptyLibrary({ onImport }: EmptyLibraryProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Animated.View style={[styles.iconRing, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.iconInner}>
          <Gamepad2 size={40} color={Colors.primary} />
        </View>
      </Animated.View>

      <Text style={styles.title}>No Games Yet</Text>
      <Text style={styles.subtitle}>
        Import your ROM files to start playing.{'\n'}
        NES, SNES, N64, Game Boy, GBA, DS, Genesis
      </Text>

      <TouchableOpacity
        style={styles.importButton}
        activeOpacity={0.8}
        onPress={onImport}
        testID="empty-import-btn"
      >
        <Plus size={20} color="#fff" />
        <Text style={styles.importButtonText}>Import ROM</Text>
      </TouchableOpacity>

      <View style={styles.hintContainer}>
        <Download size={14} color={Colors.textTertiary} />
        <Text style={styles.hintText}>
          Download ROMs from trusted sources, then import them here
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  hintText: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
