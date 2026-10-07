import Link from 'next/link';

export default function Home() {
  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      textAlign: 'center',
    }}>
      <div style={{ marginBottom: '1.5rem', fontSize: '3rem' }}>🎯</div>

      <h1 style={{
        fontSize: 'clamp(2.5rem, 8vw, 5rem)',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        lineHeight: 1.1,
        marginBottom: '1rem',
      }}>
        HitMan <span style={{ color: 'var(--accent)' }}>AI</span>
      </h1>

      <p style={{
        fontSize: '1.2rem',
        color: 'var(--muted)',
        maxWidth: '480px',
        lineHeight: 1.6,
        marginBottom: '2.5rem',
      }}>
        Write lyrics, generate beats, and produce full songs — from first idea to finished track.
      </p>

      <Link href="/studio" style={{
        background: 'var(--accent)',
        color: '#fff',
        padding: '1rem 2.5rem',
        borderRadius: '9999px',
        fontSize: '1.1rem',
        fontWeight: 700,
        letterSpacing: '0.01em',
        transition: 'background 0.15s',
      }}>
        Open Studio →
      </Link>

      <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
        Powered by ACE-Step · fal.ai
      </p>
    </main>
  );
}
