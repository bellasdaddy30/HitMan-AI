import Link from 'next/link';

const BARS = [0.4, 0.7, 1, 0.85, 0.6, 0.9, 0.5, 0.75, 1, 0.65, 0.8, 0.45, 0.95, 0.7, 0.55, 0.85, 1, 0.6, 0.75, 0.4];

function Waveform({ flip }: { flip?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '3px', height: '48px',
      transform: flip ? 'scaleY(-1)' : undefined,
      opacity: 0.25,
    }}>
      {BARS.map((h, i) => (
        <div key={i} style={{
          width: '3px',
          height: `${h * 100}%`,
          background: 'var(--accent)',
          borderRadius: '2px',
          animation: `wave ${0.8 + (i % 5) * 0.15}s ease-in-out infinite`,
          animationDelay: `${(i * 0.07) % 0.8}s`,
          transformOrigin: 'center',
        }} />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem', textAlign: 'center',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(230,57,70,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Top waveform */}
      <div style={{ width: '100%', maxWidth: '560px', marginBottom: '1rem' }}>
        <Waveform />
      </div>

      {/* Hero image */}
      <div style={{
        animation: 'fadeUp 0.8s ease forwards',
        width: '100%', maxWidth: '640px',
        borderRadius: '16px', overflow: 'hidden',
        boxShadow: '0 0 60px rgba(230,57,70,0.22)',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hitman.jpeg" alt="HitMan AI" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>

      {/* Title */}
      <div style={{ animation: 'fadeUp 0.9s ease 0.1s both' }}>
        <h1 style={{
          fontSize: 'clamp(2.8rem, 10vw, 5.5rem)',
          fontWeight: 900,
          letterSpacing: '0.12em',
          lineHeight: 1,
          marginBottom: '0.6rem',
          textTransform: 'uppercase',
        }}>
          HIT<span style={{ color: 'var(--accent)' }}>MAN</span> AI
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 3vw, 1.25rem)',
          color: 'var(--muted)',
          letterSpacing: '0.04em',
          marginBottom: '2rem',
        }}>
          Drop a concept. Walk out with a hit.
        </p>

        <Link href="/studio" style={{
          display: 'inline-block',
          background: 'var(--accent)',
          color: '#fff',
          padding: '0.9rem 2.5rem',
          borderRadius: '9999px',
          fontSize: '1.05rem',
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          boxShadow: '0 0 32px rgba(230,57,70,0.35)',
          transition: 'box-shadow 0.2s',
        }}>
          Open Studio →
        </Link>
      </div>

      {/* Bottom waveform */}
      <div style={{ width: '100%', maxWidth: '560px', marginTop: '1.5rem' }}>
        <Waveform flip />
      </div>

      {/* Features row */}
      <div style={{
        display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center',
        marginTop: '2rem', animation: 'fadeUp 1s ease 0.3s both',
      }}>
        {['✍️ AI Lyrics', '🎵 Beat Generation', '🎤 AI Vocals', '🎚️ Full Mix'].map(f => (
          <span key={f} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '9999px', padding: '0.35rem 1rem',
            fontSize: '0.82rem', color: 'var(--muted)',
          }}>{f}</span>
        ))}
      </div>
    </main>
  );
}
