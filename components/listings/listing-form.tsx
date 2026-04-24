"use client";

import { useMemo, useState, useTransition } from "react";

import { getSubcategories } from "@/lib/subcategories";

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
  };
  submitLabel?: string;
};

export function ListingForm({
  action,
  defaults,
  submitLabel = "Publish listing"
}: ListingFormProps) {
  const [category, setCategory] = useState(defaults?.category ?? "buy-sell");
  const [subcategory, setSubcategory] = useState(defaults?.subcategory ?? "");
const [imageUrls, setImageUrls] = useState<string[]>(
  defaults?.imageUrl ? [defaults.imageUrl] : []
);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, startUpload] = useTransition();

  const subcategories = useMemo(() => getSubcategories(category), [category]);

async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  setUploadError("");

  startUpload(async () => {
    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
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

        uploadedUrls.push(data.url);
      }

      setImageUrls((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    }
  });
}
  }

  return (
    <form action={action} className="form-grid">
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

      <label className="field">
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

      <label className="field" style={{ gridColumn: "1 / -1" }}>
        <span className="field-label">Description</span>
        <textarea
          className="input"
          name="description"
          defaultValue={defaults?.description ?? ""}
          rows={6}
          required
        />
      </label>

      <label className="field">
        <span className="field-label">Contact name</span>
        <input className="input" name="contactName" defaultValue={defaults?.contactName ?? ""} required />
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

      <div className="field">
        <span className="field-label">Upload image</span>
        <input
          className="input"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
        {isUploading ? <p style={{ marginTop: "0.5rem" }}>Uploading image...</p> : null}
        {uploadError ? <p style={{ marginTop: "0.5rem", color: "#b42318" }}>{uploadError}</p> : null}
      </div>

      <label className="field" style={{ gridColumn: "1 / -1" }}>
        <span className="field-label">Image URL</span>
        <input type="hidden" name="imageUrl" value={imageUrls[0] || ""} />
      </label>

      {imageUrls.length > 0 ? (
  <div style={{ gridColumn: "1 / -1" }}>
    <span className="field-label">Preview</span>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
        gap: "0.5rem",
        marginTop: "0.5rem"
      }}
    >
      {imageUrls.map((url, index) => (
        <img
          key={index}
          src={url}
          alt="Preview"
          style={{
            width: "100%",
            height: "100px",
            objectFit: "cover",
            borderRadius: "10px",
            border: "1px solid #d0d5dd"
          }}
        />
      ))}
    </div>
  </div>
) : null}

      <div style={{ gridColumn: "1 / -1" }}>
        <button className="button" type="submit" disabled={isUploading}>
          {isUploading ? "Uploading..." : submitLabel}
        </button>
      </div>
    </form>
  );
}