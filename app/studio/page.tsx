'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

const GENRES = [
  'Hip Hop', 'Trap', 'Drill', 'UK Drill', 'Boom Bap', 'Phonk', 'Memphis Rap', 'Grime', 'Cloud Rap',
  'R&B', 'Neo Soul', 'Soul', 'Gospel',
  'Pop', 'Indie Pop', 'Alternative',
  'Rock', 'Indie Rock', 'Metal', 'Punk',
  'Country', 'Folk',
  'EDM', 'House', 'Techno', 'Ambient', 'Lo-Fi',
  'Jazz', 'Blues',
  'Afrobeats', 'Reggaeton', 'Latin Trap', 'Dancehall', 'Reggae',
];
const KEYS  = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MOODS = ['Dark', 'Uplifting', 'Melancholic', 'Aggressive', 'Romantic', 'Chill', 'Hype'];

const FREE_CREDITS = 3;
const LS_HISTORY   = 'hitman_history';
const LS_CREDITS   = 'hitman_credits';
const ADMIN_SECRET = 'hitmanboss';

function fmtDuration(s: number) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

type Version = {
  id: number;
  db_id?: string;
  url: string;
  seed: number;
  genre: string;
  bpm: number;
  key: string;
  lyrics: string;
  description?: string;
  audio_path?: string;
  createdAt: string;
};

function loadHistory(): Version[] {
  try { return JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'); } catch { return []; }
}
function saveHistory(v: Version[]) {
  try { localStorage.setItem(LS_HISTORY, JSON.stringify(v.slice(0, 50))); } catch {}
}
function loadLocalCredits(): number {
  try { const s = localStorage.getItem(LS_CREDITS); return s === null ? FREE_CREDITS : Math.max(0, Number(s)); }
  catch { return FREE_CREDITS; }
}
function saveLocalCredits(n: number) { try { localStorage.setItem(LS_CREDITS, String(n)); } catch {} }

// ── Background shell ──────────────────────────────────────────────────────────
function PageShell({ children, tint = 'rgba(9,9,14,0.82)' }: { children: React.ReactNode; tint?: string }) {
  return (
    <div style={{ position: 'relative', minHeight: '100dvh', overflowX: 'hidden' }}>
      <img src="/hitman.jpg" aria-hidden="true" alt=""
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center top', zIndex: 0,
          filter: 'blur(6px) brightness(0.38)', transform: 'scale(1.06)' }} />
      <div style={{ position: 'fixed', inset: 0, background: tint, zIndex: 1 }} />
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '80%', height: '35%', zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at bottom, rgba(230,57,70,0.12) 0%, transparent 70%)' }} />
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
}

const glass: React.CSSProperties = {
  background: 'rgba(17,17,24,0.72)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '12px',
};

// ── Waveform progress ─────────────────────────────────────────────────────────
function WaveProgress({ elapsed, duration }: { elapsed: number; duration: number }) {
  const pct = Math.min(elapsed / (duration + 30), 0.95);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '40px' }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{
            width: '4px', height: '100%', borderRadius: '2px', transformOrigin: 'center',
            background: `rgba(230,57,70,${0.55 + (i % 4) * 0.12})`,
            animation: `wave ${0.55 + (i % 5) * 0.11}s ease-in-out ${(i * 0.065) % 0.55}s infinite`,
            filter: 'drop-shadow(0 0 4px rgba(230,57,70,0.7))',
          }} />
        ))}
      </div>
      <div style={{ width: '100%', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, borderRadius: '4px', transition: 'width 1s linear',
          background: 'linear-gradient(90deg, #e63946, #ff6b6b)', boxShadow: '0 0 8px rgba(230,57,70,0.8)' }} />
      </div>
      <div style={{ fontSize: '0.82rem', color: 'rgba(240,240,248,0.55)' }}>
        Generating… {elapsed}s elapsed
        {elapsed < duration + 20 ? ` · ~${Math.max(0, duration + 20 - elapsed)}s left` : ' · almost done'}
      </div>
    </div>
  );
}

