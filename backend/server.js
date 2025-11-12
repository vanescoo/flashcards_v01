
import express from 'express';
import cors from 'cors';
import { Firestore } from '@google-cloud/firestore';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const firestore = new Firestore();
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

app.use(cors());
app.use(express.json());

const getProfileRef = (userId) => firestore.collection('profiles').doc(userId);

// Endpoint to get all data for a user and language
app.get('/api/data', async (req, res) => {
  const { userId, language } = req.query;
  if (!userId || !language) {
    return res.status(400).send('userId and language are required');
  }

  try {
    const profileRef = getProfileRef(userId);
    const langRef = profileRef.collection('languages').doc(language);

    const [langDoc, wordBankSnapshot, logsSnapshot] = await Promise.all([
      langRef.get(),
      langRef.collection('wordBank').get(),
      langRef.collection('logs').orderBy('timestamp', 'asc').get(),
    ]);

    const wordBank = wordBankSnapshot.docs.map(doc => doc.data());
    const logs = logsSnapshot.docs.map(doc => doc.data());
    const cefrLevel = langDoc.exists ? langDoc.data().cefrLevel : 'A1';

    res.status(200).json({ wordBank, logs, cefrLevel });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint to add/update a word in the word bank
app.post('/api/word', async (req, res) => {
  const { userId, language, word } = req.body;
  if (!userId || !language || !word) {
    return res.status(400).send('userId, language, and word are required');
  }

  try {
    const wordRef = getProfileRef(userId).collection('languages').doc(language).collection('wordBank').doc(word.id);
    await wordRef.set(word, { merge: true });
    res.status(201).send({ message: 'Word updated successfully' });
  } catch (error) {
    console.error('Error updating word:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint to add a revision log
app.post('/api/log', async (req, res) => {
  const { userId, language, log } = req.body;
  if (!userId || !language || !log) {
    return res.status(400).send('userId, language, and log are required');
  }

  try {
    const logsCollection = getProfileRef(userId).collection('languages').doc(language).collection('logs');
    await logsCollection.add(log);
    res.status(201).send({ message: 'Log added successfully' });
  } catch (error) {
    console.error('Error adding log:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint to update the last used CEFR level
app.put('/api/level', async (req, res) => {
    const { userId, language, level } = req.body;
    if (!userId || !language || !level) {
        return res.status(400).send('userId, language, and level are required');
    }

    try {
        const langRef = getProfileRef(userId).collection('languages').doc(language);
        await langRef.set({ cefrLevel: level }, { merge: true });
        res.status(200).send({ message: 'Level updated successfully' });
    } catch (error) {
        console.error('Error updating level:', error);
        res.status(500).send('Internal Server Error');
    }
});

// New endpoint for generating words
app.post('/api/generate-word', async (req, res) => {
    const { language, level, exclusionList } = req.body;
    if (!language || !level) {
        return res.status(400).send('language and level are required');
    }

    const prompt = `Generate a single, common vocabulary word for a language learner. Language: ${language}. CEFR Level: ${level}. Provide the word, its CEFR level, its English translation, and a simple example sentence using the word in ${language} with its English translation in parentheses. ${exclusionList} Ensure the word strictly belongs to the specified CEFR level.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { role: 'user', parts: [{ text: prompt }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        word: { type: Type.STRING },
                        level: { type: Type.STRING },
                        translation: { type: Type.STRING },
                        example: { type: Type.STRING }
                    },
                    required: ['word', 'level', 'translation', 'example']
                }
            }
        });

        const data = JSON.parse(response.text);
        res.status(200).json(data);

    } catch (error) {
        console.error('Error generating word with Gemini:', error);
        res.status(500).send('Internal Server Error while calling Gemini API');
    }
});


const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
