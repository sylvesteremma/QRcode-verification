import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEMEK QR Verification",
  description:
    "Verify authentic SEMEK products with a simple QR scan or code lookup.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
