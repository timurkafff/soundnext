import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const comfortaa = localFont({
  src: "../font/Comfortaa/Comfortaa-VariableFont_wght.ttf",
  variable: "--font-comfortaa",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SoundNext - Stream Music from SoundCloud",
  description: "Search and stream music from SoundCloud with a beautiful AMOLED interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${comfortaa.variable} font-sans antialiased bg-black`}
        style={{ fontFamily: "var(--font-comfortaa), sans-serif" }}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
