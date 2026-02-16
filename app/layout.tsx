import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from 'next/script';
import { SocketProvider } from "@/app/providers";
import "./globals.css";
import { AppFooter, ToastProvider } from '@/src/shared/ui';
import { TelegramAutoAuthProvider } from '@/src/app/providers/telegram-auto-auth-provider';

const geistSans = localFont({
  src: "../public/fonts/JetBrainsMono-Regular.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: [
    {
      path: "../public/fonts/JetBrainsMono-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/JetBrainsMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/JetBrainsMono-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/JetBrainsMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/JetBrainsMono-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/JetBrainsMono-SemiBoldItalic.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/fonts/JetBrainsMono-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/JetBrainsMono-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "../public/fonts/JetBrainsMono-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../public/fonts/JetBrainsMono-ExtraBoldItalic.woff2",
      weight: "800",
      style: "italic",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bunker - Игра на выживание",
  description: "Онлайн игра Бункер - кто выживет в апокалипсисе?",
  icons: {
    icon: '/favicon.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 selection:bg-amber-500 selection:text-black`}
      >
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <main className='max-w-7xl mx-auto px-4 py-8 text-zinc-200 font-mono'>
          <ToastProvider />
          <TelegramAutoAuthProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </TelegramAutoAuthProvider>
        </main>
      </body>
    </html>
  );
}
