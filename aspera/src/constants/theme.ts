import { TextStyle, ViewStyle } from 'react-native';

export const COLORS = {
  background: '#090C14',
  surface: '#111827',
  surfaceElevated: '#1C2535',

  accent: '#6C63FF',
  accentAlt: '#00D4FF',
  accentGlow: 'rgba(108,99,255,0.3)',

  text: '#F0F4FF',
  textSecondary: '#9BA8C4',
  textMuted: '#4A5568',

  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',

  border: 'rgba(255,255,255,0.08)',
  borderAccent: 'rgba(108,99,255,0.4)',

  gradients: {
    card: ['#1C2535', '#111827'] as string[],
    accent: ['#6C63FF', '#4F46E5'] as string[],
    energy: ['#F59E0B', '#EF4444'] as string[],
    focus: ['#6C63FF', '#00D4FF'] as string[],
    success: ['#10B981', '#059669'] as string[],
    background: ['#090C14', '#0F1729'] as string[],
  },

  intensity: [
    '#3B82F6', '#60A5FA', '#34D399',
    '#A3E635', '#FCD34D', '#FBBF24',
    '#F97316', '#EF4444', '#DC2626', '#991B1B',
  ],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const TYPOGRAPHY: Record<string, TextStyle> = {
  hero: { fontSize: 36, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '500', letterSpacing: 0.3 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
};

export const SHADOWS: Record<string, ViewStyle> = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
};
