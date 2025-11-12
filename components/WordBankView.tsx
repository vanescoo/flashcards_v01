
import React from 'react';
import { SavedWord } from '../types';

interface WordBankViewProps {
  wordBank: SavedWord[];
  clearWordBank: () => void;
}

const EmptyState: React.FC = () => (
  <div className="text-center py-16 px-6 bg-gray-800 rounded-lg">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-500 mb-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
    <h3 className="text-xl font-semibold text-white">Your Word Bank is Empty</h3>
    <p className="mt-2 text-gray-400">Start a practice session to save words you want to review.</p>
  </div>
);

const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const WordGroup: React.FC<{ level: number; words: SavedWord[] }> = ({ level, words }) => (
    <div className="mb-8">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">SRS Level {level}</h3>
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <ul className="divide-y divide-gray-700">
                <li className="p-4 grid grid-cols-4 gap-4 font-semibold text-gray-400 text-sm bg-gray-900/50">
                    <span>Word</span>
                    <span>Last Reviewed</span>
                    <span>Next Repetition</span>
                    <span className="text-right">CEFR Level</span>
                </li>
                {words.map((word) => (
                    <li key={word.id} className="p-4 grid grid-cols-4 gap-4 items-center hover:bg-gray-700/50 transition-colors">
                        <div>
                            <p className="font-semibold text-white">{word.word}</p>
                            <p className="text-gray-400 text-sm">{word.translation}</p>
                        </div>
                        <span className="text-gray-300 text-sm">{formatDate(word.lastReviewed)}</span>
                        <span className="text-gray-300 text-sm">{formatDate(word.nextReview)}</span>
                        <div className="text-right">
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-600 text-gray-200">
                                {word.level}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

export default function WordBankView({ wordBank, clearWordBank }: WordBankViewProps) {
  if (wordBank.length === 0) {
    return <EmptyState />;
  }

  const groupedBySrsLevel = wordBank.reduce((acc, word) => {
    const level = word.srsLevel || 1;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(word);
    return acc;
  }, {} as Record<number, SavedWord[]>);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">My Word Bank ({wordBank.length})</h2>
        <button
          onClick={clearWordBank}
          className="px-4 py-2 bg-red-800/50 text-red-300 hover:bg-red-800/80 rounded-lg text-sm font-medium transition-colors"
        >
          Clear All
        </button>
      </div>
      {Object.keys(groupedBySrsLevel).sort((a, b) => parseInt(a) - parseInt(b)).map(levelStr => {
          const level = parseInt(levelStr);
          return <WordGroup key={level} level={level} words={groupedBySrsLevel[level]} />
      })}
    </div>
  );
}
