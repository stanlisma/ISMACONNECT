"use client";

import { ImagePlus, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

import { FieldLabelWithHelp } from "@/components/ui/field-help";
import { MAX_STOREFRONT_IMAGE_COUNT } from "@/lib/business-storefronts";

type StorefrontGalleryFieldProps = {
  defaultValue?: string[] | null;
  name?: string;
};

function sanitizeImageUrls(urls: string[] | null | undefined) {
  if (!Array.isArray(urls)) {
    return [] as string[];
  }

  return Array.from(new Set(urls.map((item) => item.trim()).filter(Boolean))).slice(
    0,
    MAX_STOREFRONT_IMAGE_COUNT
  );
}

export function StorefrontGalleryField({
  defaultValue = [],
  name = "image_urls"
}: StorefrontGalleryFieldProps) {
  const [imageUrls, setImageUrls] = useState<string[]>(sanitizeImageUrls(defaultValue));
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    setImageUrls(sanitizeImageUrls(defaultValue));
  }, [defaultValue]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (!files.length) {
      return;
    }

    const availableSlots = Math.max(0, MAX_STOREFRONT_IMAGE_COUNT - imageUrls.length);

    if (!availableSlots) {
      setUploadError(`You can upload up to ${MAX_STOREFRONT_IMAGE_COUNT} business images.`);
      event.target.value = "";
      return;
    }

    const selectedFiles = files.slice(0, availableSlots);
    if (selectedFiles.length < files.length) {
      setUploadError(`Only the first ${availableSlots} additional image(s) were added.`);
    } else {
      setUploadError("");
    }

    setIsUploading(true);

    for (const file of selectedFiles) {
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
          throw new Error(data.error || "Business image upload failed.");
        }

        setImageUrls((current) =>
          sanitizeImageUrls([...current, String(data.url ?? "")])
        );
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Business image upload failed.");
      }
    }

    setIsUploading(false);
    event.target.value = "";
  }

  function removeImage(urlToRemove: string) {
    setImageUrls((current) => current.filter((url) => url !== urlToRemove));
    setUploadError("");
  }

  function makePrimary(urlToPromote: string) {
    setImageUrls((current) => {
      const next = current.filter((url) => url !== urlToPromote);
      return [urlToPromote, ...next];
    });
  }

  return (
    <div className="field storefront-gallery-field">
      <FieldLabelWithHelp
        label="Business images"
        helpText="Upload photos of your storefront, workspace, vehicles, team, or finished results. The first image appears first on your public storefront."
      />

      {imageUrls.map((url) => (
        <input key={url} type="hidden" name={name} value={url} />
      ))}

      <div className="listing-upload-dropzone storefront-gallery-upload-dropzone">
        <div className="listing-upload-dropzone-icon">
          <ImagePlus aria-hidden="true" size={22} strokeWidth={2.1} />
        </div>

        <div className="listing-upload-dropzone-copy">
          <strong>Add business photos</strong>
          <span>
            Upload up to {MAX_STOREFRONT_IMAGE_COUNT} images. Use the first image as your main storefront photo.
          </span>
        </div>

        <label className={`message-composer-upload${isUploading ? " is-disabled" : ""}`}>
          <span>{isUploading ? "Uploading..." : "Upload images"}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </div>

      {uploadError ? <p className="listing-upload-error storefront-gallery-error">{uploadError}</p> : null}

      {imageUrls.length ? (
        <div className="storefront-gallery-manager-grid">
          {imageUrls.map((url, index) => (
            <div key={url} className="storefront-gallery-manager-card">
              <div className="storefront-gallery-manager-frame">
                <img
                  src={url}
                  alt={index === 0 ? "Primary storefront photo" : `Storefront photo ${index + 1}`}
                />
              </div>

              <div className="storefront-gallery-manager-meta">
                <span>{index === 0 ? "Primary storefront photo" : `Photo ${index + 1}`}</span>
              </div>

              <div className="storefront-gallery-manager-actions">
                {index > 0 ? (
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() => makePrimary(url)}
                  >
                    <Star aria-hidden="true" size={14} strokeWidth={2.2} />
                    <span>Make first</span>
                  </button>
                ) : (
                  <span className="storefront-gallery-primary-pill">
                    <Star aria-hidden="true" size={13} strokeWidth={2.2} />
                    <span>Primary</span>
                  </span>
                )}

                <button
                  type="button"
                  className="button button-ghost storefront-gallery-remove"
                  onClick={() => removeImage(url)}
                >
                  <Trash2 aria-hidden="true" size={14} strokeWidth={2.2} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
