export async function GET() {
  return Response.json({
    models: [
      {
        key: process.env.DEFAULT_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'Google',
      },
      {
        key: process.env.MISTRAL_MODEL || 'mistral-medium-latest',
        name: 'Mistral Medium',
        provider: 'Mistral',
      },
    ],
  });
}
