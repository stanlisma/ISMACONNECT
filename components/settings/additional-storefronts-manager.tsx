import Link from "next/link";
import { ExternalLink, PencilLine, Phone, MapPin, Trash2 } from "lucide-react";

import { StorefrontGalleryField } from "@/components/settings/storefront-gallery-field";
import { StorefrontLogoField } from "@/components/settings/storefront-logo-field";
import { StorefrontImageGallery } from "@/components/storefronts/storefront-image-gallery";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FieldHelp, FieldLabelWithHelp } from "@/components/ui/field-help";
import { BUSINESS_DAY_ORDER, getBusinessHoursRows, hasConfiguredBusinessHours } from "@/lib/business-profile";
import { buildStorefrontHref } from "@/lib/business-storefronts";
import type { AdditionalBusinessStorefront } from "@/types/database";

type AdditionalStorefrontsManagerProps = {
  storefronts: AdditionalBusinessStorefront[];
  schemaReady: boolean;
  focusStorefrontId?: string | null;
  showCreateForm?: boolean;
  createAction: (formData: FormData) => void | Promise<void>;
  updateAction: (storefrontId: string, formData: FormData) => void | Promise<void>;
  deleteAction: (storefrontId: string, formData: FormData) => void | Promise<void>;
  suggestedDefaults?: AdditionalBusinessStorefront;
  returnPath?: string;
};

function buildCreateStorefrontHref(returnPath: string) {
  const [pathname, existingQuery] = returnPath.split("?");
  const searchParams = new URLSearchParams(existingQuery ?? "");
  searchParams.set("create", "1");
  const queryString = searchParams.toString();
  return `${queryString ? `${pathname}?${queryString}` : pathname}#create-storefront-form`;
}

