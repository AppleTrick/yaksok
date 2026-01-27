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
import NotificationManager from "@/features/notification/components/NotificationManager";
import { ScheduleProvider } from "@/features/notification/contexts/ScheduleContext";

import { MSWProvider } from "./MSWProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ScheduleProvider>
          <MSWProvider>
            {children}
            <BottomTabBar />
            <NotificationManager />
          </MSWProvider>
        </ScheduleProvider>
      </body>
    </html>
  );
}
