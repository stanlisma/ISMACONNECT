"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="mobile-nav">
      <Link href="/browse" className={isActive("/browse") ? "active" : ""}>
        🔍
        <span>Search</span>
      </Link>

      <Link href="/messages" className={isActive("/messages") ? "active" : ""}>
        💬
        <span>Chat</span>
      </Link>

      <Link href="/create" className="post-button">
        ➕
        <span>Post</span>
      </Link>

      <Link href="/listings" className={isActive("/listings") ? "active" : ""}>
        🏷️
        <span>Listings</span>
      </Link>

      <Link href="/saved" className={isActive("/saved") ? "active" : ""}>
        ❤️
        <span>Saved</span>
      </Link>
    </nav>
  );
}