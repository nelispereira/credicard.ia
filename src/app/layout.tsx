import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { ThemeProvider } from "@/components/ThemeProvider";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Credicard.ia",
  description: "Controle de uso e rateio de cartões de crédito",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geist.variable} font-sans antialiased bg-slate-50 dark:bg-gray-950 min-h-screen transition-colors`}>
        <ThemeProvider>
          <Nav />
          <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
