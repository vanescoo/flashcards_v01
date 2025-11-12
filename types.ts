
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type WordStatus = 'new' | 'known' | 'easy';

export interface Word {
  id: string;
  word: string;
  translation: string;
  level: CEFRLevel;
  language: string;
  example: string;
}

export interface SavedWord extends Word {
  status: 'refresh' | 'remind';
  srsLevel: number;
  lastReviewed: number; // timestamp
  nextReview: number; // timestamp
}

export interface LanguageOption {
  name:string;
  code: string; // For speech synthesis
}

export type View = 'practice' | 'wordbank' | 'stats';

export interface RevisionLogEntry {
  timestamp: number;
  duration: number; // in milliseconds
  totalWords: number;
  newWords: number;
  endLevel: CEFRLevel;
}
