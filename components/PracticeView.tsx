
import React, { useState, useEffect, useCallback } from 'react';
import { Word, CEFRLevel, SavedWord, RevisionLogEntry, LanguageOption } from '../types';
import { CEFR_LEVELS, NEW_WORD_LIMIT, SRS_LEVELS, MAX_SRS_LEVEL } from '../constants';
import { generateWord } from '../lib/api';

// --- UTILS ---
const speak = (text: string, langCode: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  } else {
    console.error('Text-to-speech not supported in this browser.');
  }
};

// --- ICONS ---
const LoadingSpinner: React.FC = () => (
  <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.664 0l3.181-3.183m-3.181-4.991-3.182-3.182a8.25 8.25 0 0 0-11.664 0l-3.182 3.182" />
    </svg>
);

// --- SUB-COMPONENTS ---
const SessionSummary: React.FC<{ sessionWords: { new: Word[], repeated: Word[] }, onStartNew: () => void }> = ({ sessionWords, onStartNew }) => {
    const renderTable = (title: string, words: Word[]) => (
        <div className="mb-6">
            <h3 className="text-xl font-semibold text-cyan-400 mb-3">{title} ({words.length})</h3>
            {words.length > 0 ? (
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <ul className="divide-y divide-gray-700">
                        {words.map(word => (
                            <li key={word.id} className="p-3 flex justify-between items-center">
                                <span className="text-white">{word.word}</span>
                                <span className="text-gray-400">{word.translation}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : <p className="text-gray-500">No words in this category.</p>}
        </div>
    );

    return (
        <div className="text-center max-w-lg mx-auto bg-gray-800/50 p-8 rounded-xl shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">Practice Complete!</h2>
            {renderTable("New Words", sessionWords.new)}
            {renderTable("Repeated Words", sessionWords.repeated)}
            <button
                onClick={onStartNew}
                className="mt-4 flex items-center justify-center gap-2 w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
            >
                <RefreshIcon className="w-5 h-5" />
                Start New Session
            </button>
        </div>
    );
};

type PracticeMode = 'review' | 'learn' | 'final-review';

// --- MAIN COMPONENT ---
interface PracticeViewProps {
  wordBank: SavedWord[];
  cefrLevel: CEFRLevel;
  onAddWordToBank: (word: SavedWord) => Promise<void>;
  onAddLog: (log: RevisionLogEntry) => Promise<void>;
  onUpdateCefrLevel: (level: CEFRLevel) => Promise<void>;
  currentLanguage: LanguageOption;
}

export default function PracticeView({ wordBank, cefrLevel, onAddWordToBank, onAddLog, onUpdateCefrLevel, currentLanguage }: PracticeViewProps) {
  const [currentWord, setCurrentWord] = useState<Word | SavedWord | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('review');
  const [reviewQueue, setReviewQueue] = useState<SavedWord[]>([]);
  const [finalReviewQueue, setFinalReviewQueue] = useState<SavedWord[]>([]);

  const [currentCefrLevel, setCurrentCefrLevel] = useState<CEFRLevel>(cefrLevel);
  const [newWordCount, setNewWordCount] = useState(0);
  const [knownWordStreak, setKnownWordStreak] = useState(0);
  const [newWordStreak, setNewWordStreak] = useState(0);
  
  const [isSessionOver, setIsSessionOver] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionWords, setSessionWords] = useState<{ new: Word[], repeated: Word[] }>({ new: [], repeated: [] });
  const [sessionHistory, setSessionHistory] = useState<string[]>([]);

  const startNewSession = useCallback(() => {
    const dueWords = wordBank.filter(word => word.nextReview <= Date.now());
    setReviewQueue(dueWords);
    setCurrentCefrLevel(cefrLevel);
    
    setNewWordCount(0);
    setKnownWordStreak(0);
    setNewWordStreak(0);
    setIsSessionOver(false);
    setSessionHistory([]);
    setSessionWords({ new: [], repeated: [] });
    setFinalReviewQueue([]);
    setSessionStartTime(null);
    setCurrentWord(null);
    setIsLoading(true);

    if (dueWords.length > 0) {
      setPracticeMode('review');
    } else {
      setPracticeMode('learn');
    }
  }, [wordBank, cefrLevel]);

  useEffect(() => {
    startNewSession();
  }, [currentLanguage, startNewSession]);

  const fetchNewWord = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (sessionStartTime === null) setSessionStartTime(Date.now());

    const allKnownWords = [...sessionHistory, ...wordBank.map(w => w.word)];
    const exclusionList = allKnownWords.length > 0 ? `Do not use any of the following words: ${allKnownWords.join(', ')}.` : '';

    try {
      const data = await generateWord(currentLanguage.name, currentCefrLevel, exclusionList);
      
      const newWord: Word = { id: `${data.word}-${currentLanguage.name}`, word: data.word, translation: data.translation, level: data.level as CEFRLevel, language: currentLanguage.name, example: data.example };
      setCurrentWord(newWord);
      setSessionHistory(prev => [...prev, newWord.word]);
      speak(newWord.word, currentLanguage.code);
    } catch (e) {
      console.error(e);
      setError('Failed to generate a new word. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage, sessionHistory, sessionStartTime, wordBank, currentCefrLevel]);

  const endSession = async () => {
    if (isSessionOver) return;
    const duration = sessionStartTime ? Date.now() - sessionStartTime : 0;
    const newLogEntry: RevisionLogEntry = { timestamp: Date.now(), duration, totalWords: sessionHistory.length, newWords: sessionWords.new.length, endLevel: currentCefrLevel };
    await onAddLog(newLogEntry);
    await onUpdateCefrLevel(currentCefrLevel);
    setIsSessionOver(true);
  };

  const loadNextWord = useCallback(() => {
    setIsFlipped(false);
    if (reviewQueue.length > 0) {
      setPracticeMode('review');
      const [nextWord, ...rest] = reviewQueue;
      setCurrentWord(nextWord);
      setReviewQueue(rest);
      setIsLoading(false);
      speak(nextWord.word, currentLanguage.code);
      return;
    }
    if (practiceMode !== 'learn' || newWordCount < NEW_WORD_LIMIT) {
      setPracticeMode('learn');
      fetchNewWord();
      return;
    }
    if (finalReviewQueue.length > 0) {
      setPracticeMode('final-review');
      const [nextWord, ...rest] = finalReviewQueue;
      setCurrentWord(nextWord);
      setFinalReviewQueue(rest);
      setIsLoading(false);
      speak(nextWord.word, currentLanguage.code);
      return;
    }
    endSession();
  }, [reviewQueue, practiceMode, newWordCount, finalReviewQueue, fetchNewWord, currentLanguage.code]);

  useEffect(() => {
    if (isLoading && !isSessionOver) {
      loadNextWord();
    }
  }, [isLoading, isSessionOver, loadNextWord]);

  useEffect(() => {
    if (isFlipped && currentWord?.example) {
      const sentenceToSpeak = currentWord.example.split('(')[0].trim();
      if (sentenceToSpeak) {
        speak(sentenceToSpeak, currentLanguage.code);
      }
    }
  }, [isFlipped, currentWord, currentLanguage.code]);

  const handleResponse = async (status: 'easy' | 'remind' | 'refresh') => {
    if (!currentWord) return;

    let nextCefrLevel = currentCefrLevel;
    const currentCefrLevelIndex = CEFR_LEVELS.indexOf(currentCefrLevel);

    if (practiceMode === 'review' || practiceMode === 'final-review') {
        setNewWordStreak(0);
        const word = currentWord as SavedWord;
        let newSrsLevel = word.srsLevel;
        if (status === 'easy') { // "I know it"
            newSrsLevel = Math.min(word.srsLevel + 1, MAX_SRS_LEVEL);
        } else { // "Remind me later"
            if (practiceMode === 'review') {
                setFinalReviewQueue(prev => [...prev, word]);
                setIsLoading(true);
                return;
            }
            newSrsLevel = Math.max(1, word.srsLevel - 1);
        }
        const updatedWord: SavedWord = { ...word, srsLevel: newSrsLevel, lastReviewed: Date.now(), nextReview: Date.now() + SRS_LEVELS[newSrsLevel] };
        await onAddWordToBank(updatedWord);
    } else { // learn mode
        if (status === 'easy') { // "I know it"
            setKnownWordStreak(0);
            setNewWordStreak(0);
            if (currentCefrLevelIndex < CEFR_LEVELS.length - 1) nextCefrLevel = CEFR_LEVELS[currentCefrLevelIndex + 1];
        } else { // "Remind me later" or "New Word"
            const newSavedWord: SavedWord = { ...currentWord, status, srsLevel: 1, lastReviewed: Date.now(), nextReview: Date.now() + SRS_LEVELS[1] };
            await onAddWordToBank(newSavedWord);
            if (status === 'remind') {
                setNewWordStreak(0);
                setSessionWords(prev => ({ ...prev, repeated: [...prev.repeated, currentWord] }));
                const newStreak = knownWordStreak + 1;
                setKnownWordStreak(newStreak);
                if (newStreak >= 5) {
                    setKnownWordStreak(0);
                    if (currentCefrLevelIndex < CEFR_LEVELS.length - 1) nextCefrLevel = CEFR_LEVELS[currentCefrLevelIndex + 1];
                }
            } else { // refresh
                setKnownWordStreak(0);
                const currentNewWordStreak = newWordStreak + 1;
                setNewWordStreak(currentNewWordStreak);

                if (currentNewWordStreak >= 3) {
                    setNewWordStreak(0);
                    if (currentCefrLevelIndex > 0) {
                        nextCefrLevel = CEFR_LEVELS[currentCefrLevelIndex - 1];
                    }
                }
                
                setSessionWords(prev => ({ ...prev, new: [...prev.new, currentWord] }));
                setNewWordCount(prev => prev + 1);
            }
        }
    }
    
    if (nextCefrLevel !== currentCefrLevel) setCurrentCefrLevel(nextCefrLevel);
    setIsLoading(true);
  };

  if (isSessionOver) {
    return <SessionSummary sessionWords={sessionWords} onStartNew={startNewSession} />;
  }

  const getPracticeStatusText = () => {
    if (practiceMode === 'review') return `Reviewing: ${reviewQueue.length + 1} word(s) due`;
    if (practiceMode === 'learn') return `Learning: ${newWordCount} / ${NEW_WORD_LIMIT} new words`;
    if (practiceMode === 'final-review') return `Final Review: ${finalReviewQueue.length + 1} word(s) left`;
    return '';
  };

  return (
    <div className="max-w-md mx-auto">
      <div className={`flip-card h-64 md:h-72 ${isFlipped ? 'flipped' : ''}`} onClick={() => !isLoading && setIsFlipped(!isFlipped)}>
        <div className="flip-card-inner">
          <div className="flip-card-front bg-gray-800 shadow-lg flex-col justify-center items-center p-6">
            {isLoading ? <LoadingSpinner /> : error ? <p className="text-red-400">{error}</p> : (
              <>
                <span className="text-sm font-semibold bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full mb-4">{currentWord?.level}</span>
                <h2 className="text-4xl md:text-5xl font-bold text-white">{currentWord?.word}</h2>
                <p className="text-gray-400 mt-6 text-sm">Click card to see translation</p>
              </>
            )}
          </div>
          <div className="flip-card-back bg-gray-700 shadow-lg flex-col justify-center items-center p-6 text-center">
            {currentWord && (
              <>
                <h3 className="text-3xl md:text-4xl font-bold text-cyan-400">{currentWord.translation}</h3>
                <p className="text-gray-300 mt-2 text-lg">{currentWord.word}</p>
                {currentWord.example && (
                  <div className="mt-6 border-t border-gray-600 w-full pt-4">
                      <p className="text-sm text-gray-400 mb-2 font-semibold tracking-wider uppercase">Usage</p>
                      <p className="text-gray-200 italic">"{currentWord.example}"</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <button onClick={() => handleResponse('easy')} disabled={isLoading} className="p-3 bg-green-500/20 hover:bg-green-500/40 text-green-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="font-semibold">I know it</span>
          <span className="text-xs block text-green-400/80">{practiceMode === 'learn' ? 'Next level' : 'Level up'}</span>
        </button>
        <button onClick={() => handleResponse('remind')} disabled={isLoading} className="p-3 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="font-semibold">Remind me later</span>
          <span className="text-xs block text-blue-400/80">{practiceMode === 'final-review' ? 'Level down' : 'Review again'}</span>
        </button>
        <button onClick={() => handleResponse('refresh')} disabled={isLoading || practiceMode !== 'learn'} className="p-3 bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="font-semibold">New Word</span>
          <span className="text-xs block text-yellow-400/80">Save to bank</span>
        </button>
      </div>
      <div className="mt-4 text-center text-sm text-gray-500">
        {getPracticeStatusText()}
      </div>
    </div>
  );
}
