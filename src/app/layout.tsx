import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Domestique Index – Cycling Ride Honesty Tracker & Badge App',
  description: 'Track your cycling intentions vs reality. Log rides, earn badges, and see your true “trust score”. Built for weekend cyclists.',
  keywords: ['cycling', 'strava', 'cycling meme', 'coffee ride', 'trust score', 'group ride'],
  authors: [{ name: 'Domestique Index Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-dark-bg text-slate-100 selection:bg-cyber-lime selection:text-dark-bg">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
