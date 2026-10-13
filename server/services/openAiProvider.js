const DEFAULT_MODEL = 'gpt-6-astra';

const isConfigured = () => Boolean(process.env.OPENAI_API_KEY);

const generateText = async ({ instructions, input, maxOutputTokens = 800 }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error('AI suggestions are unavailable until the backend provider is configured.');
    error.code = 'AI_NOT_CONFIGURED';
    throw error;
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      instructions,
      input,
      max_output_tokens: maxOutputTokens,
      store: false,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('The AI provider could not complete this request.');
    error.code = 'AI_PROVIDER_ERROR';
    error.status = response.status === 429 ? 503 : 502;
    throw error;
  }
  const outputText = (data.output || [])
    .filter((item) => item.type === 'message')
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text')
    .map((item) => item.text || '')
    .join('\n')
    .trim();
  if (!outputText) {
    const error = new Error('The AI provider returned no text.');
    error.code = 'AI_EMPTY_RESPONSE';
    error.status = 502;
    throw error;
  }
  return outputText;
};

module.exports = { generateText, isConfigured };
