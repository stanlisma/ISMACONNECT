import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireViewer } from "@/lib/auth";

export default async function AccountPage() {
  const viewer = await requireViewer();

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "720px" }}>
        <div className="surface">
          <h1 className="section-title">Account</h1>
          <p className="section-copy">
            Welcome, {viewer.profile.full_name || viewer.user.email}
          </p>

          <div className="account-menu">
            <Link href="/dashboard" className="account-menu-item">
              🏷️ My Listings
            </Link>

            <Link href="/dashboard/saved" className="account-menu-item">
              Favourites
            </Link>

            <Link href="/messages" className="account-menu-item">
              💬 Messages
            </Link>

            <Link href="/settings" className="account-menu-item">
              ✉️ Email Notifications
            </Link>

            <SignOutButton />
          </div>
        </div>
      </div>
    </section>
  );
}
