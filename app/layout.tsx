import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GridSense — AI Energy Intelligence',
  description: 'Live UK grid data, postcode alerts, EPC property intelligence and energy savings — powered by AI.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.gridsense.evervia.co.uk" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
