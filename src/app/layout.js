import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ConfigProvider } from "antd";
import enUS from "antd/lib/locale/en_US";
import ClientSessionWrapper from "./client-session-wrapper";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Calmly",
  description: "Calmly: a telepsychiatry platform",
  image: "/logo.svg",
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ConfigProvider locale={enUS}>

          <ClientSessionWrapper>{children}</ClientSessionWrapper>
        </ConfigProvider>
      </body>
    </html>
  );
}
