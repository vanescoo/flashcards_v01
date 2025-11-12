
import { SavedWord, RevisionLogEntry, CEFRLevel } from '../types';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed with status ${response.status}: ${errorText}`);
  }
  return response.json();
};

export const fetchData = async (userId: string, language: string): Promise<{ wordBank: SavedWord[], logs: RevisionLogEntry[], cefrLevel: CEFRLevel }> => {
  const response = await fetch(`/api/data?userId=${userId}&language=${language}`);
  return handleResponse(response);
};

export const updateWord = async (userId: string, language: string, word: SavedWord): Promise<any> => {
  const response = await fetch('/api/word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, language, word }),
  });
  return handleResponse(response);
};

export const addLog = async (userId: string, language: string, log: RevisionLogEntry): Promise<any> => {
  const response = await fetch('/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, language, log }),
  });
  return handleResponse(response);
};

export const updateCefrLevel = async (userId: string, language: string, level: CEFRLevel): Promise<any> => {
    const response = await fetch('/api/level', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, language, level }),
    });
    return handleResponse(response);
};

export const generateWord = async (language: string, level: CEFRLevel, exclusionList: string): Promise<any> => {
    const response = await fetch('/api/generate-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, level, exclusionList }),
    });
    return handleResponse(response);
};
