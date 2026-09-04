import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PayFire — AI Payment Chaos Lab",
  description: "Break payments before they break your revenue. Pre-deployment simulation & testing platform for payment recovery strategies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0f19] text-gray-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
