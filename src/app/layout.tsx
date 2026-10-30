import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { SignOutButton } from "@/components/SignOutButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ajaia Docs",
  description: "A lightweight collaborative document editor",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body className="antialiased">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white print:hidden">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="font-semibold text-blue-900">
              Ajaia Docs
            </Link>
            {user && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-600">
                  {user.name} <span className="text-slate-400">({user.email})</span>
                </span>
                <SignOutButton />
              </div>
            )}
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
