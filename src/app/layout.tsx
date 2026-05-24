import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { DevBanner } from "@/components/dev-banner";
import { TopAccentLine } from "@/components/layout/top-accent-line";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Resource Manager | Arithmos",
  description: "Team resource and project allocation management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body className={`${roboto.variable} antialiased`}>
        <TopAccentLine />
        <DevBanner />
        {children}
      </body>
    </html>
  );
}
