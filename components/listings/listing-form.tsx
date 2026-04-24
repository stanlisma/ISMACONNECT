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
    imageUrls?: string[];
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
  const [description, setDescription] = useState(defaults?.description ?? "");

  const [imageUrls, setImageUrls] = useState<string[]>(
    defaults?.imageUrls?.length
      ? defaults.imageUrls
      : defaults?.imageUrl
        ? [defaults.imageUrl]
        : []
  );

  const [uploadError, setUploadError] = useState("");
  const [isUploading, startUpload] = useTransition();

  const subcategories = useMemo(() => getSubcategories(category), [category]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

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

        setImageUrls((current) => [...current, ...uploadedUrls]);
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Upload failed.");
      }
    });
  }

  function removeImage(indexToRemove: number) {
    setImageUrls((current) => current.filter((_, index) => index !== indexToRemove));
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
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={6}
          required
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "0.35rem",
            fontSize: "0.8rem",
            color: description.length < 10 ? "#b42318" : "#667085"
          }}
        >
          <span>Minimum 10 characters</span>
          <span>{description.length}/3000</span>
        </div>
      </label>

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

      <div className="field">
        <span className="field-label">Upload images</span>
        <input className="input" type="file" accept="image/*" multiple onChange={handleFileChange} />

        {isUploading ? <p style={{ marginTop: "0.5rem" }}>Uploading images...</p> : null}
        {uploadError ? (
          <p style={{ marginTop: "0.5rem", color: "#b42318" }}>{uploadError}</p>
        ) : null}
      </div>

      <input type="hidden" name="imageUrl" value={imageUrls[0] || ""} />
      <input type="hidden" name="imageUrls" value={JSON.stringify(imageUrls)} />

      {imageUrls.length > 0 ? (
        <div style={{ gridColumn: "1 / -1" }}>
          <span className="field-label">Preview</span>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: "0.75rem",
              marginTop: "0.5rem"
            }}
          >
            {imageUrls.map((url, index) => (
              <div key={`${url}-${index}`} style={{ position: "relative" }}>
                <img
                  src={url}
                  alt={`Listing preview ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "110px",
                    objectFit: "cover",
                    borderRadius: "10px",
                    border: "1px solid #d0d5dd"
                  }}
                />

                {index === 0 ? (
                  <span
                    style={{
                      position: "absolute",
                      left: "0.4rem",
                      top: "0.4rem",
                      background: "#15365b",
                      color: "white",
                      borderRadius: "999px",
                      padding: "0.15rem 0.45rem",
                      fontSize: "0.7rem",
                      fontWeight: 700
                    }}
                  >
                    Cover
                  </span>
                ) : null}

                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  style={{
                    position: "absolute",
                    right: "0.35rem",
                    top: "0.35rem",
                    border: "none",
                    borderRadius: "999px",
                    background: "rgba(0,0,0,0.65)",
                    color: "white",
                    width: "24px",
                    height: "24px",
                    cursor: "pointer"
                  }}
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ gridColumn: "1 / -1" }}>
        <button className="button" type="submit" disabled={isUploading || description.length < 10}>
          {isUploading ? "Uploading..." : submitLabel}
        </button>
      </div>
    </form>
  );
}