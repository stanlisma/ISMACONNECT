"use client";

import { useState } from "react";

import { adminRestoreUserAction, adminSuspendUserAction } from "@/lib/actions/account";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";

interface AdminUserStatusFormProps {
  userId: string;
  isSuspended: boolean;
  disabled?: boolean;
}

export function AdminUserStatusForm({ userId, isSuspended, disabled = false }: AdminUserStatusFormProps) {
  const [showReasonField, setShowReasonField] = useState(false);

  if (disabled) {
    return <span className="badge badge-neutral">Admin account</span>;
  }

  if (isSuspended) {
    return (
      <form action={adminRestoreUserAction.bind(null, userId)}>
        <SubmitButton className="button-secondary" pendingLabel="Restoring...">
          Restore access
        </SubmitButton>
      </form>
    );
  }

  if (!showReasonField) {
    return (
      <button
        type="button"
        className="button button-ghost button-danger"
        onClick={() => setShowReasonField(true)}
      >
        Suspend user
      </button>
    );
  }

  return (
    <form action={adminSuspendUserAction.bind(null, userId)} className="action-row">
      <input
        className="input"
        type="text"
        name="reason"
        placeholder="Reason (optional)"
        style={{ maxWidth: "220px" }}
      />
      <ConfirmSubmitButton
        className="button button-ghost button-danger"
        confirmMessage="Suspend this user? They will be signed out and unable to sign in, and their listings and storefronts will be hidden until you restore access."
        pendingLabel="Suspending..."
      >
        Confirm suspend
      </ConfirmSubmitButton>
    </form>
  );
}
