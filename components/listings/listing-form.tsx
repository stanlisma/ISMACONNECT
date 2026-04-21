import Link from "next/link";

import { CATEGORIES, DEFAULT_LOCATION } from "@/lib/constants";
import type { ListingCategory } from "@/types/database";
import { SubmitButton } from "@/components/ui/submit-button";

interface ListingFormDefaults {
  category?: ListingCategory;
  title?: string;
  description?: string;
  price?: number | null;
  location?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  imageUrl?: string | null;
}

interface ListingFormProps {
  action: (formData: FormData) => Promise<void>;
  cancelHref: string;
  defaults?: ListingFormDefaults;
  submitLabel: string;
  pendingLabel: string;
}

export function ListingForm({
  action,
  cancelHref,
  defaults,
  pendingLabel,
  submitLabel
}: ListingFormProps) {
  return (
    <form action={action} className="form-grid">
      <div className="surface">
        <div className="form-grid">
          <label className="field">
            <span className="field-label">Category</span>
            <select className="select" defaultValue={defaults?.category ?? "rentals"} name="category">
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Title</span>
            <input
              className="input"
              defaultValue={defaults?.title ?? ""}
              maxLength={120}
              name="title"
              placeholder="Bright room near downtown Fort McMurray"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Price</span>
            <input
              className="input"
              defaultValue={defaults?.price ?? ""}
              min={0}
              name="price"
              placeholder="650"
              step="0.01"
              type="number"
            />
            <span className="field-hint">Leave blank if you prefer “Contact for price”.</span>
          </label>

          <label className="field">
            <span className="field-label">Location</span>
            <input
              className="input"
              defaultValue={defaults?.location ?? DEFAULT_LOCATION}
              maxLength={80}
              name="location"
              required
            />
          </label>

          <label className="field field-full">
            <span className="field-label">Description</span>
            <textarea
              className="textarea"
              defaultValue={defaults?.description ?? ""}
              name="description"
              placeholder="Share the key details people need before they contact you."
              required
              rows={8}
            />
          </label>
        </div>
      </div>

      <div className="surface">
        <div className="form-grid">
          <label className="field">
            <span className="field-label">Contact name</span>
            <input
              className="input"
              defaultValue={defaults?.contactName ?? ""}
              maxLength={80}
              name="contactName"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Contact email</span>
            <input
              className="input"
              defaultValue={defaults?.contactEmail ?? ""}
              name="contactEmail"
              placeholder="seller@example.com"
              type="email"
            />
          </label>

          <label className="field">
            <span className="field-label">Contact phone</span>
            <input
              className="input"
              defaultValue={defaults?.contactPhone ?? ""}
              name="contactPhone"
              placeholder="780-555-0123"
              type="tel"
            />
          </label>

          <label className="field">
            <span className="field-label">Image URL</span>
            <input
              className="input"
              defaultValue={defaults?.imageUrl ?? ""}
              name="imageUrl"
              placeholder="https://images.example.com/listing.jpg"
              type="url"
            />
            <span className="field-hint">Optional for now. Stripe-ready featured listings can promote these later.</span>
          </label>
        </div>
      </div>

      <div className="form-actions">
        <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
        <Link className="button button-secondary" href={cancelHref}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

