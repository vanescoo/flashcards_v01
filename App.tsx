
import React, { useState, useCallback, useEffect } from 'react';
import PracticeView from './components/PracticeView';
import WordBankView from './components/WordBankView';
import StatsView from './components/StatsView';
import { SavedWord, View, LanguageOption, RevisionLogEntry, CEFRLevel } from './types';
import { LANGUAGES, INITIAL_LEVEL } from './constants';
import { fetchData, updateWord, addLog, updateCefrLevel } from './lib/api';

const Header: React.FC<{ 
  currentView: View; 
  setView: (view: View) => void;
  currentLanguage: LanguageOption;
  setLanguage: (language: LanguageOption) => void;
}> = ({ currentView, setView, currentLanguage, setLanguage }) => (
  <header className="bg-gray-800/50 backdrop-blur-sm p-4 sticky top-0 z-10">
    <nav className="container mx-auto flex justify-between items-center">
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-cyan-400">
          <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v1.286a.75.75 0 0 0 .75.75h.008a.75.75 0 0 0 .75-.75v-.286c.01-.002.02-.005.03-.008A7.235 7.235 0 0 1 6 4.5c1.956 0 3.723.796 5.008 2.085l-1.816 1.816A.75.75 0 0 0 10.5 9.75h4.5a.75.75 0 0 0 .75-.75v-4.5a.75.75 0 0 0-1.32-.53l-1.18 1.18z" />
          <path d="M20.25 10.5h-.008a.75.75 0 0 0-.75.75v.286c-.01.002-.02.005-.03.008a7.235 7.235 0 0 1-2.258 1.417 9.735 9.735 0 0 0-3.25-.555 9.707 9.707 0 0 0-5.25 1.533l1.816-1.816A.75.75 0 0 0 9 11.25H4.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.32.53l1.18-1.18A9.707 9.707 0 0 0 12 21a9.735 9.735 0 0 0 3.25-.555.75.75 0 0 0 .5-.707v-1.286a.75.75 0 0 0-.75-.75h-.008a.75.75 0 0 0-.75.75v.286c-.01.002-.02.005-.03.008a7.235 7.235 0 0 1-2.258-1.417c1.956 0 3.723-.796 5.008-2.085l1.816 1.816a.75.75 0 0 0 1.32-.53v-4.5a.75.75 0 0 0-.75-.75z" />
        </svg>
        <h1 className="text-xl font-bold text-white">Gemini Flashcards</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex space-x-2 rounded-lg bg-gray-700 p-1">
          <button onClick={() => setView('practice')} aria-pressed={currentView === 'practice'} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${currentView === 'practice' ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Practice</button>
          <button onClick={() => setView('wordbank')} aria-pressed={currentView === 'wordbank'} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${currentView === 'wordbank' ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Word Bank</button>
          <button onClick={() => setView('stats')} aria-pressed={currentView === 'stats'} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${currentView === 'stats' ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Stats</button>
        </div>
        <select
          id="language-select"
          value={currentLanguage.name}
          onChange={(e) => {
            const newLang = LANGUAGES.find(l => l.name === e.target.value)!;
            setLanguage(newLang);
          }}
          className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg p-2 focus:ring-cyan-500 focus:border-cyan-500"
        >
          {LANGUAGES.map(lang => <option key={lang.name} value={lang.name}>{lang.name}</option>)}
        </select>
      </div>
    </nav>
  </header>
);

const ProfileSelector: React.FC<{ profileId: string; setProfileId: (id: string) => void; onEnter: () => void }> = ({ profileId, setProfileId, onEnter }) => (
    <div className="container mx-auto mt-10 max-w-md p-6 bg-gray-800 rounded-lg shadow-xl">
        <h2 className="text-lg font-semibold mb-4 text-white">Enter Your Profile ID</h2>
        <p className="text-sm text-gray-400 mb-4">Enter a unique ID to save and load your progress. You can share this ID to use the same profile on different devices.</p>
        <div className="flex gap-2">
            <input 
                type="text"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                placeholder="e.g., my-secret-id"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2.5 focus:ring-cyan-500 focus:border-cyan-500"
            />
            <button onClick={onEnter} className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors">
                Enter
            </button>
        </div>
    </div>
);

export default function App() {
  const [view, setView] = useState<View>('practice');
  const [profileId, setProfileId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(LANGUAGES[0]);
  
  const [wordBank, setWordBank] = useState<SavedWord[]>([]);
  const [logs, setLogs] = useState<RevisionLogEntry[]>([]);
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>(INITIAL_LEVEL);
  const [isLoading, setIsLoading] = useState(false);

  const loadDataForUser = useCallback(async (pid: string, lang: string) => {
    if (!pid || !lang) return;
    setIsLoading(true);
    try {
      const data = await fetchData(pid, lang);
      setWordBank(data.wordBank);
      setLogs(data.logs);
      setCefrLevel(data.cefrLevel);
    } catch (error) {
      console.error("Failed to load user data:", error);
      // Reset to default state if user/language combo doesn't exist
      setWordBank([]);
      setLogs([]);
      setCefrLevel(INITIAL_LEVEL);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadDataForUser(profileId, currentLanguage.name);
    }
  }, [isLoggedIn, profileId, currentLanguage, loadDataForUser]);

  const handleLogin = () => {
      if (profileId.trim()) {
          setIsLoggedIn(true);
      }
  };

  const handleAddWordToBank = async (word: SavedWord) => {
    setWordBank(prevBank => {
        const exists = prevBank.some(w => w.id === word.id);
        if (exists) {
            return prevBank.map(w => w.id === word.id ? word : w);
        }
        return [...prevBank, word];
    });
    await updateWord(profileId, currentLanguage.name, word);
  };

  const handleClearWordBank = async () => {
      const newBank: SavedWord[] = [];
      for (const word of wordBank) {
          await updateWord(profileId, currentLanguage.name, { ...word, srsLevel: -1 }); // Or a delete endpoint
      }
      setWordBank(newBank);
  };

  const handleAddLog = async (log: RevisionLogEntry) => {
      setLogs(prev => [...prev, log]);
      await addLog(profileId, currentLanguage.name, log);
  };

  const handleUpdateCefrLevel = async (level: CEFRLevel) => {
      setCefrLevel(level);
      await updateCefrLevel(profileId, currentLanguage.name, level);
  };

  if (!isLoggedIn) {
      return (
          <div className="min-h-screen bg-gray-900 text-gray-50">
              <ProfileSelector profileId={profileId} setProfileId={setProfileId} onEnter={handleLogin} />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-50">
      <Header currentView={view} setView={setView} currentLanguage={currentLanguage} setLanguage={setCurrentLanguage} />
      <main className="container mx-auto p-4 md:p-6">
        {isLoading ? <p>Loading profile data...</p> : (
            <>
                {view === 'practice' && <PracticeView 
                    wordBank={wordBank}
                    cefrLevel={cefrLevel}
                    onAddWordToBank={handleAddWordToBank} 
                    onAddLog={handleAddLog}
                    onUpdateCefrLevel={handleUpdateCefrLevel}
                    currentLanguage={currentLanguage} 
                />}
                {view === 'wordbank' && <WordBankView wordBank={wordBank} clearWordBank={handleClearWordBank} />}
                {view === 'stats' && <StatsView logs={logs} currentLanguage={currentLanguage} />}
            </>
        )}
      </main>
    </div>
  );
}
