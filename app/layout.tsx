import type { Metadata } from "next";
import "./globals.css";
import Navigation from "./components/Navigation";
import { thesisContent } from "../content/thesis-content";

export const metadata: Metadata = {
  title: thesisContent.hero.title,
  description: thesisContent.abstract.content.length > 160 
    ? thesisContent.abstract.content.substring(0, 160) + "..." 
    : thesisContent.abstract.content,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-ppt-dark3">
      <body className="antialiased bg-ppt-dark3">
        <Navigation />
        {children}
      </body>
    </html>
  );
}

