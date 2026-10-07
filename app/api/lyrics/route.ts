import Groq from 'groq-sdk';
import { NextRequest } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { genre, mood, prompt } = await req.json();

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: 'GROQ_API_KEY is not configured.' }, { status: 500 });
  }

  const context = prompt?.trim()
    ? `The user has started writing: "${prompt.trim()}". Continue or expand on this idea.`
    : `Write completely original lyrics.`;

  const system = `You are a professional songwriter. Write song lyrics in the style of ${genre}, with a ${mood.toLowerCase()} mood.
Use structure tags like [Verse 1], [Chorus], [Bridge]. Make them authentic, evocative, and ready to record.
Return ONLY the lyrics — no explanations, no titles, no commentary.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: context },
      ],
      max_tokens: 600,
      temperature: 1.0,
    });

    const lyrics = completion.choices[0]?.message?.content?.trim();
    if (!lyrics) return Response.json({ error: 'No lyrics generated.' }, { status: 502 });

    return Response.json({ lyrics });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[lyrics]', e?.message);
    return Response.json({ error: 'Lyrics generation failed.' }, { status: 502 });
  }
}
