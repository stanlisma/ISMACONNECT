"use client";

import { useState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { deleteAccountAction } from "@/lib/actions/account";

export function DeleteAccountForm() {
  const [confirmation, setConfirmation] = useState("");
  const isConfirmed = confirmation.trim().toUpperCase() === "DELETE";

  return (
    <form action={deleteAccountAction} className="settings-block-stack">
      <label className="field">
        <span className="field-label">Type DELETE to confirm</span>
        <input
          className="input"
          type="text"
          name="confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder="DELETE"
          autoComplete="off"
        />
      </label>

      <SubmitButton
        className="button-danger button-secondary"
        pendingLabel="Deleting account..."
        disabled={!isConfirmed}
      >
        Delete my account
      </SubmitButton>
    </form>
  );
}
