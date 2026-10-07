import { NextRequest } from 'next/server';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { lyrics, genre, mood, bpm, key, duration, seed } = await req.json();

  if (!lyrics?.trim()) {
    return Response.json({ error: 'Lyrics are required.' }, { status: 400 });
  }

  const apiUrl = process.env.MUSIC_API_URL;
  if (!apiUrl) {
    return Response.json({ error: 'Music generation is offline. Start the Colab notebook and set MUSIC_API_URL.' }, { status: 503 });
  }

  const tags = `${genre.toLowerCase()}, ${mood.toLowerCase()}, ${bpm} bpm, key of ${key}`;

  try {
    const res = await fetch(`${apiUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lyrics, tags, duration, seed }),
      signal: AbortSignal.timeout(110_000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      return Response.json({ error: err.error || 'Generation failed.' }, { status: 502 });
    }

    const data = await res.json() as { audio_b64?: string; seed?: number };
    if (!data.audio_b64) {
      return Response.json({ error: 'No audio returned.' }, { status: 502 });
    }

    return Response.json({ audio_b64: data.audio_b64, seed: data.seed ?? seed });
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string };
    console.error('[generate]', e?.message);
    if (e?.name === 'TimeoutError') return Response.json({ error: 'Generation timed out. Try a shorter duration.' }, { status: 504 });
    return Response.json({ error: 'Could not reach the music server. Is the Colab notebook running?' }, { status: 502 });
  }
}
