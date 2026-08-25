import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getSteamSession, getAdminSession } from "@/lib/session";
import { getSystemPhase } from "@/lib/db";

export const metadata: Metadata = {
  title: "Steam Family Picker | Dobór Optymalnej Rodziny Steam",
  description: "Anonimowe głosowanie i optymalny dobór 4 kont do Rodziny Steam",
  icons: {
    icon: "/icon.svg",
    shortcut: "/favicon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#171a21",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSteamSession();
  const isAdmin = await getAdminSession();
  const phase = getSystemPhase();

  return (
    <html lang="pl">
      <body className="bg-steam-dark text-steam-text min-h-screen flex flex-col antialiased selection:bg-steam-blue selection:text-steam-dark">
        <Navbar user={user} phase={phase} isAdmin={isAdmin} />
        
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          {children}
        </main>

        <footer className="border-t border-steam-border/40 bg-steam-base/80 backdrop-blur-md py-6 text-center text-xs text-steam-textMuted">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-steam-blue" />
              <p className="font-medium text-steam-text/80">Steam Family Picker &copy; {new Date().getFullYear()}</p>
            </div>
            <p className="text-[11px] text-steam-textMuted/70">Działa w oparciu o oficjalne Steam Web API i Steam OpenID 2.0</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
