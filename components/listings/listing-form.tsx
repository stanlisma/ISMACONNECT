"use client";

import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  LoaderCircle,
  Sparkles,
  Star,
  Trash2,
  UploadCloud
} from "lucide-react";
import { useMemo, useState } from "react";

import { getStructuredFieldDefinitions } from "@/lib/listing-structured-fields";
import { getSubcategories } from "@/lib/subcategories";
import type { ListingStructuredData } from "@/types/database";

type ListingFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: {
    category?: string;
    subcategory?: string;
    title?: string;
    price?: string;
    location?: string;
    description?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    imageUrl?: string;
    imageUrls?: string[];
    structuredData?: ListingStructuredData | null;
  };
  submitLabel?: string;
};

type UploadStatus = "compressing" | "uploading" | "done" | "error";

type UploadItem = {
  id: string;
  name: string;
  details: string;
  status: UploadStatus;
};

const MAX_IMAGE_COUNT = 8;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1800;
const WEBP_QUALITY = 0.82;

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function updateUploadItem(
  setUploadItems: React.Dispatch<React.SetStateAction<UploadItem[]>>,
  id: string,
  updater: (item: UploadItem) => UploadItem
) {
  setUploadItems((current) => current.map((item) => (item.id === id ? updater(item) : item)));
}

async function loadImageFromFile(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read this image."));
      img.src = objectUrl;
    });

    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function optimizeImage(file: File) {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const image = await loadImageFromFile(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare this image for upload.");
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
  });

  if (!blob) {
    throw new Error("Could not compress this image.");
  }

  if (blob.size >= file.size && file.size <= MAX_UPLOAD_BYTES) {
    return file;
  }

  const optimizedName = file.name.replace(/\.[a-z0-9]+$/i, "") || "listing-photo";

  return new File([blob], `${optimizedName}.webp`, {
    type: "image/webp",
    lastModified: Date.now()
  });
}

