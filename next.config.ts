import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignorar erros de ESLint durante build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignorar erros de TypeScript durante build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Permitir imagens externas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
