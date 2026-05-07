import type { Metadata } from "next";
import { AppStateProvider } from "@/components/AppStateProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThinkingAP",
  description: "Turn unusual ideas into plans, prompts, and local AI-built prototypes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
