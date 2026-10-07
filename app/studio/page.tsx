'use client';

import { useState, useRef } from 'react';

const GENRES = ['Hip Hop', 'Trap', 'R&B', 'Pop', 'Rock', 'Country', 'EDM', 'Jazz', 'Soul', 'Lo-Fi'];
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MOODS = ['Dark', 'Uplifting', 'Melancholic', 'Aggressive', 'Romantic', 'Chill', 'Hype'];

type Version = {
  id: number;
  url: string;
  seed: number;
  genre: string;
  bpm: number;
  key: string;
  createdAt: Date;
};

export default function Studio() {
  const [lyrics, setLyrics] = useState('');
  const [genre, setGenre] = useState('Hip Hop');
  const [mood, setMood] = useState('Dark');
  const [bpm, setBpm] = useState(90);
  const [key, setKey] = useState('C');
  const [duration, setDuration] = useState(30);

  const [generating, setGenerating] = useState(false);
  const [generatingLyrics, setGeneratingLyrics] = useState(false);
  const [error, setError] = useState('');
  const [versions, setVersions] = useState<Version[]>([]);
  const [playing, setPlaying] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextId = useRef(1);

  async function handleGenerate() {
    if (!lyrics.trim()) { setError('Add some lyrics first.'); return; }
    setError('');
    setGenerating(true);
    try {
      const seed = Math.floor(Math.random() * 999999);
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyrics, genre, mood, bpm, key, duration, seed }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Generation failed.'); return; }
      // audio comes back as base64; turn it into an object URL for playback/download
      const audioUrl = data.audio_b64
        ? `data:audio/wav;base64,${data.audio_b64}`
        : data.url;
      const version: Version = { id: nextId.current++, url: audioUrl, seed, genre, bpm, key, createdAt: new Date() };
      setVersions(v => [version, ...v]);
      playVersion(version);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateLyrics() {
    setGeneratingLyrics(true);
    setError('');
    try {
      const res = await fetch('/api/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, mood, prompt: lyrics }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Lyrics generation failed.'); return; }
      setLyrics(data.lyrics);
    } catch {
      setError('Lyrics generation failed.');
    } finally {
      setGeneratingLyrics(false);
    }
  }

  function playVersion(v: Version) {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    const audio = new Audio(v.url);
    audioRef.current = audio;
    audio.play().catch(() => {});
    setPlaying(v.id);
    audio.onended = () => setPlaying(null);
  }

  function stopAudio() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    setPlaying(null);
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <a href="/" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>← HitMan AI</a>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span style={{ fontWeight: 700, fontSize: '1rem' }}>Studio</span>
      </div>

      {/* Lyrics */}
      <section style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Lyrics
          </label>
          <button
            onClick={handleGenerateLyrics}
            disabled={generatingLyrics}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: generatingLyrics ? 'var(--muted)' : 'var(--text)',
              padding: '0.3rem 0.9rem', borderRadius: '6px', fontSize: '0.8rem',
              cursor: generatingLyrics ? 'not-allowed' : 'pointer', fontWeight: 600,
            }}
          >
            {generatingLyrics ? 'Writing…' : '✨ Write with AI'}
          </button>
        </div>
        <textarea
          value={lyrics}
          onChange={e => setLyrics(e.target.value)}
          placeholder={'[Verse 1]\nWrite your lyrics here, or let AI write them for you.\n\n[Chorus]\n...'}
          rows={10}
          style={{
            width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '1rem', color: 'var(--text)', fontSize: '0.95rem',
            lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: 'inherit',
          }}
        />
      </section>

      {/* Controls */}
      <section style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem',
      }}>
        <Control label="Genre">
          <select value={genre} onChange={e => setGenre(e.target.value)} style={selectStyle}>
            {GENRES.map(g => <option key={g}>{g}</option>)}
          </select>
        </Control>

        <Control label="Mood">
          <select value={mood} onChange={e => setMood(e.target.value)} style={selectStyle}>
            {MOODS.map(m => <option key={m}>{m}</option>)}
          </select>
        </Control>

        <Control label={`BPM: ${bpm}`}>
          <input type="range" min={60} max={180} value={bpm} onChange={e => setBpm(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }} />
        </Control>

        <Control label="Key">
          <select value={key} onChange={e => setKey(e.target.value)} style={selectStyle}>
            {KEYS.map(k => <option key={k}>{k}</option>)}
          </select>
        </Control>

        <Control label={`Duration: ${duration}s`}>
          <input type="range" min={15} max={120} step={5} value={duration} onChange={e => setDuration(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }} />
        </Control>
      </section>

      {/* Generate button */}
      {error && <p style={{ color: 'var(--accent)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}

      <button
        onClick={handleGenerate}
        disabled={generating}
        style={{
          width: '100%', padding: '1rem', borderRadius: '12px', border: 'none',
          background: generating ? 'var(--accent-dim)' : 'var(--accent)',
          color: '#fff', fontSize: '1.1rem', fontWeight: 800, cursor: generating ? 'not-allowed' : 'pointer',
          letterSpacing: '0.02em', marginBottom: '2rem',
          transition: 'background 0.15s',
        }}
      >
        {generating ? '🎵 Generating…' : '🎯 Generate Song'}
      </button>

      {/* Version history */}
      {versions.length > 0 && (
        <section>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            Versions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {versions.map(v => (
              <div key={v.id} style={{
                background: playing === v.id ? 'var(--surface2)' : 'var(--surface)',
                border: `1px solid ${playing === v.id ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '10px', padding: '0.9rem 1.1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {v.genre} · {v.bpm} BPM · {v.key}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                    Seed {v.seed} · {v.createdAt.toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  {playing === v.id ? (
                    <button onClick={stopAudio} style={btnStyle('#333')}>⏹ Stop</button>
                  ) : (
                    <button onClick={() => playVersion(v)} style={btnStyle('var(--accent)')}>▶ Play</button>
                  )}
                  <a href={v.url} download={`hitman-${v.seed}.mp3`} style={btnStyle('var(--surface2)')}>↓</a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
  color: 'var(--text)', padding: '0.4rem 0.6rem', borderRadius: '6px',
  fontSize: '0.9rem', outline: 'none', cursor: 'pointer',
};

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg, border: 'none', color: '#fff', padding: '0.4rem 0.8rem',
    borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
  };
}