export function ListingForm({
  action,
  defaults,
  submitLabel = "Publish listing"
}: ListingFormProps) {
  const [category, setCategory] = useState(defaults?.category ?? "buy-sell");
  const [subcategory, setSubcategory] = useState(defaults?.subcategory ?? "");
  const [description, setDescription] = useState(defaults?.description ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(
    defaults?.imageUrls?.length
      ? defaults.imageUrls
      : defaults?.imageUrl
        ? [defaults.imageUrl]
        : []
  );
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const subcategories = useMemo(() => getSubcategories(category), [category]);
  const structuredFields = useMemo(() => getStructuredFieldDefinitions(category as any), [category]);
  const structuredDefaults = defaults?.structuredData ?? null;
  const descriptionReady = description.trim().length >= 10;
  const stickyHint = isUploading
    ? "Uploading photos..."
    : `${imageUrls.length}/${MAX_IMAGE_COUNT} photos | ${description.length}/3000 chars`;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    setUploadError("");

    const availableSlots = Math.max(0, MAX_IMAGE_COUNT - imageUrls.length);
    const selectedFiles = Array.from(files).slice(0, availableSlots);

    if (!availableSlots) {
      setUploadError(`You can upload up to ${MAX_IMAGE_COUNT} photos per listing.`);
      event.target.value = "";
      return;
    }

    if (selectedFiles.length < files.length) {
      setUploadError(`Only the first ${availableSlots} additional photo(s) were added.`);
    }

    const queuedItems = selectedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      name: file.name,
      details: `${formatFileSize(file.size)} | preparing`,
      status: "compressing" as const
    }));

    setUploadItems((current) => [...queuedItems, ...current].slice(0, 12));
    setIsUploading(true);

    for (let index = 0; index < selectedFiles.length; index += 1) {
      const originalFile = selectedFiles[index];
      const queueItem = queuedItems[index];

      try {
        updateUploadItem(setUploadItems, queueItem.id, (item) => ({
          ...item,
          status: "compressing",
          details: `${formatFileSize(originalFile.size)} | compressing`
        }));

        const optimizedFile = await optimizeImage(originalFile);

        if (optimizedFile.size > MAX_UPLOAD_BYTES) {
          throw new Error("Image is still larger than 5MB after optimization.");
        }

        updateUploadItem(setUploadItems, queueItem.id, (item) => ({
          ...item,
          status: "uploading",
          details: `${formatFileSize(optimizedFile.size)} | uploading`
        }));

        const formData = new FormData();
        formData.append("file", optimizedFile);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Upload failed.");
        }

        setImageUrls((current) => [...current, data.url].slice(0, MAX_IMAGE_COUNT));

        updateUploadItem(setUploadItems, queueItem.id, (item) => ({
          ...item,
          status: "done",
          details:
            optimizedFile === originalFile
              ? `${formatFileSize(optimizedFile.size)} | uploaded`
              : `${formatFileSize(originalFile.size)} -> ${formatFileSize(optimizedFile.size)}`
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed.";
        setUploadError(message);

        updateUploadItem(setUploadItems, queueItem.id, (item) => ({
          ...item,
          status: "error",
          details: message
        }));
      }
    }

    setIsUploading(false);
    event.target.value = "";
  }

  function removeImage(indexToRemove: number) {
    setImageUrls((current) => current.filter((_, index) => index !== indexToRemove));
  }

  function setCoverImage(index: number) {
    setImageUrls((current) => moveItem(current, index, 0));
  }

  function moveImage(index: number, direction: "left" | "right") {
    setImageUrls((current) =>
      moveItem(current, index, direction === "left" ? index - 1 : index + 1)
    );
  }

  return (
    <form action={action} className="form-grid listing-editor-form">
      <div className="field-full listing-form-mobile-summary surface">
        <div className="listing-form-mobile-summary-copy">
          <span className="eyebrow">Mobile-friendly flow</span>
          <h2>Post faster on your phone</h2>
          <p>Work from top to bottom: basics, details, contact, then photos.</p>
        </div>

        <div className="listing-form-progress-pills">
          <span className="listing-form-progress-pill">Basics</span>
          <span className="listing-form-progress-pill">Details</span>
          <span className="listing-form-progress-pill">Contact</span>
          <span className="listing-form-progress-pill">Photos</span>
        </div>
      </div>

      <section className="field-full listing-form-section">
        <div className="listing-form-section-head">
          <div>
            <span className="field-label">Basics</span>
            <p className="field-hint">Start with the core facts people scan first.</p>
          </div>
        </div>

        <div className="listing-form-section-grid">
          <label className="field">
            <span className="field-label">Category</span>
            <select
              className="input"
              name="category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setSubcategory("");
              }}
              required
            >
              <option value="rentals">Rentals</option>
              <option value="ride-share">Ride Share</option>
              <option value="jobs">Jobs</option>
              <option value="services">Services</option>
              <option value="buy-sell">Buy &amp; Sell</option>
            </select>
          </label>

          <label className="field">
            <span className="field-label">Sub-category</span>
            <select
              className="input"
              name="subcategory"
              value={subcategory}
              onChange={(event) => setSubcategory(event.target.value)}
            >
              <option value="">Select a sub-category</option>
              {subcategories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field listing-form-title-field">
            <span className="field-label">Title</span>
            <input className="input" name="title" defaultValue={defaults?.title ?? ""} required />
          </label>

          <label className="field">
            <span className="field-label">Price</span>
            <input className="input" name="price" defaultValue={defaults?.price ?? ""} />
          </label>

          <label className="field">
            <span className="field-label">Location</span>
            <input className="input" name="location" defaultValue={defaults?.location ?? ""} />
          </label>
        </div>
      </section>

      <section className="field-full listing-form-section">
        <div className="listing-form-section-head">
          <div>
            <span className="field-label">Description</span>
            <p className="field-hint">A little detail helps buyers trust the listing quickly.</p>
          </div>
        </div>

        <label className="field field-full">
          <textarea
            className="input listing-description-input"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={6}
            required
          />

          <div className="listing-description-hint">
            <span>Minimum 10 characters</span>
            <span>{description.length}/3000</span>
          </div>
        </label>
      </section>

      {structuredFields.length ? (
        <section className="field-full listing-form-section">
          <div className="listing-structured-panel" key={category}>
            <div className="listing-structured-panel-head">
              <div>
                <span className="field-label">Category details</span>
                <p className="field-hint">
                  A few local details make your listing easier to trust and much easier to filter.
                </p>
              </div>
            </div>

            <div className="listing-structured-grid">
              {structuredFields.map((field) => {
                const fieldValue =
                  structuredDefaults && typeof structuredDefaults === "object"
                    ? structuredDefaults[field.name as keyof typeof structuredDefaults]
                    : undefined;

                if (field.kind === "checkbox") {
                  return (
                    <label key={field.name} className="listing-structured-checkbox">
                      <input
                        type="checkbox"
                        name={field.name}
                        defaultChecked={Boolean(fieldValue)}
                      />
                      <span className="listing-structured-checkbox-copy">
                        <strong>{field.label}</strong>
                        {field.helpText ? <span>{field.helpText}</span> : null}
                      </span>
                    </label>
                  );
                }

                if (field.kind === "number") {
                  return (
                    <label key={field.name} className="field">
                      <span className="field-label">{field.label}</span>
                      <input
                        className="input"
                        type="number"
                        min={1}
                        max={8}
                        name={field.name}
                        defaultValue={typeof fieldValue === "number" ? String(fieldValue) : ""}
                        placeholder="Enter a number"
                      />
                      {field.helpText ? <span className="field-hint">{field.helpText}</span> : null}
                    </label>
                  );
                }

                return (
                  <label key={field.name} className="field">
                    <span className="field-label">{field.label}</span>
                    <select
                      className="input"
                      name={field.name}
                      defaultValue={typeof fieldValue === "string" ? fieldValue : ""}
                    >
                      <option value="">Select an option</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {field.helpText ? <span className="field-hint">{field.helpText}</span> : null}
                  </label>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="field-full listing-form-section">
        <div className="listing-form-section-head">
          <div>
            <span className="field-label">Contact</span>
            <p className="field-hint">Use the contact details you want replies to go to.</p>
          </div>
        </div>

        <div className="listing-form-section-grid">
          <label className="field">
            <span className="field-label">Contact name</span>
            <input
              className="input"
              name="contactName"
              defaultValue={defaults?.contactName ?? ""}
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Contact email</span>
            <input
              className="input"
              name="contactEmail"
              type="email"
              defaultValue={defaults?.contactEmail ?? ""}
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Contact phone</span>
            <input className="input" name="contactPhone" defaultValue={defaults?.contactPhone ?? ""} />
          </label>
        </div>
      </section>

      <section className="field-full listing-form-section">
        <div className="listing-media-panel">
          <div className="listing-media-panel-head">
            <div>
              <span className="field-label">Listing photos</span>
              <p className="field-hint listing-media-panel-copy">
                Upload up to {MAX_IMAGE_COUNT} images. We optimize them before upload so feeds load faster.
              </p>
            </div>

            <div className="listing-media-panel-meta">
              <span>{imageUrls.length}/{MAX_IMAGE_COUNT} photos</span>
              <span>First image becomes the cover</span>
            </div>
          </div>

          <label className="listing-upload-dropzone">
            <div className="listing-upload-dropzone-icon">
              {isUploading ? (
                <LoaderCircle aria-hidden="true" size={20} strokeWidth={2.3} className="listing-spin" />
              ) : (
                <UploadCloud aria-hidden="true" size={20} strokeWidth={2.3} />
              )}
            </div>
            <div className="listing-upload-dropzone-copy">
              <strong>{isUploading ? "Uploading your photos..." : "Add listing photos"}</strong>
              <span>JPG, PNG, or WebP. We compress them automatically and keep the sharpest cover photo first.</span>
            </div>
            <span className="listing-upload-dropzone-action">
              <ImagePlus aria-hidden="true" size={16} strokeWidth={2.2} />
              <span>Choose files</span>
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={isUploading || imageUrls.length >= MAX_IMAGE_COUNT}
            />
          </label>

          {uploadError ? <p className="listing-upload-error">{uploadError}</p> : null}

          {uploadItems.length ? (
            <div className="listing-upload-status-list">
              {uploadItems.map((item) => (
                <div key={item.id} className={`listing-upload-status is-${item.status}`}>
                  <span className="listing-upload-status-name">{item.name}</span>
                  <span className="listing-upload-status-details">{item.details}</span>
                </div>
              ))}
            </div>
          ) : null}

          <input type="hidden" name="imageUrl" value={imageUrls[0] || ""} />
          <input type="hidden" name="imageUrls" value={JSON.stringify(imageUrls)} />

          {imageUrls.length ? (
            <div className="listing-image-manager">
              <div className="listing-image-manager-head">
                <span className="field-label">Arrange photos</span>
                <span className="field-hint">
                  Use cover, move, or remove to control how your listing appears in browse.
                </span>
              </div>

              <div className="listing-image-grid">
                {imageUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="listing-image-card">
                    <div className="listing-image-card-media">
                      <img src={url} alt={`Listing preview ${index + 1}`} />

                      {index === 0 ? (
                        <span className="listing-image-cover-badge">
                          <Star aria-hidden="true" size={12} strokeWidth={2.4} />
                          <span>Cover</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="listing-image-card-body">
                      <div className="listing-image-card-meta">
                        <strong>Photo {index + 1}</strong>
                        <span>{index === 0 ? "Primary image in browse" : "Additional gallery image"}</span>
                      </div>

                      <div className="listing-image-card-actions">
                        <button
                          type="button"
                          className="listing-image-action"
                          onClick={() => setCoverImage(index)}
                          disabled={index === 0}
                        >
                          <Star aria-hidden="true" size={14} strokeWidth={2.3} />
                          <span>Make cover</span>
                        </button>

                        <button
                          type="button"
                          className="listing-image-action"
                          onClick={() => moveImage(index, "left")}
                          disabled={index === 0}
                        >
                          <ArrowLeft aria-hidden="true" size={14} strokeWidth={2.3} />
                          <span>Move left</span>
                        </button>

                        <button
                          type="button"
                          className="listing-image-action"
                          onClick={() => moveImage(index, "right")}
                          disabled={index === imageUrls.length - 1}
                        >
                          <ArrowRight aria-hidden="true" size={14} strokeWidth={2.3} />
                          <span>Move right</span>
                        </button>

                        <button
                          type="button"
                          className="listing-image-action is-danger"
                          onClick={() => removeImage(index)}
                        >
                          <Trash2 aria-hidden="true" size={14} strokeWidth={2.3} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="listing-image-empty-state">
              <Sparkles aria-hidden="true" size={18} strokeWidth={2.2} />
              <span>Add at least one clear photo so your listing feels trustworthy and complete.</span>
            </div>
          )}
        </div>
      </section>

      <div className="field-full listing-form-desktop-actions">
        <button className="button" type="submit" disabled={isUploading || !descriptionReady}>
          {isUploading ? "Uploading..." : submitLabel}
        </button>
      </div>

      <div className="listing-form-sticky-bar">
        <div className="listing-form-sticky-meta">
          <strong>{submitLabel}</strong>
          <span>{stickyHint}</span>
        </div>
        <button className="button" type="submit" disabled={isUploading || !descriptionReady}>
          {isUploading ? "Uploading..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
