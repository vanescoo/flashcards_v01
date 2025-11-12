
import { CEFRLevel, LanguageOption } from './types';

export const LANGUAGES: LanguageOption[] = [
  { name: 'Dutch', code: 'nl-NL' },
  { name: 'Italian', code: 'it-IT' },
  { name: 'French', code: 'fr-FR' },
  { name: 'Spanish', code: 'es-ES' },
];

export const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const INITIAL_LEVEL: CEFRLevel = 'A1';

export const NEW_WORD_LIMIT = 5;

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

export const SRS_LEVELS: { [key: number]: number } = {
  1: 3 * HOUR,
  2: 24 * HOUR,
  3: 48 * HOUR,
  4: 5 * DAY,
  5: 20 * DAY,
  6: 100 * DAY,
  7: 365 * DAY,
};

export const MAX_SRS_LEVEL = Object.keys(SRS_LEVELS).length;
