import { GeminiAdapter } from './gemini-adapter';
import { GroqAdapter } from './groq-adapter';

export class AIOrchestrator {
  private gemini: GeminiAdapter;
  private groq: GroqAdapter;
  private responseCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

  constructor() {
    this.gemini = new GeminiAdapter();
    this.groq = new GroqAdapter();
  }

  async generateJSON<T>(systemInstruction: string, prompt: string, cacheKey?: string): Promise<T> {
    if (cacheKey && this.responseCache.has(cacheKey)) {
      const cached = this.responseCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        return cached.data as T;
      }
    }

    try {
      // Primary: Google Gemini 2.5 Flash
      const result = await this.gemini.generateJSON<T>(systemInstruction, prompt);
      if (cacheKey) {
        this.responseCache.set(cacheKey, { data: result, timestamp: Date.now() });
      }
      return result;
    } catch (geminiError: any) {
      console.warn(`[AIOrchestrator] Gemini failed (${geminiError.message}), falling back to Groq...`);
      try {
        // Fallback: Groq
        const fallbackResult = await this.groq.generateJSON<T>(systemInstruction, prompt);
        if (cacheKey) {
          this.responseCache.set(cacheKey, { data: fallbackResult, timestamp: Date.now() });
        }
        return fallbackResult;
      } catch (groqError: any) {
        console.error(`[AIOrchestrator] Both AI providers failed! Groq error:`, groqError.message);
        throw new Error(`AI generation failed across all providers: ${geminiError.message} | ${groqError.message}`);
      }
    }
  }
}

export const aiOrchestrator = new AIOrchestrator();
