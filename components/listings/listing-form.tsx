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

import { trackMarketplaceEvent } from "@/lib/analytics";
import {
  DEFAULT_MARKETPLACE_CATEGORY,
  getDefaultPriceType,
  LISTING_INTENT_LABELS,
  LISTING_PRICE_TYPE_LABELS,
  REQUEST_WINDOW_LABELS
} from "@/lib/constants";
import { getStructuredFieldDefinitions } from "@/lib/listing-structured-fields";
import { getSubcategories, normalizeSubcategory } from "@/lib/subcategories";
import type {
  ListingIntent,
  ListingPriceType,
  ListingStructuredData,
  RequestWindow
} from "@/types/database";

type ListingFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  profileContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  defaultContactSource?: "profile" | "custom";
  defaults?: {
    listingIntent?: ListingIntent;
    requestWindow?: RequestWindow | null;
    category?: string;
    subcategory?: string;
    title?: string;
    price?: string;
    priceType?: ListingPriceType;
    location?: string;
    showExactAddressOnMap?: boolean;
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

function getLocationPlaceholder(category: string) {
  switch (category) {
    case "ride-share":
      return "100 Snowbird Avenue, Fort McMurray";
    case "jobs":
      return "205 Powder Drive, Fort McMurray";
    default:
      return "205 Powder Drive, Fort McMurray";
  }
}

function getLocationHint(category: string) {
  switch (category) {
    case "ride-share":
      return "Use the pickup address or community. If you keep exact map display off, riders only see the community, like Downtown or Thickwood.";
    case "jobs":
      return "Use the worksite address or a community, like Thickwood, Fort McMurray. Camp-based jobs can use Site / camp.";
    case "services":
      return "Use your service address or base community. Leave exact map display off if you only want Thickwood, Downtown, or Fort McMurray shown publicly.";
    case "buy-sell":
      return "Use your meetup address or a community. Leave exact map display off if you only want the community shown.";
    case "rentals":
      return "Use the rental address or community. Leave exact map display off if you only want the building area or community shown publicly.";
    default:
      return "Use the address you want tied to this listing. Leave exact map display off to show only the community publicly.";
  }
}

function getPriceTypeHint(category: string, listingIntent: ListingIntent, priceType: ListingPriceType) {
  if (priceType === "contact") {
    return listingIntent === "need"
      ? "Use this when your budget depends on the route, timing, or details you get back."
      : "Use this when you want replies before sharing a number.";
  }

  switch (category) {
    case "ride-share":
      return "Per trip works best for most camp rides, airport runs, and one-time routes.";
    case "rentals":
      return "Most rentals should use per month, unless this is a short worker stay.";
    case "jobs":
      return "Hourly is best for shift-based work. Use contact for price if pay depends on experience.";
    case "services":
      return "Use hourly for labour-based work or flat rate for packaged services like move-out cleaning.";
    default:
      return "Pick the price style that matches how locals normally expect this type of listing to be quoted.";
  }
}

function getListingIntentTitle(listingIntent: ListingIntent) {
  return listingIntent === "need" ? "Post what you need" : "Create listing";
}

function getTitlePlaceholder(category: string, listingIntent: ListingIntent) {
  if (listingIntent === "need") {
    switch (category) {
      case "ride-share":
        return "Need a ride to site tomorrow at 5 AM";
      case "rentals":
        return "Need a room in Timberlea starting June 1";
      case "jobs":
        return "Looking for Class 1 driver shifts in Fort McMurray";
      case "services":
        return "Need move-out cleaning this weekend";
      case "buy-sell":
      default:
        return "Looking for an iPhone 14 in Fort McMurray";
    }
  }

  switch (category) {
    case "ride-share":
      return "Daily rides to Horizon from Thickwood";
    case "rentals":
      return "Furnished room in Timberlea, available June 1";
    case "jobs":
      return "Hiring Class 1 driver for 14/7 camp shift";
    case "services":
      return "Move-out cleaning available across Fort McMurray";
    case "buy-sell":
    default:
      return "iPhone 14 Pro, unlocked and clean";
  }
}

function getDescriptionHint(listingIntent: ListingIntent) {
  return listingIntent === "need"
    ? "Explain what you need, when you need it, and any details responders should know."
    : "A little detail helps buyers trust the listing quickly.";
}

function getContactHint(listingIntent: ListingIntent) {
  return listingIntent === "need"
    ? "Add the best details for riders, landlords, employers, or providers to reply to."
    : "Add the details buyers or responders should use to reach you.";
}

function getPhotoPanelCopy(listingIntent: ListingIntent) {
  return listingIntent === "need"
    ? "Upload reference photos only if they help explain the job, item, or location. We optimize them before upload."
    : `Upload up to ${MAX_IMAGE_COUNT} images. We optimize them before upload so feeds load faster.`;
}

function normalizeContactValue(value?: string | null) {
  return value?.trim() ?? "";
}

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
  profileContact,
  defaultContactSource = "custom",
  defaults,
  submitLabel = "Publish listing"
}: ListingFormProps) {
  const [listingIntent, setListingIntent] = useState<ListingIntent>(defaults?.listingIntent ?? "offer");
  const [requestWindow, setRequestWindow] = useState<RequestWindow | "">(defaults?.requestWindow ?? "");
  const [category, setCategory] = useState(defaults?.category ?? DEFAULT_MARKETPLACE_CATEGORY);
  const [subcategory, setSubcategory] = useState(
    normalizeSubcategory(defaults?.category ?? DEFAULT_MARKETPLACE_CATEGORY, defaults?.subcategory) ?? ""
  );
  const [description, setDescription] = useState(defaults?.description ?? "");
  const [priceType, setPriceType] = useState<ListingPriceType>(
    defaults?.priceType ?? getDefaultPriceType(defaults?.category as any)
  );
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
  const [contactName, setContactName] = useState(defaults?.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(defaults?.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(defaults?.contactPhone ?? "");

  const subcategories = useMemo(() => getSubcategories(category), [category]);
  const structuredFields = useMemo(() => getStructuredFieldDefinitions(category as any), [category]);
  const structuredDefaults = defaults?.structuredData ?? null;
  const normalizedProfileContact = useMemo(
    () => ({
      name: normalizeContactValue(profileContact?.name),
      email: normalizeContactValue(profileContact?.email),
      phone: normalizeContactValue(profileContact?.phone)
    }),
    [profileContact?.email, profileContact?.name, profileContact?.phone]
  );
  const hasProfileContact = Boolean(
    normalizedProfileContact.name.length && normalizedProfileContact.email.length
  );
  const [useProfileContact, setUseProfileContact] = useState(
    hasProfileContact && defaultContactSource === "profile"
  );
  const descriptionReady = description.trim().length >= 10;
  const locationPlaceholder = useMemo(() => getLocationPlaceholder(category), [category]);
  const locationHint = useMemo(() => getLocationHint(category), [category]);
  const titleText = useMemo(() => getListingIntentTitle(listingIntent), [listingIntent]);
  const titlePlaceholder = useMemo(
    () => getTitlePlaceholder(category, listingIntent),
    [category, listingIntent]
  );
  const descriptionHint = useMemo(() => getDescriptionHint(listingIntent), [listingIntent]);
  const contactHint = useMemo(() => getContactHint(listingIntent), [listingIntent]);
  const photoPanelCopy = useMemo(() => getPhotoPanelCopy(listingIntent), [listingIntent]);
  const priceTypeHint = useMemo(
    () => getPriceTypeHint(category, listingIntent, priceType),
    [category, listingIntent, priceType]
  );
  const displayedSubmitLabel = useMemo(() => {
    const isEditing = submitLabel.toLowerCase().includes("save");
    if (listingIntent === "need") {
      return isEditing ? "Save need" : "Post need";
    }

    return isEditing ? "Save changes" : "Publish listing";
  }, [listingIntent, submitLabel]);
  const stickyHint = isUploading
    ? "Uploading photos..."
    : `${listingIntent === "need" ? "Need" : "Listing"} | ${imageUrls.length}/${MAX_IMAGE_COUNT} photos | ${description.length}/3000 chars`;

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const submittedCategory = String(formData.get("category") ?? category);
    const submittedSubcategory = String(formData.get("subcategory") ?? subcategory ?? "");
    const priceValue = String(formData.get("price") ?? "").trim();

    trackMarketplaceEvent(defaults ? "listing_edit_submit_attempt" : "listing_publish_attempt", {
      listing_intent: String(formData.get("listingIntent") ?? listingIntent),
      request_window: String(formData.get("requestWindow") ?? ""),
      category: submittedCategory || "unknown",
      subcategory: submittedSubcategory || "none",
      image_count: imageUrls.length,
      has_price: Boolean(priceValue),
      has_address: Boolean(String(formData.get("location") ?? "").trim()),
      shows_exact_address_on_map: formData.get("show_exact_address_on_map") === "on"
    });
  }

  return (
    <form action={action} className="form-grid listing-editor-form" onSubmit={handleSubmit}>
      <section className="field-full listing-form-section">
        <div className="listing-form-section-head">
          <div>
            <span className="field-label">Basics</span>
            <p className="field-hint">Start with the core facts people scan first.</p>
          </div>
        </div>

        <div className="listing-form-section-grid">
          <div className="field field-full listing-intent-field">
            <span className="field-label">Post type</span>
            <div className="listing-intent-toggle" role="radiogroup" aria-label="Choose post type">
              {(["offer", "need"] as ListingIntent[]).map((value) => (
                <label
                  key={value}
                  className={`listing-intent-option${listingIntent === value ? " is-active" : ""}`}
                >
                  <input
                    type="radio"
                    name="listingIntent"
                    value={value}
                    checked={listingIntent === value}
                    onChange={() => {
                      setListingIntent(value);
                      if (value !== "need") {
                      setRequestWindow("");
                    }
                  }}
                  />
                  <span>{LISTING_INTENT_LABELS[value]}</span>
                </label>
              ))}
            </div>
            <p className="field-hint">
              {listingIntent === "need"
                ? "Use Need when you are asking the market for help, a ride, a rental, or a worker."
                : "Use Offer when you already have the ride, service, rental, job, or item available."}
            </p>
          </div>

          {listingIntent === "need" ? (
            <label className="field">
              <span className="field-label">When do you need this?</span>
              <select
                className="input"
                name="requestWindow"
                value={requestWindow}
                onChange={(event) => setRequestWindow(event.target.value as RequestWindow | "")}
                required
              >
                <option value="">Choose timing</option>
                {(["today", "this-week", "flexible"] as RequestWindow[]).map((value) => (
                  <option key={value} value={value}>
                    {REQUEST_WINDOW_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <input type="hidden" name="requestWindow" value="" />
          )}

          <label className="field">
            <span className="field-label">Category</span>
            <select
              className="input"
              name="category"
              value={category}
              onChange={(event) => {
                const nextCategory = event.target.value;
                setCategory(nextCategory);
                setSubcategory("");
                setPriceType(getDefaultPriceType(nextCategory as any));
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
            <input
              className="input"
              name="title"
              defaultValue={defaults?.title ?? ""}
              placeholder={titlePlaceholder}
              required
            />
          </label>

          <label className="field">
            <span className="field-label">{listingIntent === "need" ? "Budget type" : "Price type"}</span>
            <select
              className="input"
              name="priceType"
              value={priceType}
              onChange={(event) => setPriceType(event.target.value as ListingPriceType)}
            >
              {Object.entries(LISTING_PRICE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <span className="field-hint">{priceTypeHint}</span>
          </label>

          <label className="field listing-price-amount-field">
            <span className="field-label">{listingIntent === "need" ? "Budget amount" : "Price amount"}</span>
            <input
              className="input listing-price-amount-input"
              name="price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              defaultValue={defaults?.price ?? ""}
              placeholder={priceType === "contact" ? "Optional when using Contact for price" : "Enter amount"}
              disabled={priceType === "contact"}
            />
          </label>

          <label className="field">
            <span className="field-label">Address</span>
            <p className="field-hint">{locationHint}</p>
            <input
              className="input"
              name="location"
              defaultValue={defaults?.location ?? ""}
              placeholder={locationPlaceholder}
            />
          </label>

          <div className="field listing-address-toggle-field">
            <span className="field-label">Map privacy</span>
            <label className="business-profile-toggle listing-address-toggle">
              <input
                type="checkbox"
                name="show_exact_address_on_map"
                defaultChecked={defaults?.showExactAddressOnMap ?? false}
              />
              <span>
                <strong>Show exact address on the map</strong>
                <small>Leave this off to show only the community, like Thickwood, Downtown, or Fort McMurray.</small>
              </span>
            </label>
          </div>
        </div>
      </section>

      <section className="field-full listing-form-section">
        <div className="listing-form-section-head">
          <div>
            <span className="field-label">Description</span>
            <p className="field-hint">{descriptionHint}</p>
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

                if (field.kind === "date") {
                  return (
                    <label key={field.name} className="field">
                      <span className="field-label">{field.label}</span>
                      <input
                        className="input"
                        type="date"
                        name={field.name}
                        defaultValue={typeof fieldValue === "string" ? fieldValue : ""}
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
            <span className="field-label">Contact details</span>
            <p className="field-hint">{contactHint}</p>
          </div>
        </div>

        {hasProfileContact ? (
          <div className="listing-contact-mode" role="radiogroup" aria-label="Choose contact source">
            <label
              className={`listing-contact-mode-option${useProfileContact ? " is-active" : ""}`}
            >
              <input
                type="radio"
                name="contactSource"
                value="profile"
                checked={useProfileContact}
                onChange={() => setUseProfileContact(true)}
              />
              <span>Use profile contact</span>
            </label>

            <label
              className={`listing-contact-mode-option${!useProfileContact ? " is-active" : ""}`}
            >
              <input
                type="radio"
                name="contactSource"
                value="custom"
                checked={!useProfileContact}
                onChange={() => setUseProfileContact(false)}
              />
              <span>Use different contact for this listing</span>
            </label>
          </div>
        ) : null}

        {useProfileContact && hasProfileContact ? (
          <>
            <div className="listing-contact-summary">
              <strong>Using your profile contact</strong>
              <dl>
                <div>
                  <dt>Name</dt>
                  <dd>{normalizedProfileContact.name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{normalizedProfileContact.email}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{normalizedProfileContact.phone || "Not added"}</dd>
                </div>
              </dl>
            </div>

            <input type="hidden" name="contactName" value={normalizedProfileContact.name} />
            <input type="hidden" name="contactEmail" value={normalizedProfileContact.email} />
            <input type="hidden" name="contactPhone" value={normalizedProfileContact.phone} />
          </>
        ) : (
          <>
            <div className="listing-contact-note">
              <strong>Name and email are required.</strong>
              <span>
                Phone is optional. Business accounts can use a business name instead of a personal
                name.
              </span>
            </div>

            <div className="listing-form-section-grid listing-contact-grid">
              <label className="field listing-contact-field">
                <span className="field-label">Contact or business name</span>
                <input
                  className="input"
                  name="contactName"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  placeholder="Stanley Ismaillar or North Side Property Services"
                  autoComplete="name"
                  autoCapitalize="words"
                  required
                />
                <span className="field-hint">
                  This is the name shown to people replying to your post.
                </span>
              </label>

              <label className="field listing-contact-field">
                <span className="field-label">Reply email</span>
                <input
                  className="input"
                  name="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
                <span className="field-hint">Replies and message follow-ups will use this email.</span>
              </label>

              <label className="field listing-contact-field">
                <span className="field-label">Phone number</span>
                <input
                  className="input"
                  name="contactPhone"
                  type="tel"
                  inputMode="tel"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  placeholder="(780) 555-0123"
                  autoComplete="tel"
                />
                <span className="field-hint">Optional. Add a number if you want calls or texts.</span>
              </label>
            </div>
          </>
        )}
      </section>

      <section className="field-full listing-form-section">
        <div className="listing-media-panel">
          <div className="listing-media-panel-head">
            <div>
              <span className="field-label">{listingIntent === "need" ? "Reference photos" : "Listing photos"}</span>
              <p className="field-hint listing-media-panel-copy">
                {photoPanelCopy}
              </p>
            </div>

            <div className="listing-media-panel-meta">
              <span>{imageUrls.length}/{MAX_IMAGE_COUNT} photos</span>
              <span>{listingIntent === "need" ? "First image appears first in replies" : "First image becomes the cover"}</span>
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
              <strong>{isUploading ? "Uploading your photos..." : listingIntent === "need" ? "Add reference photos" : "Add listing photos"}</strong>
              <span>
                JPG, PNG, or WebP. We compress them automatically and keep the sharpest first image at the front.
              </span>
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
              <span>
                {listingIntent === "need"
                  ? "Add a photo if it helps explain the request faster."
                  : "Add at least one clear photo so your listing feels trustworthy and complete."}
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="field-full listing-form-desktop-actions">
        <button className="button" type="submit" disabled={isUploading || !descriptionReady}>
          {isUploading ? "Uploading..." : displayedSubmitLabel}
        </button>
      </div>

      <div className="listing-form-sticky-bar">
        <div className="listing-form-sticky-meta">
          <strong>{titleText}</strong>
          <span>{stickyHint}</span>
        </div>
        <button className="button" type="submit" disabled={isUploading || !descriptionReady}>
          {isUploading ? "Uploading..." : displayedSubmitLabel}
        </button>
      </div>
    </form>
  );
}
