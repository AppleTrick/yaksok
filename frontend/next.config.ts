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
  },
});

const nextConfig: NextConfig = {
  // Silence Turbopack warning when using Webpack-based PWA plugins
  turbopack: {},
  // 분석 API가 1분 이상 소요될 수 있으므로 프록시 타임아웃을 180초로 설정
  experimental: {
    proxyTimeout: 180000, // 180초 (3분)
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8080/api/v1/:path*',
      },
      {
        source: '/ai/v1/:path*',
        destination: 'http://localhost:8000/v1/:path*',
      },
    ];
  },
};

export default withPWA(nextConfig);