// ── Auth modal ────────────────────────────────────────────────────────────────
function AuthModal({ onClose, onAuth }: { onClose: () => void; onAuth: (session: Session) => void }) {
  const [mode,     setMode]     = useState<'signin' | 'signup'>('signin');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) { setError(err.message); return; }
        if (data.session) { onAuth(data.session); onClose(); return; }
        setSuccess('Check your email to confirm your account, then sign in.');
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) { setError(err.message); return; }
        if (data.session) { onAuth(data.session); onClose(); }
      }
    } finally { setLoading(false); }
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '0.7rem 1rem', color: 'var(--text)',
    fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,9,14,0.88)',
      backdropFilter: 'blur(8px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        ...glass, padding: '2rem', maxWidth: '400px', width: '100%',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
        border: '1px solid rgba(230,57,70,0.25)',
        boxShadow: '0 0 60px rgba(230,57,70,0.12)',
        animation: 'fadeUp 0.25s ease both',
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['signin', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }} style={{
              flex: 1, padding: '0.55rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
              background: mode === m ? 'var(--accent)' : 'transparent',
              color: mode === m ? '#fff' : 'var(--muted)',
              transition: 'all 0.15s',
            }}>
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
          {error   && <p style={{ color: 'var(--accent)', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
          {success && <p style={{ color: '#4caf50',       fontSize: '0.85rem', margin: 0 }}>{success}</p>}
          <button type="submit" disabled={loading} style={{
            background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '0.8rem', fontWeight: 900, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, letterSpacing: '0.04em',
          }}>
            {loading ? '…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.82rem', cursor: 'pointer' }}>
          Continue as guest
        </button>
      </div>
    </div>
  );
}

