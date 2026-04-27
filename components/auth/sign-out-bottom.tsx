"use client";

import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/auth/sign-out", {
      method: "POST"
    });

    router.push("/");
    router.refresh();
  }

  return (
    <button className="account-menu-item account-menu-signout" type="button" onClick={handleSignOut}>
      🚪 Sign Out
    </button>
  );
}