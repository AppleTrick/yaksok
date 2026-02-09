import React from "react";
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
  title: "약속 (Yaksok)",
  description: "영양제 복용 알림 서비스",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/logo.png", sizes: "any", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/logo.png", sizes: "any", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "약속",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF5722",
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
        <link rel="icon" href="/icons/logo.png" type="image/png" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/logo.png" />
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
                <React.Suspense fallback={null}>
                  <NotificationManagerEnhanced />
                </React.Suspense>
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
