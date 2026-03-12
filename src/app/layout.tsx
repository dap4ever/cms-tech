import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import styles from "./layout.module.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevCMS v0.1 | Gestão de Desenvolvedores",
  description: "CMS focado na experiência de Desenvolvedores. Visual Dark Mode Premium.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className={styles.appContainer}>
          <Sidebar />
          <div className={styles.mainContent}>
            <Topbar />
            <main className={styles.pageContent}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
