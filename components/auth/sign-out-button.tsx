"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

export function SignOutButton({
  className,
  children
}: {
  className?: string;
  children?: ReactNode;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/auth/sign-out", {
      method: "POST"
    });

    router.push("/");
    router.refresh();
  }

  return (
    <button
      className={className ?? "account-menu-item account-menu-signout"}
      type="button"
      onClick={handleSignOut}
    >
      {children ?? "Sign Out"}
    </button>
  );
}
