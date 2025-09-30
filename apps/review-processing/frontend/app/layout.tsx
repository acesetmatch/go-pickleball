import React from 'react';
import './globals.css'

export const metadata = {
  title: 'YouCap',
  description: 'Extract, search, and summarize YouTube captions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
