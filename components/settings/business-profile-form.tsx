"use client";

import { Building2, ImagePlus, X } from "lucide-react";
import { useState } from "react";

import { FieldHelp, FieldLabelWithHelp } from "@/components/ui/field-help";
import { BUSINESS_DAY_ORDER } from "@/lib/business-profile";
import type { BusinessHours } from "@/types/database";

interface BusinessProfileFormProps {
  action: (formData: FormData) => void | Promise<void>;
  defaults: {
    isBusiness: boolean;
    businessName: string;
    businessDescription: string;
    businessLogoUrl: string;
    businessWebsite: string;
    businessAddress: string;
    showExactBusinessLocation: boolean;
    serviceAreas: string;
    businessServices: string;
    businessHours: BusinessHours;
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
  const [logoUrl, setLogoUrl] = useState(defaults.businessLogoUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      setLogoUrl(data.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  if (!schemaReady) {
    return (
      <div className="business-profile-card surface">
        <div className="business-profile-head">
          <div className="business-profile-icon">
            <Building2 aria-hidden="true" size={18} strokeWidth={2.1} />
          </div>
          <div>
            <h2>Business profile</h2>
            <p>Run the business profile migration in Supabase to unlock storefront branding for companies and local services.</p>
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
          <h2>Business profile</h2>
          <p>Turn your seller account into a branded storefront with services, hours, contact actions, and local service areas.</p>
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
              <span>Use a business storefront</span>
              <FieldHelp
                text="Best for employers, service providers, and local businesses with multiple listings."
                label="Use a business storefront"
              />
            </strong>
          </span>
        </label>

        <input type="hidden" name="business_logo_url" value={logoUrl} />

        <div className={`business-profile-fields ${isBusiness ? "is-active" : "is-inactive"}`}>
          <div className="business-profile-grid">
            <label className="field">
              <FieldLabelWithHelp
                label="Business name"
                helpText="Use the public name customers know your business by."
              />
              <input
                className="input"
                type="text"
                name="business_name"
                defaultValue={defaults.businessName}
                placeholder="Example: North Side Property Services"
              />
            </label>

            <label className="field">
              <FieldLabelWithHelp
                label="Website"
                helpText="Add your public website if you want a direct storefront link."
              />
              <input
                className="input"
                type="text"
                name="business_website"
                defaultValue={defaults.businessWebsite}
                placeholder="ismaconnect.ca or yourcompany.ca"
              />
            </label>
          </div>

          <div className="business-profile-grid">
            <label className="field">
              <FieldLabelWithHelp
                label="Business address"
                helpText="Use your storefront or business address only. Home-based sellers should leave this blank."
              />
              <input
                className="input"
                type="text"
                name="business_address"
                defaultValue={defaults.businessAddress}
                placeholder="205 Powder Drive, Fort McMurray, AB"
              />
            </label>
          </div>

          <label className="field">
            <FieldLabelWithHelp
              label="Business description"
              helpText="Describe what your business offers, who you serve, and why locals should trust you."
            />
            <textarea
              className="textarea business-profile-textarea"
              name="business_description"
              rows={4}
              defaultValue={defaults.businessDescription}
              placeholder="Describe what your business offers, who you serve, and why locals should trust you."
            />
          </label>

          <label className="field">
            <FieldLabelWithHelp
              label="Service areas"
              helpText="List the communities or nearby areas you serve, separated with commas."
            />
            <input
              className="input"
              type="text"
              name="service_areas"
              defaultValue={defaults.serviceAreas}
              placeholder="Fort McMurray, Timberlea, Thickwood, Gregoire"
            />
          </label>

          <label className="field">
            <FieldLabelWithHelp
              label="Business services"
              helpText="Separate specialties with commas so the storefront reads more like a real local business page."
            />
            <input
              className="input"
              type="text"
              name="business_services"
              defaultValue={defaults.businessServices}
              placeholder="Cleaning, move-out services, dump runs, handyman work"
            />
          </label>

          <div className="business-hours-card">
            <div className="business-hours-head">
              <div>
                <FieldLabelWithHelp
                  label="Business hours"
                  helpText="Show weekly hours so customers know when to call or message."
                />
              </div>
              <p className="business-hours-phone-note">
                Call button uses your profile phone:
                <strong>{defaults.profilePhone || "Add a phone number in your account profile"}</strong>
              </p>
            </div>

            <div className="business-hours-list">
              {BUSINESS_DAY_ORDER.map((day) => {
                const defaultsForDay = defaults.businessHours?.[day.key];

                return (
                  <div key={day.key} className="business-hours-row">
                    <span className="business-hours-day">{day.label}</span>

                    <label className="business-hours-closed">
                      <input
                        type="checkbox"
                        name={`business_hours_${day.key}_closed`}
                        defaultChecked={Boolean(defaultsForDay?.closed)}
                      />
                      <span>Closed</span>
                    </label>

                    <input
                      className="input"
                      type="time"
                      name={`business_hours_${day.key}_open`}
                      defaultValue={defaultsForDay?.open ?? ""}
                    />

                    <span className="business-hours-separator">to</span>

                    <input
                      className="input"
                      type="time"
                      name={`business_hours_${day.key}_close`}
                      defaultValue={defaultsForDay?.close ?? ""}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <label className="business-profile-toggle">
            <input
              type="checkbox"
              name="show_exact_business_location"
              defaultChecked={defaults.showExactBusinessLocation}
            />
            <span>
              <strong className="listing-toggle-title">
                <span>Default new listings to your exact business map location</span>
                <FieldHelp
                  text="Only use this for real storefront or business addresses you want to prefill as exact map pins by default."
                  label="Default new listings to your exact business map location"
                />
              </strong>
            </span>
          </label>

          <div className="business-logo-shell">
            <div className="business-logo-copy">
              <FieldLabelWithHelp
                label="Business logo"
                helpText="Upload one square-friendly logo or badge for your storefront."
              />
            </div>

            <div className="business-logo-controls">
              <label className={`message-composer-upload ${isUploading ? "is-disabled" : ""}`}>
                <ImagePlus aria-hidden="true" size={16} strokeWidth={2.2} />
                <span>{isUploading ? "Uploading..." : "Upload logo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                />
              </label>

              {logoUrl ? (
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => setLogoUrl("")}
                >
                  <X aria-hidden="true" size={14} strokeWidth={2.3} />
                  Remove logo
                </button>
              ) : null}
            </div>

            {uploadError ? <p className="message-composer-error">{uploadError}</p> : null}

            {logoUrl ? (
              <div className="business-logo-preview">
                <img src={logoUrl} alt="Business logo preview" />
              </div>
            ) : null}
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
