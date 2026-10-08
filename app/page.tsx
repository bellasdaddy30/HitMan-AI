import Link from 'next/link';

export default function Home() {
  return (
    <main style={{
      position: 'relative',
      minHeight: '100dvh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
    }}>

      {/* Full-bleed background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hitman.jpg"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
          zIndex: 0,
        }}
      />

      {/* Cinematic gradient — dark at bottom, mostly clear at top */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(9,9,14,0.55) 65%, rgba(9,9,14,0.92) 82%, rgba(9,9,14,1) 100%)',
        zIndex: 1,
      }} />

      {/* Subtle red glow from below */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        height: '40%',
        background: 'radial-gradient(ellipse at bottom, rgba(230,57,70,0.18) 0%, transparent 70%)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* UI — lives at the bottom, over the gradient */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        padding: '0 1.5rem 3rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '0.75rem',
        animation: 'fadeUp 0.8s ease 0.1s both',
      }}>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(3rem, 14vw, 7rem)',
          fontWeight: 900,
          letterSpacing: '0.14em',
          lineHeight: 1,
          textTransform: 'uppercase',
          textShadow: '0 2px 40px rgba(0,0,0,0.8)',
          margin: 0,
        }}>
          HIT<span style={{ color: 'var(--accent)' }}>MAN</span> AI
        </h1>

        {/* Tagline */}
        <p style={{
          fontSize: 'clamp(0.95rem, 3vw, 1.2rem)',
          color: 'rgba(240,240,248,0.75)',
          letterSpacing: '0.06em',
          margin: 0,
          textShadow: '0 1px 12px rgba(0,0,0,0.9)',
        }}>
          Drop a concept. Walk out with a hit.
        </p>

        {/* CTA */}
        <Link href="/studio" style={{
          display: 'inline-block',
          background: 'var(--accent)',
          color: '#fff',
          padding: '0.85rem 2.4rem',
          borderRadius: '9999px',
          fontSize: '1rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          boxShadow: '0 0 40px rgba(230,57,70,0.5)',
          marginTop: '0.5rem',
        }}>
          Open Studio →
        </Link>

        {/* Feature pills */}
        <div style={{
          display: 'flex',
          gap: '0.6rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: '0.5rem',
        }}>
          {['✍️ AI Lyrics', '🎵 Beat Generation', '🎤 AI Vocals', '🎚️ Full Mix'].map(f => (
            <span key={f} style={{
              background: 'rgba(17,17,24,0.7)',
              border: '1px solid rgba(37,37,53,0.8)',
              backdropFilter: 'blur(8px)',
              borderRadius: '9999px',
              padding: '0.3rem 0.9rem',
              fontSize: '0.78rem',
              color: 'rgba(112,112,160,0.9)',
            }}>{f}</span>
          ))}
        </div>
      </div>
    </main>
  );
}
