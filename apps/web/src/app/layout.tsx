import type { Metadata } from "next";
import { DM_Sans, Source_Serif_4 } from "next/font/google";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/context/theme-context";
import { themeInitScript } from "@/lib/theme-script";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-admin-sans",
  subsets: ["latin"],
});

const display = Source_Serif_4({
  variable: "--font-admin-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Socios Backoffice",
  description: "Gestión de socios del club de tenis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
