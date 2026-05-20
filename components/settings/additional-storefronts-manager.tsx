import { Trash2 } from "lucide-react";

import { StorefrontLogoField } from "@/components/settings/storefront-logo-field";
import { FieldHelp, FieldLabelWithHelp } from "@/components/ui/field-help";
import { BUSINESS_DAY_ORDER } from "@/lib/business-profile";
import type { AdditionalBusinessStorefront } from "@/types/database";

type AdditionalStorefrontsManagerProps = {
  storefronts: AdditionalBusinessStorefront[];
  schemaReady: boolean;
  accountEnabled?: boolean;
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

function StorefrontForm({
  title,
  submitLabel,
  defaults,
  action,
  deleteAction,
  isNew,
  returnPath = "/settings"
}: {
  title: string;
  submitLabel: string;
  defaults?: AdditionalBusinessStorefront;
  action: (formData: FormData) => void | Promise<void>;
  deleteAction?: (formData: FormData) => void | Promise<void>;
  isNew?: boolean;
  returnPath?: string;
}) {
  return (
    <div
      id={isNew ? "create-storefront-form" : defaults?.id ? `storefront-${defaults.id}` : undefined}
      className={`surface storefront-manager-card${isNew ? " is-new" : ""}`}
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
            <button className="button button-ghost storefront-manager-delete" type="submit">
              <Trash2 aria-hidden="true" size={14} strokeWidth={2.2} />
              <span>Delete</span>
            </button>
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

export function AdditionalStorefrontsManager({
  storefronts,
  schemaReady,
  accountEnabled = false,
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
                text="Run the additional storefront migration in Supabase to manage more than one public storefront from one business account."
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
      {storefronts.length ? (
        <div className="storefront-manager-overview surface">
          <div className="storefront-manager-overview-copy">
            <strong>
              {storefronts.length} storefront{storefronts.length === 1 ? "" : "s"} on this account
            </strong>
            <span>Open a storefront to edit it, or create another one for a different brand, service, or location.</span>
          </div>
        </div>
      ) : null}

      <div className="storefront-manager-toolbar">
        <div>
          <div className="business-profile-title-row">
            <h2>Storefronts</h2>
            <FieldHelp
              label="Storefronts"
              text="Add separate storefronts for different locations, brands, or service lines."
            />
          </div>
        </div>
        <div className="storefront-manager-toolbar-side">
          {storefronts.length ? (
            <span className="account-menu-pill is-muted">
              {storefronts.length} storefront{storefronts.length === 1 ? "" : "s"}
            </span>
          ) : null}
          <a
            className={`button${accountEnabled ? " button-secondary" : ""}`}
            href={buildCreateStorefrontHref(returnPath)}
          >
            {storefronts.length ? "Create another storefront" : "Create storefront"}
          </a>
        </div>
      </div>

      {storefronts.map((storefront) => {
        const serviceSummary = storefront.services.slice(0, 2).join(" / ");
        const summaryLabel =
          serviceSummary ||
          storefront.address ||
          storefront.phone ||
          "Storefront settings";

        return (
          <details
            key={storefront.id}
            className="storefront-manager-panel"
            open={focusStorefrontId === storefront.id}
          >
            <summary className="storefront-manager-panel-summary">
              <div className="storefront-manager-panel-copy">
                <strong>{storefront.name}</strong>
                <span>{summaryLabel}</span>
              </div>
              <span className="storefront-manager-panel-action">Edit storefront</span>
            </summary>

            <StorefrontForm
              title={storefront.name}
              submitLabel="Save storefront"
              defaults={storefront}
              action={updateAction.bind(null, storefront.id)}
              deleteAction={deleteAction.bind(null, storefront.id)}
              returnPath={returnPath}
            />
          </details>
        );
      })}

      {storefronts.length ? (
        <details className="storefront-manager-panel storefront-manager-create-panel" open={showCreateForm}>
          <summary className="storefront-manager-panel-summary" id="create-storefront-form">
            <div className="storefront-manager-panel-copy">
              <strong>Create another storefront</strong>
              <span>Add a separate storefront for another service line, crew, or location.</span>
            </div>
            <span className="storefront-manager-panel-action">Open form</span>
          </summary>

          <StorefrontForm
            title="Create storefront"
            submitLabel="Create storefront"
            action={createAction}
            isNew
            defaults={suggestedDefaults}
            returnPath={returnPath}
          />
        </details>
      ) : (
        <StorefrontForm
          title="Create storefront"
          submitLabel="Create storefront"
          action={createAction}
          isNew
          defaults={suggestedDefaults}
          returnPath={returnPath}
        />
      )}
    </div>
  );
}
