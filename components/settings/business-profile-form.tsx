"use client";

import { Building2, ImagePlus, X } from "lucide-react";
import { useState } from "react";

interface BusinessProfileFormProps {
  action: (formData: FormData) => void | Promise<void>;
  defaults: {
    isBusiness: boolean;
    businessName: string;
    businessDescription: string;
    businessLogoUrl: string;
    businessWebsite: string;
    serviceAreas: string;
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
          <p>Turn your seller account into a branded storefront with a business name, logo, website, and local service areas.</p>
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
            <strong>Use a business storefront</strong>
            <small>Best for employers, service providers, and local businesses with multiple listings.</small>
          </span>
        </label>

        <input type="hidden" name="business_logo_url" value={logoUrl} />

        <div className={`business-profile-fields ${isBusiness ? "is-active" : "is-inactive"}`}>
          <div className="business-profile-grid">
            <label className="field">
              <span className="field-label">Business name</span>
              <input
                className="input"
                type="text"
                name="business_name"
                defaultValue={defaults.businessName}
                placeholder="Example: North Side Property Services"
              />
            </label>

            <label className="field">
              <span className="field-label">Website</span>
              <input
                className="input"
                type="text"
                name="business_website"
                defaultValue={defaults.businessWebsite}
                placeholder="ismaconnect.ca or yourcompany.ca"
              />
            </label>
          </div>

          <label className="field">
            <span className="field-label">Business description</span>
            <textarea
              className="textarea business-profile-textarea"
              name="business_description"
              rows={4}
              defaultValue={defaults.businessDescription}
              placeholder="Describe what your business offers, who you serve, and why locals should trust you."
            />
          </label>

          <label className="field">
            <span className="field-label">Service areas</span>
            <input
              className="input"
              type="text"
              name="service_areas"
              defaultValue={defaults.serviceAreas}
              placeholder="Fort McMurray, Timberlea, Thickwood, Gregoire"
            />
          </label>

          <div className="business-logo-shell">
            <div className="business-logo-copy">
              <span className="field-label">Business logo</span>
              <p>Upload one square-friendly logo or badge for your storefront.</p>
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
