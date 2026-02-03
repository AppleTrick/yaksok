import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "yaksok",
  description: "Premium appointment scheduling app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "yaksok",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import BottomTabBar from "../layout/BottomTabBar";
import NotificationManagerEnhanced from "@/features/notification/components/NotificationManagerEnhanced";
import { FCMPermissionRequest } from "@/features/notification";
import { ScheduleProvider } from "@/features/notification/contexts/ScheduleContext";
import { ReportProvider } from "@/features/report/contexts/ReportContext";
import PageTransition from "@/components/common/PageTransition";
import { AnimatePresence } from "framer-motion";

import AppContainer from "@/layout/AppContainer";

import { ThemeProvider } from "../contexts/ThemeContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ScheduleProvider>
            <ReportProvider>
              <AppContainer>
                <AnimatePresence mode="wait">
                  <PageTransition>
                    {children}
                  </PageTransition>
                </AnimatePresence>
                <NotificationManagerEnhanced />
                <FCMPermissionRequest />
              </AppContainer>
              <BottomTabBar />
            </ReportProvider>
          </ScheduleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
