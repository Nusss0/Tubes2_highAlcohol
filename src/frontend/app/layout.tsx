import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "highAlcohol",
  description: "DOM Tree Traversal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
