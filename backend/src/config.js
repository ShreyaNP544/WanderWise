export const config = {
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMMA_HOSTED_MODEL || 'gemma-4-26b-a4b-it',
    fallbackModel: process.env.GEMMA_HOSTED_FALLBACK_MODEL || 'gemma-4-31b-it',
  },
  ollama: {
    url: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.GEMMA_LOCAL_MODEL || 'gemma3:4b',
  },
  mongoUri: process.env.MONGODB_URI || '',
};
