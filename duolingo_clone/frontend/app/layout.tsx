import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { PreferencesProvider } from "@/context/PreferencesContext";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Duolingo Clone",
  description: "Learn Spanish with the interactive Duolingo Web App Clone",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={nunito.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var saved = localStorage.getItem('duo-theme');
                var isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-base text-ink min-h-screen">
        <PreferencesProvider>
          <UserProvider>{children}</UserProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
