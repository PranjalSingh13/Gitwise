import { config } from '../config';

export class GeminiAdapter {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = config.geminiApiKey;
    this.model = config.geminiModel;
  }

  async generateJSON<T>(systemInstruction: string, prompt: string): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: `SYSTEM INSTRUCTIONS:\n${systemInstruction}\n\nUSER PROMPT / CODE:\n${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object matching the requested schema. Do not enclose in markdown code fences.` }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as any;
      const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textOutput) {
        throw new Error('No candidate content received from Gemini.');
      }

      // Clean in case any fence slipped through
      const cleaned = textOutput.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(cleaned) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateText(systemInstruction: string, prompt: string): Promise<string> {
    if (!this.apiKey) throw new Error('Gemini API key is not configured.');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\n${prompt}` }]
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Gemini error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json() as any;
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}
