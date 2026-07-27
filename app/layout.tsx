import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Copenhagen Move Dashboard',
  description: 'Track housing, finances, admin, and logistics for the Copenhagen move.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
