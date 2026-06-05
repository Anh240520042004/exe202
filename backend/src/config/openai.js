import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const hasValue = (value) => Boolean(value && !value.startsWith('your_') && value !== 'your_openai_api_key_here');
const isGoogleAiKey = (value) => hasValue(value);
const isOpenAiKey = (value) => hasValue(value) && /^sk-[A-Za-z0-9]/.test(value);

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const openAiApiKey = process.env.OPENAI_API_KEY || '';
const geminiModel = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').replace(/^models\//, '');

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

  return {
    ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
    contents,
    generationConfig: {
      temperature: temperature ?? 0.7,
      maxOutputTokens: max_tokens ?? 1000,
    },
  };
};

const callGemini = async (params) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toGeminiRequest(params)),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

  if (!content) {
    throw new Error('Gemini API returned an empty response');
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

  return openaiClient.chat.completions.create(params);
};

const createCompletion = async (params) => {
  const providerErrors = [];

  if (isGoogleAiKey(geminiApiKey)) {
    try {
      return await callGemini(params);
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
