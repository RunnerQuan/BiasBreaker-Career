import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/fraunces/800.css";
import "@fontsource/fraunces/900.css";
import "@fontsource/noto-sans-sc/400.css";
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-sans-sc/700.css";
import "@fontsource/noto-sans-sc/900.css";
import "./globals.css";
import "./loading-effects.css";

export const metadata: Metadata = {
  title: "BiasBreaker Career 破偏求职",
  description: "识别简历在招聘算法中的可读性风险，优化表达方式，提高被看见的机会。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
