"use client";

import { ChevronLeft, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function getSafeBackTo(value: string | null) {
  if (!value || !value.startsWith("/")) {
    return "/browse?view=list";
  }

  return value;
}

export function LegalPageControls() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const backTo = getSafeBackTo(searchParams.get("backTo"));

  return (
    <div className="legal-sheet-controls">
      <button
        type="button"
        className="legal-sheet-close"
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
            return;
          }

          router.push(backTo);
        }}
      >
        <X aria-hidden="true" size={16} strokeWidth={2.5} />
        <span>Close</span>
      </button>

      <Link href={backTo} className="legal-sheet-link">
        <ChevronLeft aria-hidden="true" size={16} strokeWidth={2.5} />
        <span>Marketplace</span>
      </Link>
    </div>
  );
}
