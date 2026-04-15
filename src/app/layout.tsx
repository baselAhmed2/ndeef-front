
import './globals.css'
import { ReactNode } from 'react'
import { AuthProvider } from '@/app/context/AuthContext'
import { PreferencesProvider } from '@/app/context/PreferencesContext'
import { GlobalPreferenceFab } from '@/app/components/preferences/GlobalPreferenceFab'
import { ProjectPreferenceRuntime } from '@/app/components/preferences/ProjectPreferenceRuntime'
import { Toaster } from '@/app/components/ui/sonner'

export const metadata = {
  title: 'Laundry Service App',
  description: 'Fast and convenient laundry service',
}

const preferenceBootstrapScript = `
(function () {
  try {
    var theme = localStorage.getItem("nadeef_theme_mode");
    var language = localStorage.getItem("nadeef_language");

    if (theme !== "dark" && theme !== "light") {
      theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    if (language !== "ar" && language !== "en") {
      language = (navigator.language || "").toLowerCase().indexOf("ar") === 0 ? "ar" : "en";
    }

    var root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.dataset.theme = theme;
    root.dataset.locale = language;
    root.lang = language;
    root.dir = language === "ar" ? "rtl" : "ltr";
  } catch (error) {}
})();
`

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: preferenceBootstrapScript }} />
        <PreferencesProvider>
          <AuthProvider>
            {children}
            <ProjectPreferenceRuntime />
            <GlobalPreferenceFab />
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </PreferencesProvider>
      </body>
    </html>
  )
}
