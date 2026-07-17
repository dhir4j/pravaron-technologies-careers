import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

const manrope = localFont({
  src: [
    { path: "./fonts/OpenSans-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/OpenSans-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-manrope",
  display: "swap",
});

const mono = localFont({
  src: [
    { path: "./fonts/AdwaitaMono-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/AdwaitaMono-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://careers.pravarontechnologies.com"),
  title: {
    default: "Pravaron Technologies Careers | Build Intelligent Systems",
    template: "%s | Pravaron Technologies Careers",
  },
  description:
    "Join Pravaron Technologies to build agentic AI, automation platforms, and intelligent systems for future-ready businesses.",
  openGraph: {
    title: "Pravaron Technologies Careers",
    description:
      "Build the operating layer for autonomous business with Pravaron Technologies.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${manrope.variable} ${mono.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
