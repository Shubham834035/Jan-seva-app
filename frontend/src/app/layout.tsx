import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import PrototypeNoticeBanner from "@/components/PrototypeNoticeBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Jan Seva - Citizen Problem Reporting & Smart Routing Platform",
  description: "Citizen Problem Reporting, Smart Jurisdictional Routing & Resolution Platform for India",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen">
        <I18nProvider>
          <PrototypeNoticeBanner />
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
