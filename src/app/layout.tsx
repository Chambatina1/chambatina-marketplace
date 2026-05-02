import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marketplace Chambatina",
  description: "Encuentra y ofrece servicios en tu comunidad",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#0F0B1E] antialiased">{children}</body>
    </html>
  );
}
