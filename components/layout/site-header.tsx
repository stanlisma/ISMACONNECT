"use client";

import Link from "next/link";
import Image from "next/image";
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
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LEFT — LOGO */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo/logo-light.svg"
            alt="ISMACONNECT"
            width={160}
            height={40}
            priority
          />
        </Link>

        {/* RIGHT — NAV */}
        <div className="flex items-center gap-4">

          {/* INSTALL BUTTON */}
          <InstallButton />

          {viewer ? (
            <>
              {/* MESSAGES */}
              <Link
                href="/messages"
                className="relative text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Messages
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {unreadMessagesCount}
                  </span>
                )}
              </Link>

              {/* NOTIFICATIONS */}
              <Link
                href="/notifications"
                className="relative text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Notifications
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {unreadNotificationsCount}
                  </span>
                )}
              </Link>

              {/* PROFILE */}
              <Link
                href="/profile"
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}