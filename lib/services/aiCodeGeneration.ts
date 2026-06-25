const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const DEFAULT_MISTRAL_MODEL = 'mistral-medium-latest';

type AiProvider = 'gemini' | 'mistral' | 'local';

export type AiCodeGenerationResult = {
  code: string;
  model: string;
  provider: AiProvider;
  usedMock: boolean;
};

export class ManimCodeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ManimCodeValidationError';
  }
}

const systemPrompt = [
  'You generate Python code for Manim Community Edition.',
  'Return only executable Python code, with no Markdown fences and no explanation.',
  'The code must import from manim and define exactly one scene class named GeneratedScene that extends Scene.',
  'The scene should be 2D, polished, concise, and render without external files or network access.',
  'Avoid unsafe Python APIs: filesystem writes, subprocesses, sockets, HTTP requests, eval, exec, and dynamic imports.',
].join('\n');

export async function generateManimCode(params: {
  prompt: string;
  model?: string | null;
}): Promise<AiCodeGenerationResult> {
  const model = params.model || process.env.DEFAULT_MODEL || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const provider = resolveProvider(model);

  if (provider === 'mistral') {
    const apiKey = process.env.MISTRAL_API_KEY;

    if (apiKey) {
      const text = await callMistral({
        apiKey,
        model: model || process.env.MISTRAL_MODEL || DEFAULT_MISTRAL_MODEL,
        prompt: params.prompt,
      });

      return {
        code: extractPythonCode(text),
        model,
        provider,
        usedMock: false,
      };
    }
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    const geminiModel = provider === 'gemini' ? model : process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    const text = await callGemini({
      apiKey: geminiApiKey,
      model: geminiModel,
      prompt: params.prompt,
    });

    return {
      code: extractPythonCode(text),
      model: geminiModel,
      provider: 'gemini',
      usedMock: false,
    };
  }

  return {
    code: createLocalMockCode(params.prompt),
    model,
    provider: 'local',
    usedMock: true,
  };
}

export function validateManimCode(code: string) {
  const trimmed = code.trim();

  if (!trimmed) {
    throw new ManimCodeValidationError('AI returned empty Manim code');
  }

  if (!/from\s+manim\s+import\s+\*/.test(trimmed) && !/import\s+manim/.test(trimmed)) {
    throw new ManimCodeValidationError('Generated code must import Manim');
  }

  if (!/class\s+GeneratedScene\s*\(\s*Scene\s*\)\s*:/.test(trimmed)) {
    throw new ManimCodeValidationError('Generated code must define class GeneratedScene(Scene)');
  }

  const blockedPatterns = [
    /\bimport\s+os\b/,
    /\bfrom\s+os\b/,
    /\bimport\s+sys\b/,
    /\bfrom\s+sys\b/,
    /\bsubprocess\b/,
    /\bsocket\b/,
    /\brequests\b/,
    /\burllib\b/,
    /\bhttpx\b/,
    /\bopen\s*\(/,
    /\beval\s*\(/,
    /\bexec\s*\(/,
    /\b__import__\s*\(/,
    /\bPath\s*\(/,
    /\bshutil\b/,
  ];

  const blocked = blockedPatterns.find((pattern) => pattern.test(trimmed));

  if (blocked) {
    throw new ManimCodeValidationError(`Generated code uses a blocked API: ${blocked.source}`);
  }

  return trimmed;
}

function resolveProvider(model: string): AiProvider {
  const normalized = model.toLowerCase();

  if (normalized.includes('mistral')) return 'mistral';
  if (normalized.includes('gemini')) return 'gemini';

  return 'gemini';
}

async function callGemini(params: {
  apiKey: string;
  model: string;
  prompt: string;
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(params.model)}:generateContent?key=${params.apiKey}`,
    {
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
                text: `${systemPrompt}\n\nAnimation request:\n${params.prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topP: 0.9,
        },
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini code generation failed (${response.status}): ${details}`);
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim();

  if (!text) {
    throw new Error('Gemini returned no code');
  }

  return text;
}

async function callMistral(params: {
  apiKey: string;
  model: string;
  prompt: string;
}) {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: params.prompt },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Mistral code generation failed (${response.status}): ${details}`);
  }

  const data = await response.json() as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const text = data.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error('Mistral returned no code');
  }

  return text;
}

function extractPythonCode(text: string) {
  const fenced = text.match(/```(?:python|py)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] || text).trim();
}

function createLocalMockCode(prompt: string) {
  const safePrompt = prompt.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"').slice(0, 500);

  return `from manim import *


class GeneratedScene(Scene):
    def construct(self):
        title = Text("2DManim", font_size=48, weight=BOLD)
        subtitle = Text("Local code-generation preview", font_size=26, color=BLUE)
        request = Paragraph(
            """${safePrompt || 'Create a clean educational animation.'}""",
            width=10,
            font_size=24,
            line_spacing=0.7,
        )

        group = VGroup(title, subtitle, request).arrange(DOWN, buff=0.45)
        frame = SurroundingRectangle(group, buff=0.45, color=BLUE, corner_radius=0.12)

        self.play(FadeIn(frame), Write(title))
        self.play(FadeIn(subtitle, shift=DOWN * 0.2))
        self.play(Write(request))
        self.wait(1)
        self.play(group.animate.scale(0.9).shift(UP * 0.25), frame.animate.scale(0.95).shift(UP * 0.25))
        self.wait(1)
`;
}
