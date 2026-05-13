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
import { FieldHelp, FieldLabelWithHelp } from "@/components/ui/field-help";
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
const LISTING_INTENT_HELP: Record<ListingIntent, string> = {
  offer: "Use Offer when you already have the ride, rental, job, service, or item available.",
  need: "Use Need when you are asking the market for help, a ride, a rental, work, or an item."
};

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

const TITLE_PLACEHOLDER_MAP: Record<
  string,
  Partial<Record<string, { offer: string; need: string }>>
> = {
  "ride-share": {
    "daily-commute": {
      offer: "Daily rides to site from Thickwood",
      need: "Need a daily ride to site from Timberlea"
    },
    "one-time-ride": {
      offer: "One-time ride to Edmonton this Friday",
      need: "Need a one-time ride to Edmonton tomorrow"
    },
    "airport-ride": {
      offer: "Airport pickup available from YMM to Thickwood",
      need: "Need an airport ride from YMM tonight"
    },
    "camp-site-transport": {
      offer: "14/7 rides to Horizon from Fort McMurray",
      need: "Need a ride to site tomorrow at 5 AM"
    },
    "long-distance-ride": {
      offer: "Fort McMurray to Calgary ride this weekend",
      need: "Need a long-distance ride to Edmonton on Tuesday"
    },
    "delivery-item-transport": {
      offer: "Pickup truck available for small item delivery",
      need: "Need item delivery from Timberlea to Downtown"
    }
  },
  rentals: {
    apartments: {
      offer: "1-bedroom apartment in Downtown, available June 1",
      need: "Need an apartment in Thickwood starting June 1"
    },
    houses: {
      offer: "3-bedroom house with garage in Timberlea",
      need: "Need a house rental for a small family in Fort McMurray"
    },
    "rooms-shared": {
      offer: "Furnished room in Timberlea with parking",
      need: "Need a furnished room near site pickup routes"
    },
    "basement-suites": {
      offer: "Quiet basement suite in Thickwood, utilities included",
      need: "Need a basement suite in Fort McMurray for June"
    },
    "short-term-rentals": {
      offer: "Short-term rental for FIFO workers in Timberlea",
      need: "Need a short-term rental for my next rotation"
    },
    "parking-storage": {
      offer: "Truck parking available in Thickwood",
      need: "Need secure parking for a work truck"
    },
    "commercial-space": {
      offer: "Commercial bay space available in Fort McMurray",
      need: "Need small commercial space for equipment storage"
    }
  },
  jobs: {
    "construction-trades": {
      offer: "Hiring carpenter for local project in Fort McMurray",
      need: "Looking for construction or trade shifts in Fort McMurray"
    },
    "oilfield-camp-site": {
      offer: "Hiring labourers for 14/7 camp shift",
      need: "Looking for camp or site work starting next week"
    },
    "general-labour": {
      offer: "General labour help needed for weekend move",
      need: "Looking for general labour work this week"
    },
    "driving-delivery": {
      offer: "Hiring Class 1 driver for regional route",
      need: "Looking for Class 1 driver shifts in Fort McMurray"
    },
    hospitality: {
      offer: "Hiring line cook for busy Fort McMurray kitchen",
      need: "Looking for hospitality work in Fort McMurray"
    },
    healthcare: {
      offer: "Hiring health care aide for local support role",
      need: "Looking for healthcare shifts in Fort McMurray"
    },
    "admin-office": {
      offer: "Office administrator needed for local business",
      need: "Looking for admin or office work in Fort McMurray"
    },
    "other-jobs": {
      offer: "Hiring part-time help for local operations",
      need: "Looking for local work in Fort McMurray"
    }
  },
  services: {
    "skilled-trades": {
      offer: "Licensed electrician available for home repairs",
      need: "Need a plumber for a kitchen leak this week"
    },
    cleaning: {
      offer: "Move-out cleaning available across Fort McMurray",
      need: "Need move-out cleaning this weekend"
    },
    "home-services": {
      offer: "Handyman available for small home repairs",
      need: "Need help with drywall patching in Timberlea"
    },
    "moving-hauling": {
      offer: "Moving and dump runs available in Fort McMurray",
      need: "Need a dump run for old furniture this Saturday"
    },
    "automotive-services": {
      offer: "Mobile brake service available in Fort McMurray",
      need: "Need help replacing brakes on my truck"
    },
    "beauty-wellness": {
      offer: "Certified lash technician in Fort McMurray",
      need: "Need a local makeup artist for this weekend"
    },
    "lessons-tutoring": {
      offer: "Math tutoring available for high school students",
      need: "Need an English tutor for my teenager"
    },
    "business-services": {
      offer: "Bookkeeping and payroll support for local businesses",
      need: "Need bookkeeping help for my small business"
    },
    "childcare-family-care": {
      offer: "Babysitting available evenings and weekends",
      need: "Need childcare help after school this week"
    },
    "senior-care": {
      offer: "Companion care available for seniors in Fort McMurray",
      need: "Need senior care support for weekday mornings"
    },
    "other-services": {
      offer: "Local service help available across Fort McMurray",
      need: "Need reliable local help in Fort McMurray"
    }
  },
  "buy-sell": {
    furniture: {
      offer: "Solid wood dining table with 6 chairs",
      need: "Looking for a sectional couch in Fort McMurray"
    },
    electronics: {
      offer: "55-inch Samsung TV in great condition",
      need: "Looking for a PS5 in Fort McMurray"
    },
    phones: {
      offer: "iPhone 14 Pro, unlocked and clean",
      need: "Looking for an iPhone 14 in Fort McMurray"
    },
    computers: {
      offer: "Gaming laptop with RTX graphics card",
      need: "Looking for a used MacBook for work"
    },
    home: {
      offer: "Kitchen island and bar stools for sale",
      need: "Looking for a patio set in good condition"
    },
    "tools-equipment": {
      offer: "Milwaukee tool set with batteries and charger",
      need: "Looking for used snowblower or generator"
    },
    clothing: {
      offer: "Men's work jackets and safety gear bundle",
      need: "Looking for winter workwear in size large"
    },
    "baby-kids": {
      offer: "Stroller and crib set in excellent condition",
      need: "Looking for baby gate and high chair"
    },
    "auto-parts": {
      offer: "F-150 winter tires on rims, ready to mount",
      need: "Looking for truck tires for a Dodge Ram"
    },
    "sports-outdoors": {
      offer: "Trek mountain bike, tuned and ready to ride",
      need: "Looking for camping gear for summer trips"
    },
    "free-stuff": {
      offer: "Free moving boxes, pickup in Thickwood",
      need: "Looking for free pallets or scrap wood"
    },
    wanted: {
      offer: "Wanted: used trailer in good shape",
      need: "Looking for a workbench or tool chest"
    },
    "other-buy-sell": {
      offer: "Household bundle available for quick pickup",
      need: "Looking for a specific item in Fort McMurray"
    }
  }
};

function getRandomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function getTitlePlaceholder(category: string, listingIntent: ListingIntent, subcategory?: string) {
  const categoryMap = TITLE_PLACEHOLDER_MAP[category];
  const fallback =
    listingIntent === "need"
      ? "Post what you need in Fort McMurray"
      : "Create a clear local listing for Fort McMurray";

  if (!categoryMap) {
    return fallback;
  }

  if (subcategory && categoryMap[subcategory]) {
    return categoryMap[subcategory]?.[listingIntent] ?? fallback;
  }

  const examples = Object.values(categoryMap)
    .map((item) => item?.[listingIntent])
    .filter((value): value is string => Boolean(value));

  return examples.length ? getRandomItem(examples) : fallback;
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
  const [price, setPrice] = useState(
    defaults?.priceType === "contact" ? "" : defaults?.price ?? ""
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
  const structuredDefaults = useMemo(() => {
    const raw = defaults?.structuredData;

    if (!raw || typeof raw !== "object") {
      return null;
    }

    return Object.fromEntries(
      Object.entries(raw).filter(([, value]) => value !== null)
    ) as ListingStructuredData;
  }, [defaults?.structuredData]);
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
    () => getTitlePlaceholder(category, listingIntent, subcategory || undefined),
    [category, listingIntent, subcategory]
  );
  const structuredCheckboxFields = useMemo(
    () => structuredFields.filter((field) => field.kind === "checkbox"),
    [structuredFields]
  );
  const structuredInputFields = useMemo(
    () => structuredFields.filter((field) => field.kind !== "checkbox"),
    [structuredFields]
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

  function renderStructuredField(field: (typeof structuredFields)[number]) {
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
            <strong className="listing-structured-checkbox-label">
              <span>{field.label}</span>
              {field.helpText ? <FieldHelp text={field.helpText} label={field.label} /> : null}
            </strong>
          </span>
        </label>
      );
    }

    if (field.kind === "number") {
      return (
        <label key={field.name} className="field">
          <FieldLabelWithHelp label={field.label} helpText={field.helpText} />
          <input
            className="input"
            type="number"
            min={1}
            max={8}
            name={field.name}
            defaultValue={typeof fieldValue === "number" ? String(fieldValue) : ""}
            placeholder="Enter a number"
          />
        </label>
      );
    }

    if (field.kind === "date") {
      return (
        <label key={field.name} className="field">
          <FieldLabelWithHelp label={field.label} helpText={field.helpText} />
          <input
            className="input"
            type="date"
            name={field.name}
            defaultValue={typeof fieldValue === "string" ? fieldValue : ""}
          />
        </label>
      );
    }

    return (
      <label key={field.name} className="field">
        <FieldLabelWithHelp label={field.label} helpText={field.helpText} />
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
      </label>
    );
  }

  return (
    <form action={action} className="form-grid listing-editor-form" onSubmit={handleSubmit}>
      <section className="field-full listing-form-section">
        <div className="listing-form-section-grid">
          <div className="field field-full listing-intent-field">
            <FieldLabelWithHelp
              label="Offer or need"
              helpText="Choose whether you are posting something available right now or asking people to reply with help, a ride, a rental, work, or an item."
            />
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
                  <span className="listing-intent-option-label">
                    <span>{LISTING_INTENT_LABELS[value]}</span>
                    <FieldHelp text={LISTING_INTENT_HELP[value]} label={LISTING_INTENT_LABELS[value]} />
                  </span>
                </label>
              ))}
            </div>
          </div>

          {listingIntent === "need" ? (
            <label className="field">
              <FieldLabelWithHelp
                label="When do you need this?"
                helpText="Choose how urgent the request is so people know whether you need help today, this week, or on a flexible timeline."
              />
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
            <FieldLabelWithHelp
              label="Category"
              helpText="Pick the main section this listing belongs in, like Rentals, Ride Share, Jobs, or Services."
            />
            <select
              className="input"
              name="category"
              value={category}
              onChange={(event) => {
                const nextCategory = event.target.value;
                const nextPriceType = getDefaultPriceType(nextCategory as any);
                setCategory(nextCategory);
                setSubcategory("");
                setPriceType(nextPriceType);
                if (nextPriceType === "contact") {
                  setPrice("");
                }
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
            <FieldLabelWithHelp
              label="Sub-category"
              helpText="Choose the closest fit so the listing shows up in the right filters and search results."
            />
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
            <FieldLabelWithHelp
              label="Title"
              helpText="Keep it specific and local so people can understand the listing at a glance."
            />
            <input
              className="input"
              name="title"
              defaultValue={defaults?.title ?? ""}
              placeholder={titlePlaceholder}
              required
            />
          </label>

          <label className="field">
            <FieldLabelWithHelp
              label={listingIntent === "need" ? "Budget type" : "Price type"}
              helpText={priceTypeHint}
            />
            <select
              className="input"
              name="priceType"
              value={priceType}
              onChange={(event) => {
                const nextPriceType = event.target.value as ListingPriceType;
                setPriceType(nextPriceType);
                if (nextPriceType === "contact") {
                  setPrice("");
                }
              }}
            >
              {Object.entries(LISTING_PRICE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="field listing-price-amount-field">
            <FieldLabelWithHelp
              label={listingIntent === "need" ? "Budget amount" : "Price amount"}
              helpText={
                priceType === "contact"
                  ? "Optional when you want people to reply first before you share a number."
                  : "Enter the amount that matches the pricing style you selected."
              }
            />
              <input
                className="input listing-price-amount-input"
                name="price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              placeholder={priceType === "contact" ? "No amount needed" : "Enter amount"}
                disabled={priceType === "contact"}
              />
            </label>

          <label className="field">
            <FieldLabelWithHelp label="Address" helpText={locationHint} />
            <input
              className="input"
              name="location"
              defaultValue={defaults?.location ?? ""}
              placeholder={locationPlaceholder}
            />
          </label>

          <div className="field listing-address-toggle-field">
            <FieldLabelWithHelp
              label="Map privacy"
              helpText="Choose whether the public map should show the exact address or only the community."
            />
            <label className="business-profile-toggle listing-address-toggle">
              <input
                type="checkbox"
                name="show_exact_address_on_map"
                defaultChecked={defaults?.showExactAddressOnMap ?? false}
              />
              <span>
                <strong className="listing-toggle-title">
                  <span>Show exact address on the map</span>
                  <FieldHelp
                    text="Leave this off to show only the community, like Thickwood, Downtown, or Fort McMurray."
                    label="Show exact address on the map"
                  />
                </strong>
              </span>
            </label>
          </div>
        </div>
      </section>

      <section className="field-full listing-form-section">
        <div className="listing-form-section-head">
          <div>
            <FieldLabelWithHelp label="Description" helpText={descriptionHint} />
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
                <FieldLabelWithHelp
                  label="Category details"
                  helpText="These extra details help your listing show up in the right local filters, especially for rides, rentals, jobs, and services."
                />
              </div>
            </div>

            {structuredInputFields.length ? (
              <div className={`listing-structured-grid${category === "rentals" ? " is-rentals" : ""}`}>
                {structuredInputFields.map((field) => renderStructuredField(field))}
              </div>
            ) : null}

            {structuredCheckboxFields.length ? (
              <div className={`listing-structured-boolean-grid${category === "rentals" ? " is-rentals" : ""}`}>
                {structuredCheckboxFields.map((field) => renderStructuredField(field))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="field-full listing-form-section">
        <div className="listing-form-section-head">
          <div>
            <FieldLabelWithHelp label="Contact details" helpText={contactHint} />
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
            <div className="listing-form-section-grid listing-contact-grid">
              <label className="field listing-contact-field">
                <FieldLabelWithHelp
                  label="Contact or business name"
                  helpText="This is the name people see when they reply. Business accounts can use a business name."
                />
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
              </label>

              <label className="field listing-contact-field">
                <FieldLabelWithHelp
                  label="Reply email"
                  helpText="Replies and message follow-ups will use this email."
                />
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
              </label>

              <label className="field listing-contact-field">
                <FieldLabelWithHelp
                  label="Phone number"
                  helpText="Optional. Add a number if you want calls or texts as part of the reply flow."
                />
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
              </label>
            </div>
          </>
        )}
      </section>

      <section className="field-full listing-form-section">
        <div className="listing-media-panel">
          <div className="listing-media-panel-head">
            <div>
              <FieldLabelWithHelp
                label={listingIntent === "need" ? "Reference photos" : "Listing photos"}
                helpText={photoPanelCopy}
              />
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
                <FieldLabelWithHelp
                  label="Arrange photos"
                  helpText="Use cover, move, or remove to control how the listing appears in browse and on the detail page."
                />
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
