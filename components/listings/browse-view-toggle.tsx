"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";

type BrowseViewToggleOption = {
  href: string;
  label: string;
  active: boolean;
};

export function BrowseViewToggle({
  className,
  options
}: {
  className?: string;
  options: BrowseViewToggleOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hrefKey = useMemo(() => options.map((option) => option.href).join("|"), [options]);

  useEffect(() => {
    options.forEach((option) => router.prefetch(option.href));
  }, [hrefKey, options, router]);

  return (
    <div className={className} aria-busy={isPending}>
      {options.map((option) => (
        <button
          key={option.href}
          type="button"
          className={`listing-view-pill listing-view-pill-button${option.active ? " is-active" : ""}${
            isPending && !option.active ? " is-pending" : ""
          }`}
          aria-pressed={option.active}
          onClick={() => {
            if (option.active) {
              return;
            }

            startTransition(() => {
              router.replace(option.href, { scroll: false });
            });
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
