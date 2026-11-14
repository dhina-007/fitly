function createColorScale(mainColor, shades) {
  const s = new String(mainColor);
  Object.assign(s, shades);
  return s;
}

// Primary: High-End Athletic Emerald
const primary = createColorScale('#059669', {
  50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0', 300: '#6EE7B7', 400: '#34D399',
  500: '#10B981', 600: '#059669', 700: '#047857', 800: '#065F46', 900: '#064E3B',
});

// Secondary: Electric Sky / Hydration Cyan
const secondary = createColorScale('#0284C7', {
  50: '#F0F9FF', 100: '#E0F2FE', 200: '#BAE6FD', 300: '#7DD3FC', 400: '#38BDF8',
  500: '#0EA5E9', 600: '#0284C7', 700: '#0369A1', 800: '#075985', 900: '#0C4A6E',
});

// Energy: Vibrant Athletic Tangerine
const energy = createColorScale('#F97316', {
  50: '#FFF7ED', 100: '#FFEDD5', 200: '#FED7AA', 300: '#FDBA74', 400: '#FB923C',
  500: '#F97316', 600: '#EA580C', 700: '#C2410C', 800: '#9A3412', 900: '#7C2D12',
});

// Neutral: Refined Slate & Charcoal (Anti-slop warm-cool balance)
const neutral = createColorScale('#475569', {
  50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8',
  500: '#64748B', 600: '#475569', 700: '#334155', 800: '#1E293B', 900: '#0F172A',
});

export const Colors = {
  primary,
  secondary,
  energy,
  neutral,
  accent: '#10B981',        // Emerald Accent
  mint: '#34D399',
  orange: '#F97316',        // Energy Orange
  success: '#059669',       // Clean Green
  warning: '#D97706',       // Amber
  error: '#DC2626',         // Crimson Red
  destructive: '#DC2626',
  white: '#FFFFFF',
  black: '#000000',
  
  // Surfaces & Backgrounds
  background: '#F8FAFC',    // Subtle off-white canvas
  surface: '#FFFFFF',       // Clean card surface
  surfaceSubtle: '#F1F5F9', // Secondary container
  surfaceDark: '#0F172A',   // High-contrast dark surface
  cardBg: '#FFFFFF',
  cardBgSubtle: '#F8FAFC',

  // Borders & Dividers
  border: '#E2E8F0',        // Standard divider
  borderLight: '#F1F5F9',   // Light subtle border
  borderSubtle: 'rgba(15, 23, 42, 0.06)', // Micro 1px border for Bento cards
  borderHighlight: 'rgba(5, 150, 105, 0.25)', // Active green glow border

  // Text & Content Hierarchy
  textPrimary: '#0F172A',   // Deep Charcoal (avoiding harsh #000)
  textSecondary: '#475569', // Slate secondary
  textMuted: '#94A3B8',     // Muted labels
  textOnDark: '#F8FAFC',

  // Gradients
  gradients: {
    primary: ['#10B981', '#059669'],
    emerald: ['#34D399', '#059669'],
    energy: ['#FB923C', '#F97316'],
    secondary: ['#38BDF8', '#0284C7'],
    dark: ['#1E293B', '#0F172A'],
    card: ['#FFFFFF', '#F8FAFC'],
  },
};

export default Colors;