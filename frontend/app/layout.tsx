import type { Metadata } from "next";
import { Unbounded } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({
  subsets: ["cyrillic", "latin"],
  variable: "--font-unbounded",
});

export const metadata: Metadata = {
  title: "Инсайт - Ваш надёжный партнёр в оптовых поставках строительных материалов",
  description: "Комплексные оптовые поставки стройматериалов по России: от расходников до профессионального инструмента. Гарантированные сроки, стабильные цены и персональный менеджер под ваш объект.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${unbounded.variable} antialiased bg-background text-sm`}
      >
        {children}
      </body>
    </html>
  );
}
