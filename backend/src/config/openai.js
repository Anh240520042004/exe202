import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../.env', import.meta.url) });

const normalizeEnvValue = (value = '') => String(value)
  .trim()
  .replace(/^['"]|['"]$/g, '')
  .replace(/^OPENAI_API_KEY\s*=\s*/i, '')
  .replace(/\s+/g, '');

const hasValue = (value) => Boolean(
  value &&
  !value.startsWith('your_') &&
  value !== 'your_openai_api_key_here'
);

const openAiApiKey = normalizeEnvValue(process.env.OPENAI_API_KEY);
const openAiModel = normalizeEnvValue(process.env.OPENAI_MODEL || 'gpt-4o-mini');

const maskKey = (key) => ({
  present: hasValue(key),
  length: key?.length || 0,
  prefix: key ? key.slice(0, 6) : '',
  suffix: key ? key.slice(-4) : '',
});

const getClient = () => {
  if (!hasValue(openAiApiKey)) {
    throw new Error('No valid OPENAI_API_KEY configured.');
  }

  return new OpenAI({
    apiKey: openAiApiKey,
  });
};

const createChatCompletion = async (params) => {
  const client = getClient();
  const model = normalizeEnvValue(params.model || openAiModel);

  return client.chat.completions.create({
    ...params,
    model,
  });
};

const getAIProviderDiagnostics = async ({ live = false } = {}) => {
  const diagnostics = {
    provider: 'openai',
    model: openAiModel,
    env: {
      OPENAI_API_KEY: maskKey(openAiApiKey),
    },
    configured: hasValue(openAiApiKey),
  };

  if (!live) {
    return diagnostics;
  }

  try {
    const response = await createChatCompletion({
      messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
      max_tokens: 16,
      temperature: 0,
    });

    diagnostics.live = {
      ok: true,
      sample: response.choices?.[0]?.message?.content || '',
    };
  } catch (error) {
    diagnostics.live = {
      ok: false,
      error: error.message.slice(0, 700),
    };
  }

  return diagnostics;
};

const openai = {
  chat: {
    completions: {
      create: createChatCompletion,
    },
  },
};

export { getAIProviderDiagnostics, openai };
