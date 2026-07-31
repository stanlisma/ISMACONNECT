import Link from "next/link";

interface FoundingMemberBannerProps {
  count: number;
  cap: number;
}

export function FoundingMemberBanner({ count, cap }: FoundingMemberBannerProps) {
  // Capacity-boxed program - once full, the scarcity hook no longer applies,
  // so just stop showing the banner rather than displaying a "0 left" dud.
  if (count <= 0 || count >= cap) {
    return null;
  }

  return (
    <section className="founding-member-banner">
      <div className="founding-member-banner-copy">
        <span className="badge badge-soft founding-member-banner-badge">Founding Business Member Program</span>
        <p>
          <strong>
            {count} of {cap}
          </strong>{" "}
          founding spots claimed — be one of the first Fort McMurray businesses on ISMACONNECT.
        </p>
      </div>
      <Link href="/businesses" className="button button-secondary founding-member-banner-cta">
        See founding members
      </Link>
    </section>
  );
}
