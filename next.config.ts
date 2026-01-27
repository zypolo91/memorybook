import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: process.env.NODE_ENV === 'development' ? false : true,
  // 开发时允许的跨域来源（解决从 26.26.26.1 访问 /_next/* 的警告）
  allowedDevOrigins: ['26.26.26.1'],
  // 基础配置
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react']
  }
};

export default nextConfig;
