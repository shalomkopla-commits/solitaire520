import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NEURAL SOLITAIRE // AI CORE - Cyber Klondike Solitaire',
  description:
    'Next-generation Cyber Klondike Solitaire powered by AI heuristics, neural board analysis, holographic cards, and reactive sound synthesis in Next.js.',
  keywords: [
    'Solitaire',
    'Klondike',
    'Cyberpunk Solitaire',
    'AI Solitaire',
    'Next.js Solitaire',
    'Neural Card Game',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Share+Tech+Mono&family=Outfit:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
