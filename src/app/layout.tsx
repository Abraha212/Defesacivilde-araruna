import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Defesa Civil Araruna",
  description: "Sistema Institucional da Defesa Civil - Prefeitura de Araruna/PB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
