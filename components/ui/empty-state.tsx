import Link from "next/link";

interface EmptyStateProps {
  eyebrow?: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  secondaryActionHref?: string;
  secondaryActionLabel?: string;
  tips?: string[];
}

export function EmptyState({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
  secondaryActionHref,
  secondaryActionLabel,
  tips
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h3>{title}</h3>
      <p>{description}</p>
      {tips?.length ? (
        <ul className="empty-state-tip-list">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      ) : null}
      {actionHref && actionLabel ? (
        <div className="empty-state-actions">
          <Link className="button button-secondary" href={actionHref}>
            {actionLabel}
          </Link>
          {secondaryActionHref && secondaryActionLabel ? (
            <Link className="button button-ghost" href={secondaryActionHref}>
              {secondaryActionLabel}
            </Link>
          ) : null}
        </div>
      ) : secondaryActionHref && secondaryActionLabel ? (
        <div className="empty-state-actions">
          <Link className="button button-ghost" href={secondaryActionHref}>
            {secondaryActionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
