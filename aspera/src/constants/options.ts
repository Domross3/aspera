import { CaffeineType, WorkoutType, MusicGenre } from '../types';

export const CAFFEINE_OPTIONS: { type: CaffeineType; label: string; icon: string; defaultMg: number }[] = [
  { type: 'espresso', label: 'Espresso', icon: 'cafe-outline',           defaultMg: 150 },
  { type: 'drip',     label: 'Drip',     icon: 'water-outline',          defaultMg: 100 },
  { type: 'matcha',   label: 'Matcha',   icon: 'leaf-outline',           defaultMg: 70  },
  { type: 'none',     label: 'None',     icon: 'close-circle-outline',   defaultMg: 0   },
];

export const WORKOUT_OPTIONS: { type: WorkoutType; label: string; icon: string }[] = [
  { type: 'run',  label: 'Run',  icon: 'footsteps-outline' },
  { type: 'lift', label: 'Lift', icon: 'barbell-outline'   },
  { type: 'yoga', label: 'Yoga', icon: 'body-outline'      },
  { type: 'walk', label: 'Walk', icon: 'walk-outline'      },
  { type: 'hiit', label: 'HIIT', icon: 'flame-outline'     },
  { type: 'none', label: 'Rest', icon: 'bed-outline'       },
];

export const MUSIC_GENRE_OPTIONS: { type: MusicGenre; label: string; emoji: string }[] = [
  { type: 'lofi',      label: 'Lo-fi',     emoji: '🎵' },
  { type: 'classical', label: 'Classical', emoji: '🎻' },
  { type: 'hiphop',    label: 'Hip-hop',   emoji: '🎤' },
  { type: 'edm',       label: 'EDM',       emoji: '🎛️' },
  { type: 'rock',      label: 'Rock',      emoji: '🎸' },
  { type: 'ambient',   label: 'Ambient',   emoji: '🌊' },
  { type: 'jazz',      label: 'Jazz',      emoji: '🎷' },
  { type: 'podcast',   label: 'Podcast',   emoji: '🎙️' },
  { type: 'none',      label: 'Silence',   emoji: '🔇' },
];

export const CAFFEINE_AMOUNTS = [50, 100, 150, 200, 300];
export const HYDRATION_MAX = 12;

export const MEAL_QUALITY_LABELS: Record<number, string> = {
  1: 'Junk',
  2: 'Poor',
  3: 'Okay',
  4: 'Good',
  5: 'Clean',
};
