import env from '../config/env.js';

const MODELS = {
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    costPerGeneration: 0,
    geminiCandidates: ['gemini-2.0-flash', 'gemini-1.5-flash'],
  },
  'gemini-pro': {
    name: 'Gemini Pro (Alias)',
    costPerGeneration: 0,
    geminiCandidates: ['gemini-2.0-flash', 'gemini-1.5-flash'],
  },
  'gpt-4o': {
    name: 'GPT-4o (Alias to Gemini)',
    costPerGeneration: 0,
    geminiCandidates: ['gemini-2.0-flash', 'gemini-1.5-flash'],
  },
  'claude-3.5-sonnet': {
    name: 'Claude 3.5 Sonnet (Alias to Gemini)',
    costPerGeneration: 0,
    geminiCandidates: ['gemini-2.0-flash', 'gemini-1.5-flash'],
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

function resolveModel(modelKey) {
  const configuredModel = env.geminiModel;
  if (!MODELS[configuredModel]) {
    MODELS[configuredModel] = {
      name: `${configuredModel} (Configured)`,
      costPerGeneration: 0,
      geminiCandidates: [configuredModel, 'gemini-2.0-flash', 'gemini-1.5-flash'],
    };
  }

  return MODELS[modelKey] || MODELS[configuredModel] || MODELS['gemini-2.0-flash'];
}

export function getAvailableModels() {
  return Object.entries(MODELS).map(([key, model]) => ({
    key,
    name: model.name,
    costPerGeneration: model.costPerGeneration,
  }));
}

async function tryGeminiGenerate(prompt, geminiModel, apiBase) {
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
              text: `${SYSTEM_PROMPT}\n\nGenerate a Manim animation for the following prompt:\n${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
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

export async function generateManimCode(prompt, modelKey) {
  if (!env.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const model = resolveModel(modelKey);
  const errors = [];

  for (const apiBase of API_BASES) {
    for (const geminiModel of model.geminiCandidates) {
      try {
        return await tryGeminiGenerate(prompt, geminiModel, apiBase);
      } catch (error) {
        errors.push(`${apiBase}/${geminiModel}: ${error.message}`);
      }
    }
  }

  throw new Error(`Gemini generation failed. Attempts: ${errors.join(' | ')}`);
}
