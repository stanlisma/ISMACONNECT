"use client";

import { useState } from "react";

import { adminSetListingStatusAction } from "@/lib/actions/listings";
import { LISTING_STATUS_LABELS } from "@/lib/constants";
import { SubmitButton } from "@/components/ui/submit-button";

const ADMIN_SETTABLE_STATUSES = ["active", "paused", "flagged", "removed"] as const;

interface AdminListingStatusFormProps {
  listingId: string;
  currentStatus: string;
}

export function AdminListingStatusForm({ listingId, currentStatus }: AdminListingStatusFormProps) {
  const [status, setStatus] = useState(
    ADMIN_SETTABLE_STATUSES.includes(currentStatus as (typeof ADMIN_SETTABLE_STATUSES)[number])
      ? currentStatus
      : "active"
  );

  return (
    <form action={adminSetListingStatusAction.bind(null, listingId)} className="action-row">
      <select
        className="input"
        name="status"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        style={{ maxWidth: "160px" }}
      >
        {ADMIN_SETTABLE_STATUSES.map((value) => (
          <option key={value} value={value}>
            {LISTING_STATUS_LABELS[value]}
          </option>
        ))}
      </select>

      <SubmitButton className="button-secondary" pendingLabel="Saving...">
        Update status
      </SubmitButton>
    </form>
  );
}
