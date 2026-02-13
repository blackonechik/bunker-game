import type { Metadata } from "next";
import localFont from "next/font/local";
import { SocketProvider } from "@/app/providers";
import "./globals.css";
import { ToastProvider } from '@/src/shared/ui';

const geistSans = localFont({
  src: "../public/fonts/gyByhwUxId8gMEwcGFWNOITd.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "../public/fonts/gyByhwUxId8gMEwcGFWNOITd.woff2",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bunker - Игра на выживание",
  description: "Онлайн игра Бункер - кто выживет в апокалипсисе?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 min-h-screen selection:bg-amber-500 selection:text-black`}
      >
        <main className='max-w-7xl mx-auto px-4 py-8 text-zinc-200 font-mono'>
          <ToastProvider />
          <SocketProvider>
            {children}
          </SocketProvider>
        </main>
        <footer className="mt-20 border-t border-zinc-900 bg-black/40 backdrop-blur-md p-10 relative z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[repeating-linear-gradient(90deg,#f59e0b,#f59e0b_20px,#000_20px,#000_40px)] opacity-40" />
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-[10px] text-zinc-600 font-bold tracking-[0.2em] text-center md:text-left">
              PROTOCOL 404 <br /> ARCHIVE-ID: BUNKER-S7
            </div>
            <div className="text-[9px] text-zinc-700 uppercase italic max-w-xs text-center md:text-right">
              Property of the Core Administration. Unauthorized duplication will result in immediate life-support
              termination.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
