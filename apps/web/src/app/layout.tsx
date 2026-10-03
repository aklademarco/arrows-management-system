import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { InstallAppPrompt } from "@/components/install-app-prompt";

export const metadata: Metadata = {
  title: {
    default: "Arrows Church Management System",
    template: "%s | Arrows Church",
  },

  description:
    "Member, attendance, event, and department management for Arrows Church.",

  manifest: "/site.webmanifest",

  applicationName: "Arrows",

  appleWebApp: {
    capable: true,
    title: "Arrows",
    statusBarStyle: "default",
  },

  icons: {
    icon: [
      {
        url: "/favicon-32x32.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/favicon-16x16.png",
        type: "image/png",
        sizes: "16x16",
      },
    ],

    apple: [
      {
        url: "/apple-touch-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("acms-theme");document.documentElement.dataset.theme=t==="dark"?"dark":"light"}catch(e){}})()`,
          }}
        />
      </head>
      <body className="app-shell min-h-full flex flex-col">
        {children}
        <InstallAppPrompt />
      </body>
    </html>
  );
}
