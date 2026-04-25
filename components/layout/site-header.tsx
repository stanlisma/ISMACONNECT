"use client";

import Link from "next/link";
import InstallButton from "@/components/install-button";

type Viewer = {
  user: {
    id: string;
    email?: string;
  };
} | null;

interface SiteHeaderProps {
  viewer: Viewer;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
}

export function SiteHeader({
  viewer,
  unreadMessagesCount,
  unreadNotificationsCount,
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img
            src="/logo/logo-light.svg"
            alt="ISMACONNECT"
            className="h-8 w-auto max-w-[170px]"
          />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4 text-sm font-medium text-gray-700">
          <InstallButton />

          {viewer ? (
            <>
              <Link href="/messages" className="relative hover:text-blue-600">
                Messages
                {unreadMessagesCount > 0 && (
                  <span className="absolute -right-3 -top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                    {unreadMessagesCount}
                  </span>
                )}
              </Link>

              <Link
                href="/notifications"
                className="relative hover:text-blue-600"
              >
                Notifications
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -right-3 -top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                    {unreadNotificationsCount}
                  </span>
                )}
              </Link>

              <Link href="/profile" className="hover:text-blue-600">
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-600">
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}