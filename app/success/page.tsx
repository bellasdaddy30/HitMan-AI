'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const LS_CREDITS   = 'hitman_credits';
const FREE_CREDITS = 3;

function loadCredits(): number {
  try { const s = localStorage.getItem(LS_CREDITS); return s === null ? FREE_CREDITS : Math.max(0, Number(s)); }
  catch { return FREE_CREDITS; }
}
function saveCredits(n: number) { try { localStorage.setItem(LS_CREDITS, String(n)); } catch {} }

function SuccessContent() {
  const params  = useSearchParams();
  const credits = Number(params.get('credits') || '0');
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    if (credits > 0) {
      const updated = loadCredits() + credits;
      saveCredits(updated);
      setTotal(updated);
    }
  }, [credits]);

  return (
    <div style={{ position: 'relative', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflow: 'hidden' }}>
      {/* background */}
      <img src="/hitman.jpg" aria-hidden alt="" style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: 'center top', zIndex: 0,
        filter: 'blur(6px) brightness(0.32)', transform: 'scale(1.06)',
      }} />
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,9,14,0.78)', zIndex: 1 }} />
      {/* golden glow from bottom */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '70%', height: '40%', zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at bottom, rgba(255,180,50,0.12) 0%, transparent 70%)' }} />

      {/* card */}
      <div style={{
        position: 'relative', zIndex: 2, maxWidth: '420px', width: '100%', textAlign: 'center',
        display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center',
        background: 'rgba(17,17,24,0.72)', backdropFilter: 'blur(14px)',
        border: '1px solid rgba(230,57,70,0.25)', borderRadius: '20px', padding: '2.5rem 2rem',
        boxShadow: '0 0 60px rgba(230,57,70,0.12)',
        animation: 'fadeUp 0.5s ease both',
      }}>
        <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 20px rgba(230,57,70,0.6))' }}>🎯</div>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 900, lineHeight: 1.1 }}>
          You&apos;re loaded up.
        </h1>
        <p style={{ color: 'rgba(240,240,248,0.65)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: '#fff' }}>{credits} credits</strong> added to your account.
          {total !== null && <> You now have <strong style={{ color: 'var(--accent)' }}>{total} credits</strong> total.</>}
        </p>
        <a href="/studio" style={{
          display: 'inline-block', color: '#fff', padding: '0.9rem 2.2rem',
          borderRadius: '9999px', fontWeight: 900, fontSize: '1rem',
          letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.5rem',
          backgroundSize: '200% auto',
          background: 'linear-gradient(90deg, #e63946 0%, #ff6b6b 40%, #fff 50%, #ff6b6b 60%, #e63946 100%)',
          animation: 'shimmer 2.8s linear infinite, glowPulse 2.5s ease-in-out infinite',
        }}>
          Back to Studio →
        </a>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return <Suspense><SuccessContent /></Suspense>;
}
