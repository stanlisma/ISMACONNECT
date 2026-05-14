"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

import { FieldLabelWithHelp } from "@/components/ui/field-help";

type StorefrontLogoFieldProps = {
  defaultValue?: string | null;
  name?: string;
};

export function StorefrontLogoField({
  defaultValue = "",
  name = "logo_url"
}: StorefrontLogoFieldProps) {
  const [logoUrl, setLogoUrl] = useState(defaultValue ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    setLogoUrl(defaultValue ?? "");
  }, [defaultValue]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "storefronts");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Logo upload failed.");
      }

      setLogoUrl(data.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Logo upload failed.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="field storefront-logo-field">
      <FieldLabelWithHelp
        label="Storefront logo"
        helpText="Upload a logo for this storefront, or paste a public logo image URL."
      />

      <div className="business-logo-shell storefront-logo-shell">
        <div className="business-logo-controls storefront-logo-controls">
          <input
            className="input"
            type="text"
            name={name}
            value={logoUrl}
            onChange={(event) => setLogoUrl(event.target.value)}
            placeholder="https://..."
          />

          <label className={`message-composer-upload storefront-logo-upload${isUploading ? " is-disabled" : ""}`}>
            <ImagePlus aria-hidden="true" size={16} strokeWidth={2.2} />
            <span>{isUploading ? "Uploading logo..." : "Upload logo"}</span>
            <input type="file" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
          </label>

          {logoUrl ? (
            <button
              type="button"
              className="button button-ghost storefront-logo-clear"
              onClick={() => {
                setLogoUrl("");
                setUploadError("");
              }}
            >
              <X aria-hidden="true" size={14} strokeWidth={2.3} />
              <span>Remove</span>
            </button>
          ) : null}
        </div>

        {uploadError ? <p className="message-composer-error storefront-logo-error">{uploadError}</p> : null}

        {logoUrl ? (
          <div className="storefront-logo-preview-row">
            <div className="business-logo-preview storefront-logo-preview">
              <img src={logoUrl} alt="Storefront logo preview" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
