import { config } from '../config';

export class GroqAdapter {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = config.groqApiKey;
    this.model = config.groqModel;
  }

  async generateJSON<T>(systemInstruction: string, prompt: string): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Groq API key is not configured.');
    }

    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: `${systemInstruction}\nReturn ONLY valid JSON with no markdown wrapping.` },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Groq API error (${response.status}): ${await response.text()}`);
      }

      const data = await response.json() as any;
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from Groq.');
      }

      const cleaned = content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(cleaned) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
