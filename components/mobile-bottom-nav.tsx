"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="mobile-nav">
<Link href="/browse">
  🔍
  <span>Search</span>
    </Link>

    <Link href="/messages">
      💬
      <span>Chat</span>
    </Link>

    <Link href="/dashboard/listings/new">
      ➕
      <span>Post</span>
    </Link>

    <Link href="/dashboard">
      🏷️
      <span>Listings</span>
    </Link>

    <Link href="/account" className={isActive("/account") ? "active" : ""}>
      👤
      <span>Account</span>
    </Link>
    </nav>
  );
}