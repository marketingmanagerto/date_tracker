import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const dmMono = DM_Mono({ variable: "--font-dm-mono", subsets: ["latin"], weight: ["300", "400", "500"] });

export const metadata: Metadata = {
  title: "Remind Me — Never Miss a Date",
  description: "Track every important date: birthdays, anniversaries, renewals, expirations, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${dmMono.variable} antialiased`}>
        <ThemeProvider>
          <SessionProvider>
            {children}
            <Toaster richColors />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