// ── Paywall modal ─────────────────────────────────────────────────────────────
function PaywallModal({ onClose, onUnlocked }: { onClose: () => void; onUnlocked: (n: number) => void }) {
  const [email,  setEmail]  = useState('');
  const [buying, setBuying] = useState(false);

  async function handleBuy(credits: number, priceId: string) {
    if (!email.trim()) { alert('Enter your email first.'); return; }
    setBuying(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), credits, priceId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch { alert('Could not start checkout. Try again.'); }
    finally { setBuying(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,9,14,0.88)',
      backdropFilter: 'blur(8px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        ...glass, padding: '2rem', maxWidth: '440px', width: '100%',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
        border: '1px solid rgba(230,57,70,0.3)',
        boxShadow: '0 0 60px rgba(230,57,70,0.15)',
        animation: 'fadeUp 0.25s ease both',
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.4rem' }}>
            You&apos;ve used your <span style={{ color: 'var(--accent)' }}>3 free songs</span>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Add credits to keep making hits. Credits never expire.
          </p>
        </div>
        <input type="email" placeholder="your@email.com" value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', padding: '0.7rem 1rem', color: 'var(--text)',
            fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <PriceCard label="Starter" credits={20} price="$5" perSong="$0.25/song"
            onClick={() => handleBuy(20, process.env.NEXT_PUBLIC_STRIPE_PRICE_20 || '')} disabled={buying} />
          <PriceCard label="Pro" credits={60} price="$12" perSong="$0.20/song" highlight
            onClick={() => handleBuy(60, process.env.NEXT_PUBLIC_STRIPE_PRICE_60 || '')} disabled={buying} />
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.85rem', cursor: 'pointer' }}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

function PriceCard({ label, credits, price, perSong, highlight, onClick, disabled }: {
  label: string; credits: number; price: string; perSong: string;
  highlight?: boolean; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, borderRadius: '10px', padding: '1rem', color: '#fff',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
      display: 'flex', flexDirection: 'column', gap: '0.3rem', textAlign: 'left',
      background: highlight ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
      border: `1px solid ${highlight ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
      boxShadow: highlight ? '0 0 30px rgba(230,57,70,0.4)' : 'none',
      animation: highlight ? 'glowPulse 2.5s ease-in-out infinite' : 'none',
    }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{price}</div>
      <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>{credits} credits</div>
      <div style={{ fontSize: '0.72rem', opacity: 0.6 }}>{perSong}</div>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Studio() {
  const [lyrics,      setLyrics]      = useState('');
  const [description, setDescription] = useState('');
  const [genre,       setGenre]       = useState('Hip Hop');
  const [mood,        setMood]        = useState('Dark');
  const [bpm,         setBpm]         = useState(90);
  const [key,         setKey]         = useState('C');
  const [duration,    setDuration]    = useState(30);

  const [generating,       setGenerating]       = useState(false);
  const [generatingLyrics, setGeneratingLyrics] = useState(false);
  const [elapsed,          setElapsed]          = useState(0);
  const [error,            setError]            = useState('');
  const [versions,         setVersions]         = useState<Version[]>([]);
  const [playing,          setPlaying]          = useState<number | null>(null);
  const [credits,          setCredits]          = useState(FREE_CREDITS);
  const [showPaywall,      setShowPaywall]       = useState(false);
  const [showAuth,         setShowAuth]          = useState(false);
  const [offline,          setOffline]          = useState(false);
  const [session,          setSession]          = useState<Session | null>(null);
  const [isAdmin,          setIsAdmin]          = useState(false);
  const [loadingHistory,   setLoadingHistory]   = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextId   = useRef(1);

  // Load user's songs + credits from Supabase
  const loadUserData = useCallback(async (userId: string) => {
    setLoadingHistory(true);
    try {
      // Credits
      const { data: cred } = await supabase
        .from('credits').select('amount').eq('user_id', userId).single();
      if (cred) setCredits(cred.amount);

      // Songs (metadata only — audio loaded via signed URL)
      const { data: songs } = await supabase
        .from('songs')
        .select('id, genre, mood, bpm, key, duration, lyrics, description, audio_path, seed, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (songs && songs.length > 0) {
        const maxId = songs.length + 1;
        nextId.current = maxId;

        // Get signed URLs for audio in parallel
        const versionsWithUrls: Version[] = await Promise.all(songs.map(async (s, i) => {
          let url = '';
          if (s.audio_path) {
            const { data: signed } = await supabase.storage
              .from('hitman-audio')
              .createSignedUrl(s.audio_path, 3600);
            url = signed?.signedUrl || '';
          }
          return {
            id: maxId - i,
            db_id: s.id,
            url,
            seed: s.seed ?? 0,
            genre: s.genre,
            bpm: s.bpm,
            key: s.key,
            lyrics: s.lyrics,
            description: s.description ?? '',
            audio_path: s.audio_path ?? '',
            createdAt: s.created_at,
          };
        }));
        setVersions(versionsWithUrls);
      }
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    // Check admin
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === ADMIN_SECRET) {
      setIsAdmin(true);
      try { sessionStorage.setItem('hitman_admin', '1'); } catch {}
    } else {
      try { if (sessionStorage.getItem('hitman_admin') === '1') setIsAdmin(true); } catch {}
    }

    // Restore local history for guests
    const hist = loadHistory();
    if (hist.length) {
      nextId.current = Math.max(...hist.map(v => v.id)) + 1;
      setVersions(hist);
    }
    setCredits(loadLocalCredits());

    // Check Supabase session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        setSession(s);
        loadUserData(s.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) loadUserData(s.user.id);
    });
    return () => subscription.unsubscribe();
  }, [loadUserData]);

  function startTimer() {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
  }
  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  async function uploadAudio(userId: string, songId: string, b64: string): Promise<string | null> {
    try {
      const binary = atob(b64);
      const bytes  = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const path = `${userId}/${songId}.wav`;
      const { error } = await supabase.storage.from('hitman-audio').upload(path, blob, { contentType: 'audio/wav', upsert: true });
      if (error) { console.error('[upload]', error.message); return null; }
      return path;
    } catch (e) {
      console.error('[upload]', e);
      return null;
    }
  }

  async function handleGenerate() {
    if (!lyrics.trim()) { setError('Add some lyrics first.'); return; }
    if (!isAdmin && credits <= 0) { setShowPaywall(true); return; }
    setError(''); setOffline(false); setGenerating(true); startTimer();
    try {
      const seed = Math.floor(Math.random() * 999999);
      const res  = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyrics, genre, mood, bpm, key, duration, seed, description }),
      });
      const data = await res.json();
      if (res.status === 503) { setOffline(true); return; }
      if (!res.ok) { setError(data.error || 'Generation failed.'); return; }

      const audioUrl = data.audio_b64 ? `data:audio/wav;base64,${data.audio_b64}` : data.url;
      const songDbId = crypto.randomUUID();
      let   audioPath: string | null = null;

      // Save to Supabase if signed in
      if (session) {
        if (data.audio_b64) {
          audioPath = await uploadAudio(session.user.id, songDbId, data.audio_b64);
        }
        await supabase.from('songs').insert({
          id: songDbId, user_id: session.user.id,
          genre, mood, bpm, key, duration, lyrics, description,
          audio_path: audioPath, seed: data.seed ?? seed,
        });
        // Decrement credits in DB
        if (!isAdmin) {
          await supabase.from('credits')
            .update({ amount: credits - 1, updated_at: new Date().toISOString() })
            .eq('user_id', session.user.id);
        }
      }

      const version: Version = {
        id: nextId.current++,
        db_id: songDbId,
        url: audioUrl,
        seed: data.seed ?? seed,
        genre, bpm, key, lyrics,
        description,
        audio_path: audioPath ?? '',
        createdAt: new Date().toISOString(),
      };

      const newVersions = [version, ...versions];
      setVersions(newVersions);

      if (!session) saveHistory(newVersions);
      if (!isAdmin) {
        const newCredits = credits - 1;
        setCredits(newCredits);
        if (!session) saveLocalCredits(newCredits);
      }
      playVersion(version);
    } catch { setError('Something went wrong. Try again.'); }
    finally { setGenerating(false); stopTimer(); }
  }

  async function handleGenerateLyrics() {
    setGeneratingLyrics(true); setError('');
    try {
      const res  = await fetch('/api/lyrics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, mood, prompt: lyrics, description }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Lyrics generation failed.'); return; }
      setLyrics(data.lyrics);
    } catch { setError('Lyrics generation failed.'); }
    finally { setGeneratingLyrics(false); }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
    const hist = loadHistory();
    setVersions(hist);
    setCredits(loadLocalCredits());
  }

  function playVersion(v: Version) {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    if (!v.url) return;
    const audio = new Audio(v.url); audioRef.current = audio;
    audio.play().catch(() => {}); setPlaying(v.id);
    audio.onended = () => setPlaying(null);
  }
  function stopAudio() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    setPlaying(null);
  }

  async function removeVersion(v: Version) {
    const updated = versions.filter(x => x.id !== v.id);
    setVersions(updated);
    if (!session) saveHistory(updated);
    if (playing === v.id) stopAudio();
    if (v.db_id && session) {
      if (v.audio_path) {
        await supabase.storage.from('hitman-audio').remove([v.audio_path]);
      }
      await supabase.from('songs').delete().eq('id', v.db_id);
    }
  }

  if (offline) {
    return (
      <PageShell>
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', animation: 'fadeUp 0.5s ease both' }}>
          <div style={{ fontSize: '3rem' }}>🎚️</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900 }}>Music server is offline</h1>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
            The Colab notebook that powers beat generation isn&apos;t running right now. Lyrics still work.
          </p>
          <div style={{ ...glass, padding: '1.25rem', textAlign: 'left', fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--muted)', width: '100%' }}>
            <strong style={{ color: 'var(--text)' }}>To bring it back:</strong>
            <ol style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
              <li>Open your Colab notebook</li>
              <li>Run all 3 cells in order</li>
              <li>Copy the new <code style={{ color: 'var(--accent)' }}>MUSIC_API_URL</code></li>
              <li>Update it in Vercel env vars &amp; redeploy</li>
            </ol>
          </div>
          <button onClick={() => setOffline(false)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.7rem 1.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', animation: 'glowPulse 2s ease-in-out infinite' }}>
            ← Back to Studio
          </button>
        </div>
      </PageShell>
    );
  }

  const userEmail = session?.user?.email;

  return (
    <PageShell>
      {showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          onUnlocked={(n) => { const c = credits + n; setCredits(c); setShowPaywall(false); }}
        />
      )}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuth={(s) => { setSession(s); loadUserData(s.user.id); }}
        />
      )}

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '1.5rem 1rem 4rem', animation: 'fadeUp 0.5s ease 0.1s both' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a href="/" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>← HitMan AI</a>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Studio</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isAdmin ? (
              <span style={{ background: 'rgba(230,57,70,0.2)', border: '1px solid rgba(230,57,70,0.6)', borderRadius: '9999px', padding: '0.3rem 0.9rem', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                🔑 ADMIN
              </span>
            ) : (
              <button onClick={() => credits <= 0 ? setShowPaywall(true) : undefined} style={{
                background: credits <= 2 ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${credits <= 2 ? 'rgba(230,57,70,0.6)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '9999px', padding: '0.3rem 0.9rem',
                color: credits <= 2 ? 'var(--accent)' : 'var(--muted)',
                fontSize: '0.8rem', fontWeight: 700, cursor: credits <= 0 ? 'pointer' : 'default',
                animation: credits <= 1 ? 'borderGlow 1.8s ease-in-out infinite' : 'none',
              }}>
                {credits <= 0 ? '⚡ Buy credits' : `⚡ ${credits} credit${credits === 1 ? '' : 's'} left`}
              </button>
            )}
            {session ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</span>
                <button onClick={handleSignOut} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.28rem 0.7rem', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                  Sign out
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '9999px', padding: '0.3rem 0.9rem', color: 'var(--text)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Song Description */}
        <section style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Describe Your Song
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Dark street anthem about loyalty, inspired by NBA YoungBoy and Rod Wave…"
            style={{
              width: '100%', background: 'rgba(17,17,24,0.65)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
              padding: '0.75rem 1rem', color: 'var(--text)', fontSize: '0.95rem',
              outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
          />
        </section>

        {/* Lyrics */}
        <section style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lyrics</label>
            <button onClick={handleGenerateLyrics} disabled={generatingLyrics} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: generatingLyrics ? 'var(--muted)' : 'var(--text)',
              padding: '0.3rem 0.9rem', borderRadius: '6px', fontSize: '0.8rem',
              cursor: generatingLyrics ? 'not-allowed' : 'pointer', fontWeight: 600,
            }}>
              {generatingLyrics ? 'Writing…' : '✨ Write with AI'}
            </button>
          </div>
          <textarea value={lyrics} onChange={e => setLyrics(e.target.value)}
            placeholder={'[Verse 1]\nWrite your lyrics here, or let AI write them for you.\n\n[Chorus]\n...'}
            rows={10} style={{
              width: '100%', background: 'rgba(17,17,24,0.65)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
              padding: '1rem', color: 'var(--text)', fontSize: '0.95rem',
              lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.2s', boxSizing: 'border-box',
            }} />
        </section>

        {/* Controls */}
        <section style={{
          ...glass, padding: '1.25rem', marginBottom: '1.5rem',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem',
        }}>
          <Control label="Genre">
            <select value={genre} onChange={e => setGenre(e.target.value)} style={selectStyle}>{GENRES.map(g => <option key={g}>{g}</option>)}</select>
          </Control>
          <Control label="Mood">
            <select value={mood} onChange={e => setMood(e.target.value)} style={selectStyle}>{MOODS.map(m => <option key={m}>{m}</option>)}</select>
          </Control>
          <Control label={`BPM: ${bpm}`}>
            <input type="range" min={60} max={180} value={bpm} onChange={e => setBpm(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
          </Control>
          <Control label="Key">
            <select value={key} onChange={e => setKey(e.target.value)} style={selectStyle}>{KEYS.map(k => <option key={k}>{k}</option>)}</select>
          </Control>
          <Control label={`Duration: ${fmtDuration(duration)}`}>
            <input type="range" min={15} max={300} step={5} value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
          </Control>
        </section>

        {error && <p style={{ color: 'var(--accent)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}

        {/* Generate */}
        {generating ? (
          <div style={{ ...glass, padding: '1.5rem', marginBottom: '2rem' }}>
            <WaveProgress elapsed={elapsed} duration={duration} />
          </div>
        ) : (
          <button onClick={!isAdmin && credits <= 0 ? () => setShowPaywall(true) : handleGenerate} style={{
            width: '100%', padding: '1.1rem', borderRadius: '12px', border: 'none',
            color: '#fff', fontSize: '1.1rem', fontWeight: 900, cursor: 'pointer',
            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '2rem',
            backgroundSize: '200% auto',
            background: !isAdmin && credits <= 0
              ? 'var(--accent)'
              : 'linear-gradient(90deg, #e63946 0%, #ff6b6b 40%, #fff 50%, #ff6b6b 60%, #e63946 100%)',
            animation: isAdmin || credits > 0 ? 'shimmer 2.8s linear infinite, glowPulse 2.5s ease-in-out infinite' : 'glowPulse 2.5s ease-in-out infinite',
          }}>
            {!isAdmin && credits <= 0 ? '⚡ Buy Credits to Generate' : '🎯 Generate Song'}
          </button>
        )}

        {/* Version history */}
        {loadingHistory ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center' }}>Loading your songs…</p>
        ) : versions.length > 0 && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Songs ({versions.length})
              </h2>
              {!session && (
                <button onClick={() => { setVersions([]); saveHistory([]); stopAudio(); }}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer' }}>
                  Clear all
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {versions.map(v => (
                <div key={v.id} style={{
                  ...glass,
                  border: `1px solid ${playing === v.id ? 'rgba(230,57,70,0.6)' : 'rgba(255,255,255,0.07)'}`,
                  padding: '0.9rem 1.1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                  animation: playing === v.id ? 'borderGlow 1.8s ease-in-out infinite' : 'none',
                  boxShadow: playing === v.id ? '0 0 20px rgba(230,57,70,0.2)' : 'none',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v.genre} · {v.bpm} BPM · {v.key}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                      Seed {v.seed} · {new Date(v.createdAt).toLocaleString()}
                    </div>
                    {v.description && (
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>{v.description}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    {v.url ? (
                      playing === v.id
                        ? <button onClick={stopAudio} style={btnStyle('rgba(255,255,255,0.1)')}>⏹</button>
                        : <button onClick={() => playVersion(v)} style={btnStyle('var(--accent)')}>▶</button>
                    ) : (
                      <span style={{ ...btnStyle('rgba(255,255,255,0.04)'), opacity: 0.4, cursor: 'default', display: 'inline-flex', alignItems: 'center' }}>▶</span>
                    )}
                    {v.url && <a href={v.url} download={`hitman-${v.genre.toLowerCase().replace(/ /g, '-')}-${v.seed}.wav`} style={btnStyle('rgba(255,255,255,0.06)')}>↓</a>}
                    <button onClick={() => removeVersion(v)} style={btnStyle('rgba(255,255,255,0.06)')}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {children}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text)', padding: '0.4rem 0.6rem', borderRadius: '6px',
  fontSize: '0.9rem', outline: 'none', cursor: 'pointer',
};

function btnStyle(bg: string): React.CSSProperties {
  return { background: bg, border: 'none', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' };
}
