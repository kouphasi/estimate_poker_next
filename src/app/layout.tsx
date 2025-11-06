import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "工数見積もりポーカー",
  description: "プランニングポーカー形式で工数を見積もるWebアプリケーション",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
