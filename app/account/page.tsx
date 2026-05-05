import {
  Bell,
  ChevronRight,
  Heart,
  ListChecks,
  Mail,
  Megaphone,
  MessageCircle,
  Search,
  ShieldCheck,
  UserCircle2
} from "lucide-react";
import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { TrustBadges } from "@/components/trust/trust-badges";
import { requireViewer } from "@/lib/auth";
import { countSavedSearchAlerts, getSavedSearchesWithStats } from "@/lib/saved-searches";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSellerTrustSummary } from "@/lib/trust";

function getInitials(name: string, email?: string) {
  const source = name.trim() || email?.trim() || "IS";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default async function AccountPage() {
  const viewer = await requireViewer();
  const supabase = await createServerSupabaseClient();

  const [
    listingsCountResult,
    favouritesCountResult,
    conversationsResult,
    notificationsResult,
    profileSettingsResult,
    savedSearches,
    trustSummary
  ] =
    await Promise.all([
      supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", viewer.user.id),
      supabase
        .from("saved_listings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", viewer.user.id),
      supabase
        .from("conversations")
        .select("buyer_id, seller_id, buyer_unread_count, seller_unread_count")
        .or(`buyer_id.eq.${viewer.user.id},seller_id.eq.${viewer.user.id}`),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", viewer.user.id)
        .eq("is_read", false),
      supabase
        .from("profiles")
        .select("email_notifications")
        .eq("id", viewer.user.id)
        .single(),
      getSavedSearchesWithStats(viewer.user.id),
      getSellerTrustSummary(viewer.user.id)
    ]);

  const conversations = (conversationsResult.data ?? []) as Array<{
    buyer_id: string;
    seller_id: string;
    buyer_unread_count: number | null;
    seller_unread_count: number | null;
  }>;

  const listingsCount = listingsCountResult.count ?? 0;
  const favouritesCount = favouritesCountResult.count ?? 0;
  const savedSearchesCount = savedSearches.length;
  const searchAlertsCount = countSavedSearchAlerts(savedSearches);
  const unreadMessagesCount = conversations.reduce((total, conversation) => {
    if (conversation.buyer_id === viewer.user.id) {
      return total + (conversation.buyer_unread_count ?? 0);
    }

    if (conversation.seller_id === viewer.user.id) {
      return total + (conversation.seller_unread_count ?? 0);
    }

    return total;
  }, 0);
  const unreadNotificationsCount = notificationsResult.count ?? 0;

  const fullName = viewer.profile.full_name || "ISMACONNECT Member";
  const email = viewer.user.email || "No email available";
  const initials = getInitials(fullName, viewer.user.email);
  const emailNotificationsEnabled = profileSettingsResult.data?.email_notifications !== false;

  return (
    <section className="section account-page">
      <div className="container account-page-container">
        <div className="account-shell">
          <div className="account-profile-card">
            <div className="account-profile-top">
              <div className="account-avatar" aria-hidden="true">
                {initials}
              </div>

              <div className="account-profile-copy">
                <span className="account-eyebrow">
                  {viewer.profile.role === "admin"
                    ? "Admin Account"
                    : viewer.profile.is_business
                      ? "Business Account"
                      : "Member Account"}
                </span>
                <h1 className="section-title">Account</h1>
                <p className="account-name">{fullName}</p>
                <p className="section-copy account-email">{email}</p>

                <div className="account-trust-summary">
                  <TrustBadges summary={trustSummary} />
                  <p className="section-copy">
                    {trustSummary?.review_count
                      ? `${trustSummary.average_rating?.toFixed(1)} average rating from ${trustSummary.review_count} reviews.`
                      : viewer.profile.stripe_identity_session_status === "processing" ||
                          viewer.profile.verification_status === "pending"
                        ? "Stripe is processing your seller verification."
                        : viewer.profile.verification_status === "verified"
                          ? "Your listings show a verified seller badge."
                          : viewer.profile.stripe_identity_session_status === "requires_input"
                            ? "Stripe needs one more verification attempt before your badge can be approved."
                            : "Start Stripe ID verification and collect ratings to build trust faster."}
                  </p>
                </div>
              </div>
            </div>

            <div className="account-stats-grid">
              <div className="account-stat-card">
                <span className="account-stat-label">My Listings</span>
                <strong>{listingsCount}</strong>
              </div>

              <div className="account-stat-card">
                <span className="account-stat-label">Favourites</span>
                <strong>{favouritesCount}</strong>
              </div>

              <div className="account-stat-card">
                <span className="account-stat-label">Unread</span>
                <strong>{unreadMessagesCount + unreadNotificationsCount + searchAlertsCount}</strong>
              </div>
            </div>
          </div>

          <div className="surface account-section-card">
            <div className="account-section-heading">
              <span className="account-section-title">My Activity</span>
            </div>

            <div className="account-menu">
              <Link href="/dashboard" className="account-menu-item">
                <span className="account-menu-icon">
                  <ListChecks aria-hidden="true" size={18} strokeWidth={2.2} />
                </span>
                <span className="account-menu-content">
                  <span className="account-menu-label">My Listings</span>
                  <span className="account-menu-description">Manage your active and past posts</span>
                </span>
                <span className="account-menu-meta">
                  <span className="account-menu-count">{listingsCount}</span>
                  <ChevronRight aria-hidden="true" size={18} strokeWidth={2.3} />
                </span>
              </Link>

              <Link href="/dashboard/saved" className="account-menu-item">
                <span className="account-menu-icon">
                  <Heart aria-hidden="true" size={18} strokeWidth={2.2} />
                </span>
                <span className="account-menu-content">
                  <span className="account-menu-label">Favourites</span>
                  <span className="account-menu-description">Return to saved listings quickly</span>
                </span>
                <span className="account-menu-meta">
                  <span className="account-menu-count">{favouritesCount}</span>
                  <ChevronRight aria-hidden="true" size={18} strokeWidth={2.3} />
                </span>
              </Link>

              <Link href="/dashboard/searches" className="account-menu-item">
                <span className="account-menu-icon">
                  <Search aria-hidden="true" size={18} strokeWidth={2.2} />
                </span>
                <span className="account-menu-content">
                  <span className="account-menu-label">Saved Searches</span>
                  <span className="account-menu-description">Track search alerts for new matching listings</span>
                </span>
                <span className="account-menu-meta">
                  {searchAlertsCount > 0 ? (
                    <span className="account-menu-badge">{searchAlertsCount}</span>
                  ) : (
                    <span className="account-menu-count">{savedSearchesCount}</span>
                  )}
                  <ChevronRight aria-hidden="true" size={18} strokeWidth={2.3} />
                </span>
              </Link>

              <Link href="/dashboard/boosts" className="account-menu-item">
                <span className="account-menu-icon">
                  <Megaphone aria-hidden="true" size={18} strokeWidth={2.2} />
                </span>
                <span className="account-menu-content">
                  <span className="account-menu-label">Boost Products</span>
                  <span className="account-menu-description">Feature important listings and run paid boosts</span>
                </span>
                <span className="account-menu-meta">
                  <ChevronRight aria-hidden="true" size={18} strokeWidth={2.3} />
                </span>
              </Link>

              <Link href="/messages" className="account-menu-item">
                <span className="account-menu-icon">
                  <MessageCircle aria-hidden="true" size={18} strokeWidth={2.2} />
                </span>
                <span className="account-menu-content">
                  <span className="account-menu-label">Messages</span>
                  <span className="account-menu-description">Chat with buyers, renters, and sellers</span>
                </span>
                <span className="account-menu-meta">
                  {unreadMessagesCount > 0 ? (
                    <span className="account-menu-badge">{unreadMessagesCount}</span>
                  ) : null}
                  <ChevronRight aria-hidden="true" size={18} strokeWidth={2.3} />
                </span>
              </Link>

              <Link href="/notifications" className="account-menu-item">
                <span className="account-menu-icon">
                  <Bell aria-hidden="true" size={18} strokeWidth={2.2} />
                </span>
                <span className="account-menu-content">
                  <span className="account-menu-label">Notifications</span>
                  <span className="account-menu-description">Review updates and activity alerts</span>
                </span>
                <span className="account-menu-meta">
                  {unreadNotificationsCount > 0 ? (
                    <span className="account-menu-badge">{unreadNotificationsCount}</span>
                  ) : null}
                  <ChevronRight aria-hidden="true" size={18} strokeWidth={2.3} />
                </span>
              </Link>
            </div>
          </div>

          <div className="surface account-section-card">
            <div className="account-section-heading">
              <span className="account-section-title">Preferences</span>
            </div>

            <div className="account-menu">
              <Link href="/settings" className="account-menu-item">
                <span className="account-menu-icon">
                  <Mail aria-hidden="true" size={18} strokeWidth={2.2} />
                </span>
                <span className="account-menu-content">
                  <span className="account-menu-label">Email Notifications</span>
                  <span className="account-menu-description">
                    {emailNotificationsEnabled ? "Enabled for new replies and updates" : "Currently paused"}
                  </span>
                </span>
                <span className="account-menu-meta">
                  <span
                    className={`account-menu-pill ${
                      emailNotificationsEnabled ? "is-success" : "is-muted"
                    }`}
                  >
                    {emailNotificationsEnabled ? "On" : "Off"}
                  </span>
                  <ChevronRight aria-hidden="true" size={18} strokeWidth={2.3} />
                </span>
              </Link>

              <Link href="/settings" className="account-menu-item">
                <span className="account-menu-icon">
                  <ShieldCheck aria-hidden="true" size={18} strokeWidth={2.2} />
                </span>
                <span className="account-menu-content">
                  <span className="account-menu-label">Trust & Settings</span>
                  <span className="account-menu-description">Manage verification, badges, and account controls</span>
                </span>
                <span className="account-menu-meta">
                  <ChevronRight aria-hidden="true" size={18} strokeWidth={2.3} />
                </span>
              </Link>
            </div>
          </div>

          <div className="account-signout-card">
            <div className="account-signout-copy">
              <span className="account-menu-icon account-menu-icon-danger">
                <UserCircle2 aria-hidden="true" size={18} strokeWidth={2.2} />
              </span>
              <div>
                <strong>Signed in on this device</strong>
                <p className="section-copy">Use sign out when you are finished using your account.</p>
              </div>
            </div>

            <SignOutButton className="account-signout-button">
              Sign Out
            </SignOutButton>
          </div>
        </div>
      </div>
    </section>
  );
}
