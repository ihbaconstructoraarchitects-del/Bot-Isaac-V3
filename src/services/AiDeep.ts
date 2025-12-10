// src/services/aiDeep.ts

import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { getHistory, addToHistory } from '../services/memory';
import SheetManager from "src/services/sheetsService";


dotenv.config();

const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
  throw new Error("❌ No se encontró la API Key de DeepSeek. Verifica tu .env");
}

const promptPath = path.join(process.cwd(), 'assets', 'Prompts', 'prompt_Deepseek.txt');
const systemPrompt = fs.readFileSync(promptPath, 'utf8');

console.log('🧠 Prompt cargado:', systemPrompt);

export const deepSeekChat = async (userMessage: string, userId: string): Promise<string> => {
  try {
    // Recuperar historial del usuario
    const history = getHistory(userId);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage }
    ];

    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: 'deepseek-chat',
        messages,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiReply = response.data.choices[0].message.content;

   // Guardar en memoria
    addToHistory(userId, "user", userMessage);
    addToHistory(userId, "assistant", aiReply);

// Guardar en Google Sheets
  await SheetManager.saveMessageToUserSheet(userId, "user", userMessage);
  await SheetManager.saveMessageToUserSheet(userId, "assistant", aiReply);


return aiReply;

  } catch (error: any) {
    console.error('❌ Error al usar DeepSeek:', error.response?.data || error.message);
    return 'Lo siento, hubo un problema al conectar con la IA.';
  }
};
