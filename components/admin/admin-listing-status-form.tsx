"use client";

import { useState } from "react";

import { adminSetListingStatusAction } from "@/lib/actions/listings";
import { LISTING_STATUS_LABELS } from "@/lib/constants";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

const ADMIN_SETTABLE_STATUSES = ["active", "paused", "flagged", "removed"] as const;

interface AdminListingStatusFormProps {
  listingId: string;
  currentStatus: string;
}

function statusLabel(status: string) {
  return LISTING_STATUS_LABELS[status as keyof typeof LISTING_STATUS_LABELS] ?? status;
}

export function AdminListingStatusForm({ listingId, currentStatus }: AdminListingStatusFormProps) {
  const isSettable = ADMIN_SETTABLE_STATUSES.includes(
    currentStatus as (typeof ADMIN_SETTABLE_STATUSES)[number]
  );
  // When the listing's real status isn't one an admin can pick directly (e.g.
  // "deactivated", set automatically because the owner is suspended/deactivated),
  // start with no selection instead of silently defaulting to "active" - forces
  // the admin to make an explicit choice rather than accidentally republishing it.
  const [status, setStatus] = useState(isSettable ? currentStatus : "");

  return (
    <form action={adminSetListingStatusAction.bind(null, listingId)} className="action-row">
      <select
        className="input"
        name="status"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        style={{ maxWidth: "160px" }}
      >
        {!isSettable ? (
          <option value="" disabled>
            {statusLabel(currentStatus)} (choose a status)
          </option>
        ) : null}
        {ADMIN_SETTABLE_STATUSES.map((value) => (
          <option key={value} value={value}>
            {LISTING_STATUS_LABELS[value]}
          </option>
        ))}
      </select>

      <ConfirmSubmitButton
        className="button-secondary"
        disabled={!status}
        confirmMessage={
          !isSettable
            ? `This listing's current status is "${statusLabel(
                currentStatus
              )}" (its owner may be suspended or deactivated). Set it to "${statusLabel(status)}" anyway?`
            : `Set this listing's status to "${statusLabel(status)}"?`
        }
        pendingLabel="Saving..."
      >
        Update status
      </ConfirmSubmitButton>
    </form>
  );
}
