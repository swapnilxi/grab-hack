import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
title: "Grab PayBot",
description: "Autonomous AI-Powered Payment Assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="en">
<body className="bg-gray-100 text-gray-900 font-sans antialiased min-h-screen">
<main className="flex min-h-screen  justify-center p-4">{children}</main>
</body>
</html>
);
}