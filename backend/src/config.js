const isProd = process.env.NODE_ENV === 'production';

export const config = {
  isProd,
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMMA_HOSTED_MODEL || 'gemma-4-26b-a4b-it',
    fallbackModel: process.env.GEMMA_HOSTED_FALLBACK_MODEL || 'gemma-4-31b-it',
  },
  ollama: {
    enabled: process.env.OLLAMA_ENABLED !== 'false',
    url: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.GEMMA_LOCAL_MODEL || 'gemma3:4b',
  },
  ai: {
    // Gemma 4 "thinking": minimal is ~3x faster; raise to low/high for harder reasoning.
    thinking: process.env.GEMMA_THINKING || 'minimal',
    hostedTimeoutMs: Number(process.env.AI_TIMEOUT_MS) || 90_000,
    localTimeoutMs: Number(process.env.AI_LOCAL_TIMEOUT_MS) || 180_000,
    cache: process.env.AI_CACHE !== 'off',
    debug: process.env.AI_DEBUG === 'true',
  },
  mongoUri: process.env.MONGODB_URI || '',
};

export function configWarnings() {
  const warnings = [];
  if (!config.gemini.apiKey) {
    warnings.push('GEMINI_API_KEY is not set: hosted Gemma is disabled (local Ollama / demo trip only).');
  }
  if (!config.mongoUri) {
    warnings.push('MONGODB_URI is not set: trips are stored in memory and lost on restart.');
  }
  return warnings;
}
