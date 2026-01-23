import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"], // Multiple weights available
});

export const metadata: Metadata = {
  title: "Viral Images",
  description: "Explore viral images from historical newspapers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${newsreader.variable} antialiased pt-16`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
