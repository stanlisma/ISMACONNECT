import Link from "next/link";

type SearchRecoveryLink = {
  href: string;
  label: string;
};

interface SearchRecoveryPanelProps {
  title: string;
  description: string;
  links: SearchRecoveryLink[];
}

export function SearchRecoveryPanel({
  title,
  description,
  links
}: SearchRecoveryPanelProps) {
  if (!links.length) {
    return null;
  }

  return (
    <div className="search-recovery-panel surface">
      <div className="search-recovery-copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <div className="search-recovery-links">
        {links.map((link) => (
          <Link key={`${link.href}:${link.label}`} href={link.href} className="search-recovery-link">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
