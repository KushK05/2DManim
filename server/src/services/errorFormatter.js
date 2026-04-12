function compactWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function extractRenderException(raw) {
  const text = String(raw || '');
  const traceLineMatch = text.match(/\/manim\/input\/scene\.py:(\d+)\s+in\s+([^\s]+)/i);
  const exceptionMatch = text.match(/([A-Za-z_][A-Za-z0-9_]*Error):\s*([^\n\r]+)/);

  return {
    line: traceLineMatch?.[1] ? Number(traceLineMatch[1]) : null,
    functionName: traceLineMatch?.[2] || null,
    exceptionType: exceptionMatch?.[1] || null,
    exceptionMessage: compactWhitespace(exceptionMatch?.[2] || ''),
  };
}

function buildResponse({
  code,
  title,
  summary,
  cause,
  suggestions,
  retryable = false,
  rawMessage,
  status = 500,
}) {
  return {
    status,
    error: summary,
    errorDetails: {
      code,
      title,
      summary,
      likelyCause: cause,
      howToFix: suggestions,
      retryable,
      rawMessage: compactWhitespace(rawMessage).slice(0, 2000),
    },
  };
}

export function formatAppError(error, context = {}) {
  const rawMessage = compactWhitespace(error?.message || error || 'Unknown error');
  const lower = rawMessage.toLowerCase();
  const phase = context.phase || 'request';

  if (lower.includes('prompt is required')) {
    return buildResponse({
      status: 400,
      code: 'PROMPT_REQUIRED',
      title: 'Prompt missing',
      summary: 'Prompt is required.',
      cause: 'The request was submitted without any prompt text.',
      suggestions: [
        'Enter a prompt describing the animation you want.',
        'Include the topic, visual sequence, and any labels or highlights.',
      ],
      rawMessage,
    });
  }

  if (lower.includes('prompt too long')) {
    return buildResponse({
      status: 400,
      code: 'PROMPT_TOO_LONG',
      title: 'Prompt too long',
      summary: 'Prompt exceeds the 2000 character limit.',
      cause: 'The prompt body is longer than the API accepts.',
      suggestions: [
        'Shorten the prompt to the main animation steps only.',
        'Remove repeated wording and split complex requests into multiple generations.',
      ],
      rawMessage,
    });
  }

  if (lower.includes('mistral_api_key is not set') || lower.includes('gemini_api_key is not set')) {
    const provider = lower.includes('mistral') ? 'Mistral' : 'Gemini';
    const envKey = lower.includes('mistral') ? 'MISTRAL_API_KEY' : 'GEMINI_API_KEY';
    return buildResponse({
      code: 'PROVIDER_KEY_MISSING',
      title: `${provider} API key missing`,
      summary: `${provider} API key is not configured.`,
      cause: `The backend is trying to use ${provider}, but ${envKey} is missing or still set to a placeholder value.`,
      suggestions: [
        `Add a valid ${envKey} in .env and server/.env.`,
        'Restart the backend after updating the env file.',
        `If you want a different provider, switch the selected model or set DEFAULT_MODEL to another configured model.`,
      ],
      rawMessage,
    });
  }

  if (lower.includes('quota exceeded') || lower.includes('current quota')) {
    return buildResponse({
      code: 'PROVIDER_QUOTA_EXCEEDED',
      title: 'API quota exceeded',
      summary: 'The AI provider quota has been exceeded.',
      cause: 'The configured API key has no remaining quota or billing is not enabled for the selected provider/model.',
      suggestions: [
        'Check the provider billing and quota page for the current API key.',
        'Try a different model or provider if you have another API key configured.',
        'Retry later after quota resets.',
      ],
      retryable: true,
      rawMessage,
    });
  }

  if (lower.includes('rate limit')) {
    return buildResponse({
      code: 'PROVIDER_RATE_LIMIT',
      title: 'Rate limit reached',
      summary: 'Too many requests were sent to the AI provider.',
      cause: 'The provider temporarily throttled this request.',
      suggestions: [
        'Wait a short time and try again.',
        'Reduce the number of rapid repeated generations.',
        'Use a different configured provider if available.',
      ],
      retryable: true,
      rawMessage,
    });
  }

  if (lower.includes('call listmodels') || lower.includes('not found for api version') || lower.includes('model') && lower.includes('not found')) {
    return buildResponse({
      code: 'MODEL_UNAVAILABLE',
      title: 'Model unavailable',
      summary: 'The selected model is not available for this provider.',
      cause: 'The chosen model name is outdated, unsupported for the current API version, or not enabled for the API key.',
      suggestions: [
        'Pick another model from the model selector.',
        'Update DEFAULT_MODEL in the env file if it points to an unsupported model.',
        'Confirm the model exists for your provider account and API version.',
      ],
      rawMessage,
    });
  }

  if (lower.includes('failed to fetch') || lower.includes('fetch failed') || lower.includes('network') || lower.includes('econnrefused') || lower.includes('enotfound')) {
    return buildResponse({
      code: 'NETWORK_FAILURE',
      title: 'Network error',
      summary: 'The backend could not reach a required service.',
      cause: phase === 'render'
        ? 'A local dependency such as Docker may not be reachable.'
        : 'The backend could not contact the configured AI provider or another required service.',
      suggestions: [
        'Check your internet connection and provider availability.',
        'If rendering video, make sure Docker Desktop is running.',
        'Retry once the service is reachable again.',
      ],
      retryable: true,
      rawMessage,
    });
  }

  if (lower.includes('spawn docker') || lower.includes('docker') && lower.includes('not recognized')) {
    return buildResponse({
      code: 'DOCKER_NOT_AVAILABLE',
      title: 'Docker not available',
      summary: 'Video rendering requires Docker, but Docker is not available.',
      cause: 'The backend could not start the local Manim container.',
      suggestions: [
        'Install Docker Desktop and make sure the `docker` command works in your terminal.',
        'Start Docker Desktop before generating with video rendering enabled.',
        'Disable "Render video" if you only want Manim code output.',
      ],
      rawMessage,
    });
  }

  if (lower.includes('cannot connect to the docker daemon')) {
    return buildResponse({
      code: 'DOCKER_DAEMON_UNAVAILABLE',
      title: 'Docker is not running',
      summary: 'Docker is installed, but the Docker daemon is not running.',
      cause: 'The local render pipeline needs Docker Desktop to be open and healthy.',
      suggestions: [
        'Open Docker Desktop and wait until it reports that Docker is running.',
        'Retry the render after Docker finishes starting.',
        'Disable "Render video" if you only need code output.',
      ],
      retryable: true,
      rawMessage,
    });
  }

  if (lower.includes('no such image') || lower.includes('2dmanim-manim')) {
    return buildResponse({
      code: 'MANIM_IMAGE_MISSING',
      title: 'Manim render image missing',
      summary: 'The local Manim Docker image has not been built.',
      cause: 'The backend expected the `2dmanim-manim` image, but Docker could not find it.',
      suggestions: [
        'Run `docker compose build manim-runner` from the project root.',
        'Retry rendering after the image build completes successfully.',
      ],
      rawMessage,
    });
  }

  if (lower.includes('no video output produced')) {
    return buildResponse({
      code: 'NO_VIDEO_OUTPUT',
      title: 'Render finished without video output',
      summary: 'Manim did not produce a video file.',
      cause: 'The scene may have failed during rendering or exited before writing media output.',
      suggestions: [
        'Try generating again with a simpler prompt.',
        'Inspect the generated Manim code for unsupported constructs or missing scene content.',
        'Disable video rendering and review the code output first.',
      ],
      rawMessage,
    });
  }

  if (lower.includes('timed out')) {
    return buildResponse({
      code: 'PROCESS_TIMEOUT',
      title: 'Operation timed out',
      summary: 'The request took too long and was stopped.',
      cause: phase === 'render'
        ? 'The Manim render exceeded the configured render timeout.'
        : 'The generation request exceeded the expected processing time.',
      suggestions: [
        'Try a simpler prompt with fewer animations.',
        'If rendering video, disable video output first to inspect the code.',
        'Retry the request once local resources are free.',
      ],
      retryable: true,
      rawMessage,
    });
  }

  if (lower.includes('manim render failed')) {
    const parsed = extractRenderException(rawMessage);
    const lineHint = parsed.line ? ` at line ${parsed.line}` : '';
    const typeHint = parsed.exceptionType || 'RenderError';
    const cause = parsed.exceptionMessage
      ? `${typeHint}${lineHint}: ${parsed.exceptionMessage}`
      : 'The generated Manim scene hit a Python or Manim runtime error during rendering.';

    const suggestions = [
      'Open the generated Manim code and inspect the failing line.',
      'Check whether Manim objects are being created with the correct argument types and order.',
      'Try a simpler prompt or disable "Render video" first so you can review the code before rendering.',
    ];

    if (parsed.exceptionType === 'TypeError') {
      suggestions.unshift('Look for a function or class being called with the wrong number or order of arguments.');
    }

    return buildResponse({
      code: 'MANIM_RENDER_RUNTIME_ERROR',
      title: 'Manim render failed',
      summary: parsed.exceptionMessage
        ? `Render failed: ${parsed.exceptionMessage}`
        : 'Manim failed while rendering the generated scene.',
      cause,
      suggestions,
      rawMessage,
    });
  }

  if (lower.includes('mongodb') || lower.includes('openuri') || lower.includes('econnrefused 127.0.0.1:27017')) {
    return buildResponse({
      code: 'DATABASE_CONNECTION_ERROR',
      title: 'Database connection failed',
      summary: 'The backend could not connect to MongoDB.',
      cause: 'MongoDB is not running or MONGODB_URI is incorrect.',
      suggestions: [
        'Make sure MongoDB is running locally on 127.0.0.1:27017 or update MONGODB_URI.',
        'Verify .env and server/.env contain the correct MongoDB connection string.',
        'Restart the backend after fixing the database connection.',
      ],
      rawMessage,
    });
  }

  return buildResponse({
    code: 'UNEXPECTED_ERROR',
    title: 'Unexpected error',
    summary: 'The request failed unexpectedly.',
    cause: rawMessage,
    suggestions: [
      'Retry the request once.',
      'If the problem continues, try a simpler prompt or a different model.',
      'Check the backend logs for the full stack trace and raw provider response.',
    ],
    rawMessage,
  });
}
