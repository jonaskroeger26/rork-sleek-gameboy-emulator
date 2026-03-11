import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Image,
} from 'react-native';
import { Gamepad2, Clock, Trash2, ChevronRight } from 'lucide-react-native';
import Colors, { getPlatformColor } from '@/constants/colors';
import { Rom, PLATFORM_LABELS } from '@/types/rom';

interface RomCardProps {
  rom: Rom;
  onPlay: (rom: Rom) => void;
  onDelete: (id: string) => void;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function RomCard({ rom, onPlay, onDelete }: RomCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const platformColor = getPlatformColor(rom.platform);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [scaleAnim]);

  const handleLongPress = useCallback(() => {
    Alert.alert(
      rom.name,
      `${rom.fileName}\n${PLATFORM_LABELS[rom.platform]}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(rom.id),
        },
      ]
    );
  }, [rom, onDelete]);

  const handleDeletePress = useCallback(() => {
    Alert.alert('Delete ROM', `Remove "${rom.name}" from library?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(rom.id) },
    ]);
  }, [rom, onDelete]);

  const hasCover = !!rom.coverImage;

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPlay(rom)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        delayLongPress={500}
        testID={`rom-card-${rom.id}`}
      >
        <View style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: `${platformColor}15` }]}>
            {hasCover ? (
              <Image
                source={{ uri: rom.coverImage }}
                style={styles.iconImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.iconPlaceholder}>
                <Gamepad2 size={22} color={platformColor} />
              </View>
            )}
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.romName} numberOfLines={1}>
              {rom.name}
            </Text>
            <View style={styles.metaRow}>
              <View style={[styles.platformBadge, { backgroundColor: `${platformColor}20` }]}>
                <Text style={[styles.platformText, { color: platformColor }]}>
                  {PLATFORM_LABELS[rom.platform]}
                </Text>
              </View>
              {rom.lastPlayed ? (
                <View style={styles.timeRow}>
                  <Clock size={10} color={Colors.textTertiary} />
                  <Text style={styles.timeText}>
                    {formatTimeAgo(rom.lastPlayed)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.newBadge}>New</Text>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeletePress}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Trash2 size={15} color={Colors.textTertiary} />
            </TouchableOpacity>
            <ChevronRight size={16} color={Colors.textTertiary} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default React.memo(RomCard);

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 10,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  iconPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    gap: 4,
  },
  romName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  platformBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  platformText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  newBadge: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteBtn: {
    padding: 4,
  },
});
