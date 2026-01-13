import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  // Desabilitar indicador de desenvolvimento
  devIndicators: false,
};

export default nextConfig;
