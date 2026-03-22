import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TruthLayer - AI-Powered Misinformation Detection",
  description: "Detect fake content instantly with AI. TruthLayer uses advanced AI to verify any content in seconds, providing trust scores, detailed analysis, and warning flags.",
  keywords: ["misinformation detection", "fake news checker", "AI verification", "content analysis", "truth verification", "fact checking"],
  authors: [{ name: "Edwin McCain" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "TruthLayer - AI-Powered Misinformation Detection",
    description: "Detect fake content instantly with AI-powered trust scores and detailed analysis.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TruthLayer - AI-Powered Misinformation Detection",
    description: "Detect fake content instantly with AI-powered trust scores and detailed analysis.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
