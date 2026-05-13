"use client";

import { Building2 } from "lucide-react";
import { useState } from "react";

import { FieldHelp } from "@/components/ui/field-help";

interface BusinessProfileFormProps {
  action: (formData: FormData) => void | Promise<void>;
  defaults: {
    isBusiness: boolean;
    profilePhone: string;
  };
  schemaReady: boolean;
}

export function BusinessProfileForm({
  action,
  defaults,
  schemaReady
}: BusinessProfileFormProps) {
  const [isBusiness, setIsBusiness] = useState(defaults.isBusiness);

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
    <div className="business-profile-card surface">
      <div className="business-profile-head">
        <div className="business-profile-icon">
          <Building2 aria-hidden="true" size={18} strokeWidth={2.1} />
        </div>
        <div>
          <h2>Business account</h2>
          <p>Turn on business mode for this account, then create separate storefronts for each brand, location, or service line.</p>
        </div>
      </div>

      <form action={action} className="business-profile-form">
        <label className="business-profile-toggle">
          <input
            type="checkbox"
            name="is_business"
            defaultChecked={defaults.isBusiness}
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

        <div className={`business-profile-fields ${isBusiness ? "is-active" : "is-inactive"}`}>
          <div className="business-hours-card">
            <div className="business-hours-head">
              <div>
                <strong className="listing-toggle-title">How it works</strong>
                <p className="section-copy">
                  Your account stays personal. Business details, branding, address, hours, services, and map settings now live inside each storefront you create below.
                </p>
              </div>
              <p className="business-hours-phone-note">
                Account phone:
                <strong>{defaults.profilePhone || "Add a phone number in your account profile"}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="business-profile-actions">
          <button className="button" type="submit">
            Save business profile
          </button>
        </div>
      </form>
    </div>
  );
}
