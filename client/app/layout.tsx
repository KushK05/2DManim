import './globals.css';
import type { ReactNode } from 'react';
import AppFrame from '@/components/AppFrame';

export const metadata = {
  title: '2DManim',
  description: 'AI-powered Manim animation generation studio',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
