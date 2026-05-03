import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    importScripts: ["/firebase-messaging-sw.js"], // PWA SW에 FCM 로직 통합
  },
});

const nextConfig: NextConfig = {
  output: "standalone",
  // Silence Turbopack warning when using Webpack-based PWA plugins
  turbopack: {},
  // 분석 API가 1분 이상 소요될 수 있으므로 프록시 타임아웃을 180초로 설정
  experimental: {
    proxyTimeout: 180000, // 180초 (3분)
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

    return [
      {
        source: '/api/v1/notification/subscribe',
        destination: `${apiUrl}/api/v1/notification/subscribe`,
      },
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
      {
        source: '/ai/v1/:path*',
        destination: `${apiUrl}/ai/v1/:path*`, // 백엔드와 AI 서버 주소가 동일함
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/v1/notification/subscribe',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-transform',
          },
          {
            key: 'X-Accel-Buffering',
            value: 'no',
          },
          {
            key: 'Content-Type',
            value: 'text/event-stream',
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
