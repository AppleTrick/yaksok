import React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "@/astryx-themes"; // 약속 테마 (src/themes/yaksok, astryx 테마 편집기로 만든다)
import "../styles/tokens.css";
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
  title: "약속",
  description: "영양제를 찍으면 성분을 확인하고 제때 알려 드려요",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "yaksok",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F6F8",
  viewportFit: "cover", // 아이폰 홈 막대 영역까지 그리고, safe-area로 비켜 둔다
  width: "device-width",
  initialScale: 1,
};

import BottomTabBar from "../layout/BottomTabBar";
import NotificationManagerEnhanced from "@/features/notification/components/NotificationManagerEnhanced";
import { ScheduleProvider } from "@/features/notification/contexts/ScheduleContext";
import { ReportProvider } from "@/features/report/contexts/ReportContext";
import PageTransition from "@/components/common/PageTransition";
import { AnimatePresence } from "framer-motion";

import AppContainer from "@/layout/AppContainer";

import { ThemeProvider } from "../contexts/ThemeContext";
import AstryxRoot from "./AstryxRoot";

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
        <AstryxRoot>
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
              </AppContainer>
              <BottomTabBar />
            </ReportProvider>
          </ScheduleProvider>
        </AstryxRoot>
        </ThemeProvider>
      </body>
    </html>
  );
}
