import type { Metadata } from "next";
import { Goudy_Bookletter_1911 } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";

const goudyBookletter = Goudy_Bookletter_1911({
  variable: "--font-goudy-bookletter",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Viral Images",
  description: "Browse image reprints from historical newspapers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${goudyBookletter.variable} antialiased pt-16`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
