const Colors = {
  background: '#0A0A0F',
  surface: '#111118',
  card: '#18181F',
  cardBorder: '#242430',
  primary: '#10B981',
  primaryMuted: 'rgba(16, 185, 129, 0.12)',
  primaryLight: '#34D399',
  primaryDark: '#059669',
  text: '#EEEEF2',
  textSecondary: '#85859E',
  textTertiary: '#55556A',
  border: '#222230',
  danger: '#EF4444',
  dangerMuted: 'rgba(239, 68, 68, 0.12)',
  warning: '#F59E0B',
  overlay: 'rgba(0, 0, 0, 0.6)',

  platformGB: '#8BBE47',
  platformGBC: '#6366F1',
  platformGBA: '#EC4899',

  tabBar: '#0D0D12',
  tabBarBorder: '#1A1A24',
} as const;

export const getPlatformColor = (platform: string): string => {
  switch (platform) {
    case 'gb': return Colors.platformGB;
    case 'gbc': return Colors.platformGBC;
    case 'gba': return Colors.platformGBA;
    default: return Colors.primary;
  }
};

export default Colors;
