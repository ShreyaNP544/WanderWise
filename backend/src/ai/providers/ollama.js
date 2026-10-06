import { ProviderError } from './errors.js';

/** Gemma running locally through Ollama: the offline / open-weights fallback. */
export function ollamaProvider({ url, model, timeoutMs }) {
  return {
    name: 'ollama',
    model,
    async complete({ prompt, temperature, maxOutputTokens }) {
      let res;
      try {
        res = await fetch(`${url}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            stream: false,
            format: 'json',
            messages: [{ role: 'user', content: prompt }],
            options: { temperature, num_predict: maxOutputTokens, num_ctx: 16384 },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (err) {
        throw new ProviderError(err.name === 'TimeoutError' ? 'timeout' : 'network', err.message);
      }
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new ProviderError(res.status === 404 ? 'bad_request' : 'unavailable', `${res.status} ${body?.error || ''}`);
      const text = body?.message?.content;
      if (!text) throw new ProviderError('empty', 'No content');
      return { text, finishReason: body.done_reason, tokens: body.eval_count };
    },
  };
}
