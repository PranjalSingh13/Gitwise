import path from 'path';
import dotenv from 'dotenv';

// Load .env from monorepo root or current directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:5173',
  aiEnabled: process.env.AI_ENABLED !== 'false',
};
