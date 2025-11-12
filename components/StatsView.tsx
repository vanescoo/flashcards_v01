
import React from 'react';
import { RevisionLogEntry, LanguageOption } from '../types';

const formatDuration = (ms: number): string => {
  if (ms === 0) return '0s';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
};

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-gray-800 p-4 rounded-lg text-center shadow-md">
    <p className="text-sm text-gray-400">{label}</p>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

const EmptyState: React.FC = () => (
  <div className="text-center py-16 px-6 bg-gray-800 rounded-lg">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-500 mb-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM21 21l-5.197-5.197" />
    </svg>
    <h3 className="text-xl font-semibold text-white">No Stats Yet</h3>
    <p className="mt-2 text-gray-400">Complete a practice session to see your learning progress here.</p>
  </div>
);

interface StatsViewProps {
    logs: RevisionLogEntry[];
    currentLanguage: LanguageOption;
}

export default function StatsView({ logs, currentLanguage }: StatsViewProps) {
  if (logs.length === 0) {
    return <EmptyState />;
  }

  const totalWordsRevised = logs.reduce((sum, entry) => sum + entry.totalWords, 0);
  const totalNewWords = logs.reduce((sum, entry) => sum + entry.newWords, 0);
  const totalDuration = logs.reduce((sum, entry) => sum + entry.duration, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Overall Statistics for {currentLanguage.name}</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Sessions" value={logs.length} />
        <StatCard label="Total Time" value={formatDuration(totalDuration)} />
        <StatCard label="Total Revised" value={totalWordsRevised} />
        <StatCard label="Total New Words" value={totalNewWords} />
      </div>

      <h3 className="text-xl font-bold text-white mb-4">Session History</h3>
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <ul className="divide-y divide-gray-700">
          <li className="p-4 flex justify-between items-center font-semibold text-gray-400 text-sm bg-gray-900/50">
            <span className="w-1/4">Date</span>
            <span className="w-1/4 text-center">Duration</span>
            <span className="w-1/4 text-center">Words (New)</span>
            <span className="w-1/4 text-right">End Level</span>
          </li>
          {[...logs].reverse().map((entry) => (
            <li key={entry.timestamp} className="p-4 flex justify-between items-center hover:bg-gray-700/50 transition-colors">
              <span className="w-1/4 text-white">{new Date(entry.timestamp).toLocaleDateString()}</span>
              <span className="w-1/4 text-center text-gray-300">{formatDuration(entry.duration)}</span>
              <span className="w-1/4 text-center text-gray-300">{entry.totalWords} ({entry.newWords})</span>
              <span className="w-1/4 text-right">
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-cyan-500/20 text-cyan-300">
                  {entry.endLevel}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
