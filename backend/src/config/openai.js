import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../.env', import.meta.url) });

const normalizeEnvValue = (value = '') => value.trim().replace(/^['"]|['"]$/g, '');
const hasValue = (value) => Boolean(value && !value.startsWith('your_') && value !== 'your_openai_api_key_here');
const isOpenAiKey = (value) => hasValue(value) && /^sk-[A-Za-z0-9]/.test(value);

const geminiApiKeys = [
  normalizeEnvValue(process.env.GEMINI_API_KEY),
  normalizeEnvValue(process.env.GOOGLE_API_KEY),
].filter(hasValue).filter((key, index, keys) => keys.indexOf(key) === index);
const openAiApiKey = normalizeEnvValue(process.env.OPENAI_API_KEY);
const geminiModel = normalizeEnvValue(process.env.GEMINI_MODEL || 'gemini-2.5-flash').replace(/^models\//, '');
const openAiModel = normalizeEnvValue(process.env.OPENAI_MODEL || 'gpt-4o-mini');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toGeminiRequest = ({ messages, max_tokens, temperature }) => {
  const systemText = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n');

  const contents = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content || '' }],
    }));

  const generationConfig = {
    temperature: temperature ?? 0.7,
    maxOutputTokens: max_tokens ?? 1000,
  };

  if (/^gemini-2\.5/i.test(geminiModel)) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  return {
    ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
    contents,
    generationConfig,
  };
};

const callGemini = async (params, apiKey) => {
  let response;
  let errorText = '';

  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toGeminiRequest(params)),
      }
    );

    if (response.ok || response.status !== 503 || attempt === 2) {
      break;
    }

    errorText = await response.text();
    await sleep(500 * (attempt + 1));
  }

  if (!response.ok) {
    errorText ||= await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

  if (!content) {
    throw new Error(`Gemini API returned an empty response. Finish reason: ${data.candidates?.[0]?.finishReason || 'unknown'}`);
  }

  const usage = data.usageMetadata || {};
  return {
    choices: [{ message: { content } }],
    usage: {
      prompt_tokens: usage.promptTokenCount || 0,
      completion_tokens: usage.candidatesTokenCount || 0,
      total_tokens: usage.totalTokenCount || 0,
    },
  };
};

const callOpenAI = async (params) => {
  const openaiClient = new OpenAI({
    apiKey: openAiApiKey,
  });

  const model = !params.model || params.model === 'gpt-3.5-turbo'
    ? openAiModel
    : params.model;

  return openaiClient.chat.completions.create({
    ...params,
    model,
  });
};

const createCompletion = async (params) => {
  const providerErrors = [];

  for (const apiKey of geminiApiKeys) {
    try {
      return await callGemini(params, apiKey);
    } catch (error) {
      providerErrors.push(`Gemini: ${error.message}`);
    }
  }

  if (isOpenAiKey(openAiApiKey)) {
    try {
      return await callOpenAI(params);
    } catch (error) {
      providerErrors.push(`OpenAI: ${error.message}`);
    }
  }

  if (providerErrors.length > 0) {
    throw new Error(providerErrors.join(' | '));
  }

  throw new Error('No valid AI API key configured. Set GEMINI_API_KEY or OPENAI_API_KEY.');
};

const openai = {
  chat: {
    completions: {
      create: createCompletion,
    },
  },
};

export { openai };
