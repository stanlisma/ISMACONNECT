import { Trash2 } from "lucide-react";

import { FieldHelp, FieldLabelWithHelp } from "@/components/ui/field-help";
import { BUSINESS_DAY_ORDER } from "@/lib/business-profile";
import type { AdditionalBusinessStorefront } from "@/types/database";

type AdditionalStorefrontsManagerProps = {
  storefronts: AdditionalBusinessStorefront[];
  schemaReady: boolean;
  accountEnabled?: boolean;
  createAction: (formData: FormData) => void | Promise<void>;
  updateAction: (storefrontId: string, formData: FormData) => void | Promise<void>;
  deleteAction: (storefrontId: string, formData: FormData) => void | Promise<void>;
  fallbackPhone?: string;
  suggestedDefaults?: AdditionalBusinessStorefront;
  returnPath?: string;
};

function StorefrontForm({
  title,
  submitLabel,
  defaults,
  action,
  deleteAction,
  isNew,
  fallbackPhone,
  returnPath = "/settings"
}: {
  title: string;
  submitLabel: string;
  defaults?: AdditionalBusinessStorefront;
  action: (formData: FormData) => void | Promise<void>;
  deleteAction?: (formData: FormData) => void | Promise<void>;
  isNew?: boolean;
  fallbackPhone?: string;
  returnPath?: string;
}) {
  return (
    <div
      id={isNew ? "create-storefront-form" : undefined}
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

          <label className="field">
            <FieldLabelWithHelp
              label="Logo image URL"
              helpText="Optional storefront logo or badge image URL."
            />
            <input
              className="input"
              type="text"
              name="logo_url"
              defaultValue={defaults?.logo_url ?? ""}
              placeholder="https://..."
            />
          </label>
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
              helpText="Optional storefront phone. Leave blank to keep using your account phone in trust views."
            />
            <input
              className="input"
              type="tel"
              name="phone"
              defaultValue={defaults?.phone ?? fallbackPhone ?? ""}
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
  createAction,
  updateAction,
  deleteAction,
  fallbackPhone,
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
      <div className="surface storefront-manager-summary">
        <div>
          <div className="business-profile-title-row">
            <h2>Storefronts</h2>
            <FieldHelp
              label="Storefronts"
              text="Add separate storefronts for different locations, brands, or service lines."
            />
          </div>
        </div>
        <div className="storefront-manager-summary-side">
          <div className="meta-list">
          <span>{storefronts.length} storefront{storefronts.length === 1 ? "" : "s"}</span>
          </div>
          <a className={`button${accountEnabled ? " button-secondary" : ""}`} href="#create-storefront-form">
            Create storefront
          </a>
        </div>
      </div>

      {!accountEnabled ? (
        <div className="surface storefront-manager-card storefront-manager-empty-card">
          <div className="storefront-manager-card-head">
            <div>
              <h3>Business mode will turn on automatically</h3>
            </div>
          </div>

          <div className="storefront-manager-empty-state">
            <p>
              You can create a storefront right away. Saving your first storefront will also enable business storefronts on this account.
            </p>
          </div>
        </div>
      ) : null}

      {storefronts.length === 0 ? (
        <div className="surface storefront-manager-card storefront-manager-empty-card">
          <div className="storefront-manager-card-head">
            <div>
              <h3>No storefronts yet</h3>
            </div>
          </div>

          <div className="storefront-manager-empty-state">
            <p>Create your first storefront below for a brand, location, or service line under this account.</p>
            <a className="button" href="#create-storefront-form">
              Create your first storefront
            </a>
          </div>
        </div>
      ) : null}

      <StorefrontForm
        title="Create storefront"
        submitLabel="Create storefront"
        action={createAction}
        isNew
        fallbackPhone={fallbackPhone}
        defaults={suggestedDefaults}
        returnPath={returnPath}
      />

      {storefronts.map((storefront) => (
        <StorefrontForm
          key={storefront.id}
          title={storefront.name}
          submitLabel="Save storefront"
          defaults={storefront}
          action={updateAction.bind(null, storefront.id)}
          deleteAction={deleteAction.bind(null, storefront.id)}
          fallbackPhone={fallbackPhone}
          returnPath={returnPath}
        />
      ))}
    </div>
  );
}
