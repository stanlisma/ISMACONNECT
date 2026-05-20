"use client";

import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";

import { FieldHelp } from "@/components/ui/field-help";

interface BusinessProfileFormProps {
  action: (formData: FormData) => void | Promise<void>;
  defaults: {
    isBusiness: boolean;
    profilePhone: string;
  };
  schemaReady: boolean;
  returnPath?: string;
  compact?: boolean;
}

export function BusinessProfileForm({
  action,
  defaults,
  schemaReady,
  returnPath = "/settings",
  compact = false
}: BusinessProfileFormProps) {
  const [isBusiness, setIsBusiness] = useState(defaults.isBusiness);

  useEffect(() => {
    setIsBusiness(defaults.isBusiness);
  }, [defaults.isBusiness]);

  if (!schemaReady) {
    return (
      <div className="business-profile-card surface">
        <div className="business-profile-head">
          <div className="business-profile-icon">
            <Building2 aria-hidden="true" size={18} strokeWidth={2.1} />
          </div>
          <div>
            <h2>Business account</h2>
            <p>Run the business profile migration in Supabase to unlock multi-storefront business accounts.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`business-profile-card surface${compact ? " is-compact" : ""}`}>
      <div className="business-profile-head">
        <div className="business-profile-icon">
          <Building2 aria-hidden="true" size={18} strokeWidth={2.1} />
        </div>
        <div className="business-profile-head-copy">
          <div className="business-profile-title-row">
            <h2>{compact ? "Business mode" : "Business account"}</h2>
            <FieldHelp
              label={compact ? "Business mode" : "Business account"}
              text="Turn on business mode for this account, then create separate storefronts for each brand, location, or service line."
            />
          </div>
        </div>
      </div>

      <form action={action} className="business-profile-form">
        <input type="hidden" name="return_path" value={returnPath} />
        <input type="hidden" name="is_business_value" value={isBusiness ? "true" : "false"} />

        <label className="business-profile-toggle">
          <input
            id="business-storefront-toggle"
            type="checkbox"
            checked={isBusiness}
            onChange={(event) => setIsBusiness(event.target.checked)}
          />
          <span>
            <strong className="listing-toggle-title">
              <span>Enable business storefronts on this account</span>
              <FieldHelp
                text="Use this if you want the account to manage one or more storefronts instead of posting only as a personal seller."
                label="Enable business storefronts on this account"
              />
            </strong>
          </span>
        </label>

        {compact ? (
          <div className={`business-profile-inline-note ${isBusiness ? "is-active" : "is-inactive"}`}>
            <strong>Account phone:</strong>{" "}
            <span>{defaults.profilePhone || "Add a phone number in your account profile"}</span>
          </div>
        ) : (
          <div className={`business-profile-fields ${isBusiness ? "is-active" : "is-inactive"}`}>
            <div className="business-hours-card">
              <div className="business-hours-head">
                <div className="business-profile-title-row">
                  <strong className="listing-toggle-title">Account phone</strong>
                  <FieldHelp
                    label="Account phone"
                    text="Your account stays personal. Storefront details like branding, address, hours, services, and map settings live inside each storefront you create below. Add a storefront phone there when that storefront should have its own public number."
                  />
                </div>
                <p className="business-hours-phone-note">
                  <strong>{defaults.profilePhone || "Add a phone number in your account profile"}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="business-profile-actions">
          <button className="button" type="submit">
            {compact ? "Save" : "Save business profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
