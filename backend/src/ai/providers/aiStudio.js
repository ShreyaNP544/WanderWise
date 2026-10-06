import { ProviderError } from './errors.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Gemma hosted on Google AI Studio (Gemini API). The key stays server-side. */
export function aiStudioProvider({ apiKey, model, thinking, timeoutMs }) {
  return {
    name: 'ai-studio',
    model,
    async complete({ prompt, temperature, maxOutputTokens }) {
      let res;
      try {
        res = await fetch(`${BASE}/${model}:generateContent`, {
          method: 'POST',
          headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature,
              maxOutputTokens,
              ...(thinking && { thinkingConfig: { thinkingLevel: thinking } }),
            },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (err) {
        throw new ProviderError(err.name === 'TimeoutError' ? 'timeout' : 'network', err.message);
      }

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const kind = res.status === 429 ? 'rate_limited' : res.status >= 500 ? 'unavailable' : 'bad_request';
        throw new ProviderError(kind, `${res.status} ${body?.error?.message?.slice(0, 200) || ''}`);
      }

      const candidate = body?.candidates?.[0];
      // Gemma 4 returns its reasoning as parts flagged `thought: true`; we only want the answer.
      const text = (candidate?.content?.parts || [])
        .filter((p) => !p.thought && p.text)
        .map((p) => p.text)
        .join('');
      if (!text) throw new ProviderError('empty', `No text (finishReason: ${candidate?.finishReason || 'unknown'})`);
      return { text, finishReason: candidate.finishReason, tokens: body.usageMetadata?.totalTokenCount };
    },
  };
}
