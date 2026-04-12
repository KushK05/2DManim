import env from '../config/env.js';

const GEMINI_FLASH_CANDIDATES = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
const MISTRAL_CANDIDATES = ['mistral-medium-latest', 'mistral-small-latest'];

const LEGACY_MODEL_ALIASES = new Map([
  ['gemini-pro', 'gemini-2.5-flash'],
  ['gpt-4o', 'gemini-2.5-flash'],
  ['claude-3.5-sonnet', 'gemini-2.5-flash'],
]);

const MODELS = {
  'mistral-medium-latest': {
    name: 'Mistral Medium Latest',
    costPerGeneration: 0,
    provider: 'mistral',
    candidates: MISTRAL_CANDIDATES,
  },
  'mistral-small-latest': {
    name: 'Mistral Small Latest',
    costPerGeneration: 0,
    provider: 'mistral',
    candidates: ['mistral-small-latest', 'mistral-medium-latest'],
  },
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    costPerGeneration: 0,
    provider: 'gemini',
    candidates: GEMINI_FLASH_CANDIDATES,
  },
  'gemini-2.5-flash-lite': {
    name: 'Gemini 2.5 Flash-Lite',
    costPerGeneration: 0,
    provider: 'gemini',
    candidates: ['gemini-2.5-flash-lite', 'gemini-2.5-flash'],
  },
};

const API_BASES = [
  'https://generativelanguage.googleapis.com/v1',
  'https://generativelanguage.googleapis.com/v1beta',
];

const SYSTEM_PROMPT = `You are a Manim code generator. You produce valid Python code using Manim Community Edition (manim).

Rules:
1. Output ONLY valid Python code - no explanations, no markdown fences.
2. Import from manim: from manim import *
3. Create exactly ONE Scene subclass.
4. The scene class MUST be named GeneratedScene.
5. Use self.play() for animations and self.wait() for pauses.
6. Keep animations concise (under 30 seconds total).
7. Use appropriate Manim objects: MathTex for LaTeX math, Text for plain text, Axes/NumberPlane for graphs.
8. Ensure all code is syntactically correct and runnable.`;

function stripCodeFences(code) {
  return code
    .replace(/^```python\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function normalizeModelKey(modelKey) {
  if (typeof modelKey !== 'string' || !modelKey) return '';
  return LEGACY_MODEL_ALIASES.get(modelKey) || modelKey;
}

function inferProvider(modelKey) {
  if (modelKey.startsWith('gemini')) return 'gemini';
  if (
    modelKey.includes('mistral')
    || modelKey.startsWith('codestral')
    || modelKey.startsWith('open-mistral')
    || modelKey.startsWith('devstral')
    || modelKey.startsWith('magistral')
    || modelKey.startsWith('ministral')
  ) {
    return 'mistral';
  }
  return 'gemini';
}

function buildFallbackCandidates(provider, modelKey) {
  if (provider === 'mistral') {
    return [modelKey, ...MISTRAL_CANDIDATES].filter((value, idx, arr) => arr.indexOf(value) === idx);
  }
  return [modelKey, ...GEMINI_FLASH_CANDIDATES].filter((value, idx, arr) => arr.indexOf(value) === idx);
}

function ensureModelRegistered(modelKey) {
  if (!modelKey || MODELS[modelKey]) return;

  const provider = inferProvider(modelKey);
  MODELS[modelKey] = {
    name: `${modelKey} (Configured)`,
    costPerGeneration: 0,
    provider,
    candidates: buildFallbackCandidates(provider, modelKey),
  };
}

function resolveModel(modelKey) {
  const configuredModel = normalizeModelKey(env.defaultModel);
  const requestedModel = normalizeModelKey(modelKey);

  ensureModelRegistered(configuredModel);
  ensureModelRegistered(requestedModel);

  return MODELS[requestedModel]
    || MODELS[configuredModel]
    || MODELS['mistral-medium-latest']
    || MODELS['gemini-2.5-flash'];
}

function ensureProviderKey(provider) {
  if (provider === 'mistral' && !env.mistralApiKey) {
    throw new Error('MISTRAL_API_KEY is not set');
  }
  if (provider === 'gemini' && !env.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
}

export function getAvailableModels() {
  const entries = Object.entries(MODELS);
  const filtered = entries.filter(([, model]) => (
    model.provider === 'mistral' ? Boolean(env.mistralApiKey) : Boolean(env.geminiApiKey)
  ));

  return (filtered.length > 0 ? filtered : entries).map(([key, model]) => ({
    key,
    name: model.name,
    costPerGeneration: model.costPerGeneration,
  }));
}

async function tryGeminiGenerate(userText, geminiModel, generationConfig, apiBase) {
  const endpoint = `${apiBase}/models/${geminiModel}:generateContent?key=${env.geminiApiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: userText,
            },
          ],
        },
      ],
      generationConfig,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `Gemini API error (${response.status})`;
    throw new Error(message);
  }

  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .map((part) => part?.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return stripCodeFences(text);
}

function extractMistralText(content) {
  if (typeof content === 'string') return content.trim();
  if (!Array.isArray(content)) return '';

  return content
    .map((part) => {
      if (typeof part === 'string') return part;
      if (typeof part?.text === 'string') return part.text;
      if (typeof part?.content === 'string') return part.content;
      return '';
    })
    .join('')
    .trim();
}

async function tryMistralGenerate(userText, mistralModel, generationConfig) {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.mistralApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: mistralModel,
      messages: [
        {
          role: 'user',
          content: userText,
        },
      ],
      temperature: generationConfig.temperature,
      max_tokens: generationConfig.maxOutputTokens,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || data?.message || `Mistral API error (${response.status})`;
    throw new Error(message);
  }

  const content = data?.choices?.[0]?.message?.content;
  const text = extractMistralText(content);

  if (!text) {
    throw new Error('Mistral returned an empty response');
  }

  return stripCodeFences(text);
}

async function runWithModelFallback(modelKey, userText, failureLabel, generationConfig) {
  const model = resolveModel(modelKey);
  ensureProviderKey(model.provider);

  const errors = [];

  for (const candidate of model.candidates) {
    try {
      if (model.provider === 'mistral') {
        return await tryMistralGenerate(userText, candidate, generationConfig);
      }

      for (const apiBase of API_BASES) {
        try {
          return await tryGeminiGenerate(userText, candidate, generationConfig, apiBase);
        } catch (error) {
          errors.push(`gemini:${apiBase}/${candidate}: ${error.message}`);
        }
      }
    } catch (error) {
      errors.push(`${model.provider}:${candidate}: ${error.message}`);
    }
  }

  throw new Error(`${failureLabel}. Attempts: ${errors.join(' | ')}`);
}

export async function generateManimCode(prompt, modelKey) {
  const userText = `${SYSTEM_PROMPT}\n\nGenerate a Manim animation for the following prompt:\n${prompt}`;
  return runWithModelFallback(modelKey, userText, 'Code generation failed', {
    temperature: 0.7,
    maxOutputTokens: 4096,
  });
}

export async function repairManimCode(brokenCode, renderError, modelKey) {
  const compactError = String(renderError || '').slice(0, 1800);
  const userText = `${SYSTEM_PROMPT}

The following code failed during Manim render with a syntax/runtime error.
Return a corrected full Python file that preserves intent.

Error:
${compactError}

Broken code:
${brokenCode}`;

  return runWithModelFallback(modelKey, userText, 'Code repair failed', {
    temperature: 0.2,
    maxOutputTokens: 4096,
  });
}
