
import './globals.css'
import { ReactNode } from 'react'
import { AuthProvider } from '@/app/context/AuthContext'
import { Toaster } from '@/app/components/ui/sonner'

export const metadata = {
  title: 'Laundry Service App',
  description: 'Fast and convenient laundry service',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  )
}
