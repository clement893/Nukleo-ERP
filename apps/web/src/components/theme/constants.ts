/**
 * Theme Constants
 * Centralized theme configuration constants
 */

// Color constants
export const COLORS = {
  BLUE_500: '#3B82F6',
  GREEN_500: '#10B981',
  RED_500: '#EF4444',
  YELLOW_500: '#F59E0B',
  CYAN_500: '#06B6D4',
  GRAY_900: '#111827',
  GRAY_700: '#374151',
  GRAY_800: '#1F2937',
  GRAY_500: '#6B7280',
  RED_50: '#FEF2F2',
  GREEN_50: '#F0FDF4',
  INDIGO_500: '#6366F1',
  VIOLET_500: '#8B5CF6',
  BLUE_800: '#1E40AF',
  EMERALD_600: '#059669',
  PINK_500: '#EC4899',
  AMBER_500: '#F59E0B',
  BLACK: '#000000',
} as const;

// Font options
export const FONT_OPTIONS = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Merriweather', value: 'Merriweather' },
] as const;

// Border radius options
export const BORDER_RADIUS_OPTIONS = [
  { label: 'Petit (0.25rem)', value: '0.25rem' },
  { label: 'Moyen (0.5rem)', value: '0.5rem' },
  { label: 'Grand (0.75rem)', value: '0.75rem' },
  { label: 'Très grand (1rem)', value: '1rem' },
] as const;

