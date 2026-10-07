import { fal } from '@fal-ai/client';
import { NextRequest } from 'next/server';

export const maxDuration = 120;

fal.config({ credentials: process.env.FAL_KEY });

export async function POST(req: NextRequest) {
  const { lyrics, genre, mood, bpm, key, duration, seed } = await req.json();

  if (!lyrics?.trim()) {
    return Response.json({ error: 'Lyrics are required.' }, { status: 400 });
  }

  if (!process.env.FAL_KEY) {
    return Response.json({ error: 'FAL_KEY is not configured on the server.' }, { status: 500 });
  }

  const tags = `${genre.toLowerCase()}, ${mood.toLowerCase()}, ${bpm} bpm, key of ${key}`;

  try {
    const result = await fal.subscribe('fal-ai/ace-step', {
      input: {
        lyrics,
        tags,
        duration,
        seed,
        number_of_steps: 27,
      },
    }) as { data: { audio?: { url?: string } } };

    const url = result.data?.audio?.url;
    if (!url) {
      return Response.json({ error: 'No audio returned from generation.' }, { status: 502 });
    }

    return Response.json({ url, seed });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    console.error('[generate]', e?.status, e?.message);
    if (e?.status === 401) return Response.json({ error: 'Invalid fal.ai API key.' }, { status: 502 });
    if (e?.status === 429) return Response.json({ error: 'Rate limit hit. Try again in a moment.' }, { status: 429 });
    return Response.json({ error: 'Generation failed. Try again.' }, { status: 502 });
  }
}
