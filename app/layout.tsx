import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HitMan AI',
  description: 'AI music production — write lyrics, generate beats, and produce full songs.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
