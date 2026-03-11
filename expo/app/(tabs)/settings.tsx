import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Trash2,
  Info,
  ExternalLink,
  Gamepad2,
  ChevronRight,
  Shield,
  HardDrive,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRoms } from '@/contexts/RomContext';

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingsRow({ icon, label, subtitle, onPress, rightElement, danger }: SettingsRowProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
    >
      <Animated.View style={[styles.row, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
          {icon}
        </View>
        <View style={styles.rowContent}>
          <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
          {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        </View>
        {rightElement ?? (onPress ? <ChevronRight size={18} color={Colors.textTertiary} /> : null)}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { roms, clearAllRoms } = useRoms();
  const [clearing, setClearing] = useState(false);

  const handleClearAll = useCallback(() => {
    if (roms.length === 0) {
      Alert.alert('No ROMs', 'Your library is already empty.');
      return;
    }
    Alert.alert(
      'Clear All ROMs',
      `This will permanently delete ${roms.length} ROM${roms.length > 1 ? 's' : ''} from your library. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            await clearAllRoms();
            setClearing(false);
          },
        },
      ]
    );
  }, [roms, clearAllRoms]);

  const handleOpenLink = useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LIBRARY</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon={<HardDrive size={18} color={Colors.primary} />}
              label="Stored ROMs"
              rightElement={
                <Text style={styles.rowValue}>{roms.length}</Text>
              }
            />
            <View style={styles.rowDivider} />
            <SettingsRow
              icon={<Trash2 size={18} color={Colors.danger} />}
              label={clearing ? 'Clearing...' : 'Clear All ROMs'}
              subtitle="Remove all ROMs from your library"
              onPress={handleClearAll}
              danger
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORTED FORMATS</Text>
          <View style={styles.sectionCard}>
            <View style={styles.formatRow}>
              <View style={[styles.formatBadge, { backgroundColor: 'rgba(139,190,71,0.15)' }]}>
                <Text style={[styles.formatText, { color: '#8BBE47' }]}>.gb</Text>
              </View>
              <Text style={styles.formatLabel}>Game Boy</Text>
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.formatRow}>
              <View style={[styles.formatBadge, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
                <Text style={[styles.formatText, { color: '#6366F1' }]}>.gbc</Text>
              </View>
              <Text style={styles.formatLabel}>Game Boy Color</Text>
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.formatRow}>
              <View style={[styles.formatBadge, { backgroundColor: 'rgba(236,72,153,0.15)' }]}>
                <Text style={[styles.formatText, { color: '#EC4899' }]}>.gba</Text>
              </View>
              <Text style={styles.formatLabel}>Game Boy Advance</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon={<Gamepad2 size={18} color={Colors.primary} />}
              label="Retryx"
              subtitle="Version 1.0.0"
            />
            <View style={styles.rowDivider} />
            <SettingsRow
              icon={<Info size={18} color={Colors.primaryLight} />}
              label="Powered by EmulatorJS"
              subtitle="Open-source browser emulator"
              onPress={() => handleOpenLink('https://emulatorjs.org')}
            />

          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEGAL</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon={<Shield size={18} color={Colors.textSecondary} />}
              label="ROM Disclaimer"
              subtitle="Only use ROMs you legally own"
            />
            <View style={styles.rowDivider} />
            <SettingsRow
              icon={<ExternalLink size={18} color={Colors.textSecondary} />}
              label="EmulatorJS License"
              onPress={() => handleOpenLink('https://github.com/AJS-development/emulatorjs/blob/main/LICENSE')}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowIconDanger: {
    backgroundColor: Colors.dangerMuted,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  rowLabelDanger: {
    color: Colors.danger,
  },
  rowSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginLeft: 60,
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  formatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  formatText: {
    fontSize: 13,
    fontWeight: '700' as const,
    fontFamily: 'monospace',
  },
  formatLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
