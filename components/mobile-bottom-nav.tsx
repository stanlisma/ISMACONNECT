"use client";

import { List, MessageCircle, PlusCircle, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="mobile-nav">
      <Link href="/browse" className={isActive("/browse") ? "active" : ""}>
        <Search aria-hidden="true" className="mobile-nav-icon" strokeWidth={2.25} />
        <span>Search</span>
      </Link>

      <Link href="/messages" className={isActive("/messages") ? "active" : ""}>
        <MessageCircle aria-hidden="true" className="mobile-nav-icon" strokeWidth={2.25} />
        <span>Chat</span>
      </Link>

      <Link
        href="/dashboard/listings/new"
        className={`post-button ${isActive("/dashboard/listings/new") ? "active" : ""}`}
      >
        <PlusCircle aria-hidden="true" className="mobile-nav-icon" strokeWidth={2.25} />
        <span>Post</span>
      </Link>

      <Link href="/dashboard" className={isActive("/dashboard") ? "active" : ""}>
        <List aria-hidden="true" className="mobile-nav-icon" strokeWidth={2.25} />
        <span>Listings</span>
      </Link>

      <Link href="/account" className={isActive("/account") ? "active" : ""}>
        <User aria-hidden="true" className="mobile-nav-icon" strokeWidth={2.25} />
        <span>Account</span>
      </Link>
    </nav>
  );
}
