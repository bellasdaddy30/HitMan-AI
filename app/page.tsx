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

function HitmanScene() {
  return (
    <svg viewBox="0 0 520 260" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: '560px', height: 'auto' }}>

      {/* ── HITMAN (left, aiming right) ── */}
      {/* Fedora brim */}
      <ellipse cx="118" cy="52" rx="34" ry="8" fill="#111" />
      {/* Fedora crown */}
      <rect x="100" y="28" width="36" height="26" rx="8" fill="#111" />
      {/* Head */}
      <circle cx="118" cy="72" r="16" fill="#1a1a1a" />
      {/* Neck */}
      <rect x="112" y="86" width="12" height="10" fill="#1a1a1a" />
      {/* Suit jacket body */}
      <polygon points="90,96 146,96 152,170 84,170" fill="#111" />
      {/* Shirt/tie line */}
      <line x1="118" y1="96" x2="118" y2="160" stroke="#222" strokeWidth="3" />
      {/* Right arm extended holding gun */}
      <line x1="144" y1="118" x2="210" y2="128" stroke="#111" strokeWidth="14" strokeLinecap="round" />
      {/* Left arm bent down */}
      <line x1="94" y1="118" x2="80" y2="160" stroke="#111" strokeWidth="12" strokeLinecap="round" />
      {/* Legs */}
      <line x1="100" y1="170" x2="88" y2="240" stroke="#111" strokeWidth="14" strokeLinecap="round" />
      <line x1="132" y1="170" x2="144" y2="240" stroke="#111" strokeWidth="14" strokeLinecap="round" />
      {/* Shoes */}
      <ellipse cx="82" cy="242" rx="16" ry="6" fill="#0a0a0a" />
      <ellipse cx="148" cy="242" rx="16" ry="6" fill="#0a0a0a" />
      {/* Gun */}
      <rect x="200" y="122" width="36" height="11" rx="3" fill="#0a0a0a" />
      <rect x="218" y="133" width="10" height="8" rx="2" fill="#0a0a0a" />
      {/* Muzzle */}
      <rect x="234" y="124" width="10" height="7" rx="2" fill="#222" />

      {/* ── LASER SIGHT ── */}
      <line x1="244" y1="127" x2="358" y2="127"
        stroke="#e63946" strokeWidth="1.5" strokeDasharray="6 4"
        style={{ animation: 'laserPulse 1.2s ease-in-out infinite' }} />

      {/* ── BOOM BOX (right) ── */}
      {/* Main body */}
      <rect x="358" y="88" width="130" height="90" rx="10" fill="#0f0f18" stroke="#252535" strokeWidth="2" />
      {/* Handle */}
      <path d="M390 88 Q425 68 460 88" stroke="#252535" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* Left speaker */}
      <circle cx="395" cy="133" r="26" fill="#0a0a0f" stroke="#1e1e2e" strokeWidth="2" />
      <circle cx="395" cy="133" r="18" fill="#111" stroke="#252535" strokeWidth="1.5" />
      <circle cx="395" cy="133" r="8" fill="#0a0a0a" />
      <circle cx="395" cy="133" r="3" fill="#e63946" opacity="0.5" />
      {/* Right speaker */}
      <circle cx="453" cy="133" r="26" fill="#0a0a0f" stroke="#1e1e2e" strokeWidth="2" />
      <circle cx="453" cy="133" r="18" fill="#111" stroke="#252535" strokeWidth="1.5" />
      <circle cx="453" cy="133" r="8" fill="#0a0a0a" />
      <circle cx="453" cy="133" r="3" fill="#e63946" opacity="0.5" />
      {/* Center panel */}
      <rect x="412" y="95" width="22" height="12" rx="3" fill="#0a0a0f" stroke="#252535" />
      <rect x="415" y="98" width="16" height="6" rx="1" fill="#e63946" opacity="0.3" />
      {/* Antenna */}
      <line x1="470" y1="88" x2="482" y2="56" stroke="#252535" strokeWidth="3" strokeLinecap="round" />
      <circle cx="482" cy="54" r="4" fill="#e63946" opacity="0.6" />

      {/* ── CROSSHAIR on boom box ── */}
      <g transform="translate(424, 127)"
        style={{ animation: 'crosshairSpin 4s linear infinite', transformOrigin: '0px 0px' }}>
        <circle cx="0" cy="0" r="18" stroke="#e63946" strokeWidth="1.5" fill="none" opacity="0.8" />
        <line x1="-22" y1="0" x2="-12" y2="0" stroke="#e63946" strokeWidth="1.5" opacity="0.8" />
        <line x1="12" y1="0" x2="22" y2="0" stroke="#e63946" strokeWidth="1.5" opacity="0.8" />
        <line x1="0" y1="-22" x2="0" y2="-12" stroke="#e63946" strokeWidth="1.5" opacity="0.8" />
        <line x1="0" y1="12" x2="0" y2="22" stroke="#e63946" strokeWidth="1.5" opacity="0.8" />
        <circle cx="0" cy="0" r="3" fill="#e63946" opacity="0.9" />
      </g>

      {/* ── SOUND WAVES from boom box ── */}
      {[1, 2, 3].map(n => (
        <path key={n}
          d={`M 490 ${133 - n * 18} Q ${495 + n * 4} 133 490 ${133 + n * 18}`}
          stroke="#e63946" strokeWidth={1.5 - n * 0.3} fill="none"
          opacity={0.5 - n * 0.12}
          style={{ animation: `laserPulse ${1 + n * 0.3}s ease-in-out infinite`, animationDelay: `${n * 0.2}s` }}
        />
      ))}
    </svg>
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

      {/* Scene illustration */}
      <div style={{ animation: 'fadeUp 0.8s ease forwards', width: '100%', maxWidth: '560px' }}>
        <HitmanScene />
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
