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
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4">
        
        {/* FORCE HORIZONTAL LAYOUT */}
        <div className="flex items-center justify-between h-16">

          {/* LOGO */}
          <Link href="/" className="flex items-center">
            <img
              src="/logo/logo-light.svg"
              alt="ISMACONNECT"
              className="h-8 w-auto"
            />
          </Link>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-6 text-sm font-medium text-gray-700">

            <InstallButton />

            {viewer ? (
              <>
                <Link href="/messages" className="hover:text-blue-600">
                  Messages
                </Link>

                <Link href="/notifications" className="hover:text-blue-600">
                  Notifications
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
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}