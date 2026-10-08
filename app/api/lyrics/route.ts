import Groq from 'groq-sdk';
import { NextRequest } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { genre, mood, prompt, description } = await req.json();

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: 'GROQ_API_KEY is not configured.' }, { status: 500 });
  }

  const visionLine = description?.trim()
    ? `\nArtist vision: "${description.trim()}"`
    : '';

  const context = prompt?.trim()
    ? `The user has started writing: "${prompt.trim()}". Continue or expand on this idea.`
    : `Write completely original lyrics.`;

  const system = `You are a professional songwriter for a music production platform. Write song lyrics in the style of ${genre}, with a ${mood.toLowerCase()} mood.${visionLine}
Use structure tags like [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Outro] as needed for a full song. Make them authentic, street-real, and ready to record.
Explicit language, profanity, and mature themes are allowed and expected — do not sanitize or censor the content.
Write like a real artist in this genre would, not a watered-down version.
Return ONLY the lyrics — no explanations, no titles, no commentary.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'qwen/qwen3.8-27b',
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