function buildStorefrontsOverviewHref(returnPath: string) {
  const [pathname, existingQuery] = returnPath.split("?");
  const searchParams = new URLSearchParams(existingQuery ?? "");
  searchParams.delete("create");
  searchParams.delete("storefront");
  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function getStorefrontInitials(name: string) {
  const words = name
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials || name.slice(0, 2).toUpperCase() || "SF";
}

function formatStorefrontWebsiteLabel(website: string) {
  return website.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function getPreviewChips(items: string[], max = 4) {
  return {
    visible: items.slice(0, max),
    hiddenCount: Math.max(0, items.length - max)
  };
}

function StorefrontForm({
  title,
  submitLabel,
  defaults,
  action,
  deleteAction,
  isNew,
  embedded = false,
  returnPath = "/settings"
}: {
  title: string;
  submitLabel: string;
  defaults?: AdditionalBusinessStorefront;
  action: (formData: FormData) => void | Promise<void>;
  deleteAction?: (formData: FormData) => void | Promise<void>;
  isNew?: boolean;
  embedded?: boolean;
  returnPath?: string;
}) {
  return (
    <div
      id={isNew ? "create-storefront-form" : defaults?.id ? `storefront-${defaults.id}` : undefined}
      className={`${embedded ? "" : "surface "}storefront-manager-card${isNew ? " is-new" : ""}${embedded ? " is-embedded" : ""}`}
    >
      <div className="storefront-manager-card-head">
        <div>
          <div className="business-profile-title-row">
            <h3>{title}</h3>
            <FieldHelp
              label={title}
              text={
                isNew
                  ? "Create another public storefront for a separate brand, location, or service line."
                  : "Edit this storefront separately from your personal seller profile and your other storefronts."
              }
            />
          </div>
        </div>

        {deleteAction ? (
          <form action={deleteAction}>
            <input type="hidden" name="return_path" value={returnPath} />
            <ConfirmSubmitButton
              className="button button-ghost storefront-manager-delete"
              confirmMessage="Delete this storefront? This will remove its public profile."
              pendingLabel="Deleting..."
            >
              <Trash2 aria-hidden="true" size={14} strokeWidth={2.2} />
              <span>Delete</span>
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>

      <form action={action} className="storefront-manager-form">
        <input type="hidden" name="return_path" value={returnPath} />

        <div className="storefront-manager-grid">
          <label className="field">
            <FieldLabelWithHelp
              label="Storefront name"
              helpText="Use the public name customers should see for this storefront."
            />
            <input
              className="input"
              type="text"
              name="name"
              defaultValue={defaults?.name ?? ""}
              placeholder="Example: North Side Rentals"
              required
            />
          </label>

          <StorefrontLogoField defaultValue={defaults?.logo_url ?? ""} />
        </div>

        <div className="storefront-manager-grid">
          <label className="field">
            <FieldLabelWithHelp
              label="Website"
              helpText="Optional public website for this storefront."
            />
            <input
              className="input"
              type="text"
              name="website"
              defaultValue={defaults?.website ?? ""}
              placeholder="northsiderentals.ca"
            />
          </label>

          <label className="field">
            <FieldLabelWithHelp
              label="Phone"
              helpText="Optional storefront phone. Add it when this storefront should have its own public call or text number."
            />
            <input
              className="input"
              type="tel"
              name="phone"
              defaultValue={defaults?.phone ?? ""}
              placeholder="(780) 555-0123"
            />
          </label>
        </div>

        <label className="field">
          <FieldLabelWithHelp
            label="Storefront address"
            helpText="Use the storefront or business address only. Leave blank if this storefront should stay area-based."
          />
          <input
            className="input"
            type="text"
            name="address"
            defaultValue={defaults?.address ?? ""}
            placeholder="205 Powder Drive, Fort McMurray, AB"
          />
        </label>

        <label className="field">
          <FieldLabelWithHelp
            label="Description"
            helpText="Explain what this storefront offers and who it serves."
          />
          <textarea
            className="textarea business-profile-textarea"
            name="description"
            rows={4}
            defaultValue={defaults?.description ?? ""}
            placeholder="Describe what this storefront offers, who it serves, and how locals should use it."
          />
        </label>

        <StorefrontGalleryField defaultValue={defaults?.image_urls ?? []} />

        <div className="storefront-manager-grid">
          <label className="field">
            <FieldLabelWithHelp
              label="Service areas"
              helpText="List the communities or nearby areas this storefront serves, separated with commas."
            />
            <input
              className="input"
              type="text"
              name="service_areas"
              defaultValue={defaults?.service_areas.join(", ") ?? ""}
              placeholder="Fort McMurray, Timberlea, Thickwood"
            />
          </label>

          <label className="field">
            <FieldLabelWithHelp
              label="Storefront services"
              helpText="Separate specialties with commas so the storefront reads clearly."
            />
            <input
              className="input"
              type="text"
              name="services"
              defaultValue={defaults?.services.join(", ") ?? ""}
              placeholder="Short-term rentals, crew housing, furnished suites"
            />
          </label>
        </div>

        <div className="business-hours-card">
          <div className="business-hours-head">
            <div>
              <FieldLabelWithHelp
                label="Storefront hours"
                helpText="Optional weekly hours for this storefront."
              />
            </div>
          </div>

          <div className="business-hours-list">
            {BUSINESS_DAY_ORDER.map((day) => {
              const defaultsForDay = defaults?.hours?.[day.key];

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

        <label className="business-profile-toggle storefront-manager-toggle">
          <input
            type="checkbox"
            name="show_exact_location"
            defaultChecked={defaults?.show_exact_location ?? false}
          />
          <span>
            <strong className="listing-toggle-title">
              <span>Use this storefront address as an exact map default</span>
              <FieldHelp
                text="Only use this when the storefront has a real business address you want tied to listings by default."
                label="Use this storefront address as an exact map default"
              />
            </strong>
          </span>
        </label>

        <div className="business-profile-actions storefront-manager-actions">
          <button className="button" type="submit">
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

function StorefrontPreview({
  storefront,
  action,
  deleteAction,
  returnPath
}: {
  storefront: AdditionalBusinessStorefront;
  action: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  returnPath: string;
}) {
  const hoursRows = hasConfiguredBusinessHours(storefront.hours) ? getBusinessHoursRows(storefront.hours) : [];
  const publicStorefrontHref = buildStorefrontHref(storefront.owner_id, storefront.id);
  const areaChips = getPreviewChips(storefront.service_areas);
  const serviceChips = getPreviewChips(storefront.services);
  const summaryText =
    storefront.description?.trim() ||
    (storefront.services.length
      ? `Services: ${storefront.services.slice(0, 3).join(", ")}`
      : "Public storefront ready for local discovery.");

  return (
    <div className="storefront-manager-preview">
      <div className="storefront-manager-preview-copy storefront-manager-preview-copy-compact">
        <p>{summaryText}</p>

        <div className="storefront-manager-preview-meta">
          {storefront.address ? (
            <span>
              <MapPin aria-hidden="true" size={14} strokeWidth={2.1} />
              <span>{storefront.address}</span>
            </span>
          ) : null}
          {storefront.phone ? (
            <span>
              <Phone aria-hidden="true" size={14} strokeWidth={2.1} />
              <span>{storefront.phone}</span>
            </span>
          ) : null}
          {storefront.website ? (
            <span>
              <ExternalLink aria-hidden="true" size={14} strokeWidth={2.1} />
              <span>{formatStorefrontWebsiteLabel(storefront.website)}</span>
            </span>
          ) : null}
        </div>
      </div>

      {storefront.image_urls.length ? (
        <StorefrontImageGallery images={storefront.image_urls} title={storefront.name} compact />
      ) : null}

      {areaChips.visible.length ? (
        <div className="storefront-manager-chip-row">
          {areaChips.visible.map((area) => (
            <span key={area} className="storefront-manager-chip">
              {area}
            </span>
          ))}
          {areaChips.hiddenCount ? (
            <span className="storefront-manager-chip is-muted">+{areaChips.hiddenCount} more</span>
          ) : null}
        </div>
      ) : null}

      {serviceChips.visible.length ? (
        <div className="storefront-manager-chip-row is-secondary">
          {serviceChips.visible.map((service) => (
            <span key={service} className="storefront-manager-chip">
              {service}
            </span>
          ))}
          {serviceChips.hiddenCount ? (
            <span className="storefront-manager-chip is-muted">+{serviceChips.hiddenCount} more</span>
          ) : null}
        </div>
      ) : null}

      {hoursRows.length ? (
        <div className="storefront-manager-hours-card">
          <div className="storefront-manager-hours-head">
            <strong>Storefront hours</strong>
            <span>Shown publicly on this storefront</span>
          </div>

          <ul className="seller-storefront-hours-list storefront-manager-hours-list">
            {hoursRows.map((row) => (
              <li key={row.dayKey}>
                <span>{row.label}</span>
                <strong className={row.closed ? "is-closed" : ""}>{row.range}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="storefront-manager-preview-actions">
        <Link href={publicStorefrontHref} className="button button-secondary">
          View public storefront
        </Link>
      </div>

      <details className="storefront-manager-editor">
        <summary className="storefront-manager-editor-toggle">
          <PencilLine aria-hidden="true" size={15} strokeWidth={2.15} />
          <span>Edit storefront</span>
        </summary>

        <StorefrontForm
          title="Edit storefront"
          submitLabel="Save storefront"
          defaults={storefront}
          action={action}
          deleteAction={deleteAction}
          embedded
          returnPath={returnPath}
        />
      </details>
    </div>
  );
}

export function AdditionalStorefrontsManager({
  storefronts,
  schemaReady,
  focusStorefrontId,
  showCreateForm = false,
  createAction,
  updateAction,
  deleteAction,
  suggestedDefaults,
  returnPath = "/settings"
}: AdditionalStorefrontsManagerProps) {
  if (!schemaReady) {
    return (
      <div className="surface storefront-manager-card">
        <div className="storefront-manager-card-head">
          <div>
            <div className="business-profile-title-row">
              <h2>Storefronts</h2>
              <FieldHelp
                label="Storefronts"
                text="Run the additional storefront migration in Supabase to manage more than one public storefront from one account."
              />
            </div>
          </div>
        </div>

        <div className="storefront-manager-empty-state">
          <p>
            Run the storefront migration in Supabase first, then refresh this page to start creating storefronts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-block-stack">
      <div className="storefront-manager-toolbar">
        <div>
          <div className="business-profile-title-row">
            <h2>Storefronts</h2>
            <FieldHelp
              label="Storefronts"
              text="Every signed-in account can create separate storefronts for different locations, brands, or service lines."
            />
          </div>
        </div>
        <div className="storefront-manager-toolbar-side">
          {storefronts.length ? (
            <a
              className="button button-secondary"
              href={showCreateForm ? buildStorefrontsOverviewHref(returnPath) : buildCreateStorefrontHref(returnPath)}
            >
              {showCreateForm ? "Back to storefronts" : "New storefront"}
            </a>
          ) : null}
        </div>
      </div>

      {storefronts.length > 0 && showCreateForm ? (
        <StorefrontForm
          title="Create storefront"
          submitLabel="Create storefront"
          action={createAction}
          isNew
          defaults={suggestedDefaults}
          returnPath={returnPath}
        />
      ) : null}

      {storefronts.map((storefront) => {
        const serviceSummary = storefront.services.slice(0, 2).join(" / ");
        const summaryLabel =
          storefront.address ||
          serviceSummary ||
          storefront.phone ||
          "Ready to manage";

        return (
          <details
            key={storefront.id}
            id={`storefront-${storefront.id}`}
            className="storefront-manager-panel"
            open={focusStorefrontId === storefront.id}
          >
            <summary className="storefront-manager-panel-summary">
              <div className="storefront-manager-panel-identity">
                <div className="storefront-manager-avatar" aria-hidden="true">
                  {storefront.logo_url ? (
                    <img src={storefront.logo_url} alt="" className="storefront-manager-avatar-image" />
                  ) : (
                    <span>{getStorefrontInitials(storefront.name)}</span>
                  )}
                </div>
                <div className="storefront-manager-panel-copy">
                  <strong>{storefront.name}</strong>
                  <span>{summaryLabel}</span>
                </div>
              </div>
              <span className="storefront-manager-panel-action">Open</span>
            </summary>

            <StorefrontPreview
              storefront={storefront}
              action={updateAction.bind(null, storefront.id)}
              deleteAction={deleteAction.bind(null, storefront.id)}
              returnPath={returnPath}
            />
          </details>
        );
      })}

      {!storefronts.length ? (
        <StorefrontForm
          title="Create storefront"
          submitLabel="Create storefront"
          action={createAction}
          isNew
          defaults={suggestedDefaults}
          returnPath={returnPath}
        />
      ) : null}
    </div>
  );
}
