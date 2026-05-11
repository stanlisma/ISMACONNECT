import { z } from "zod";

import {
  CATEGORY_OPTIONS,
  DEFAULT_LOCATION,
  LISTING_INTENT_OPTIONS,
  LISTING_PRICE_TYPE_OPTIONS,
  REQUEST_WINDOW_OPTIONS
} from "@/lib/constants";

const optionalString = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

export const listingSchema = z
  .object({
    listingIntent: z.enum(LISTING_INTENT_OPTIONS, {
      errorMap: () => ({ message: "Choose whether this is an offer or a need." })
    }),

    requestWindow: z.preprocess(
      (value) => {
        if (typeof value !== "string") {
          return null;
        }

        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      },
      z.enum(REQUEST_WINDOW_OPTIONS).nullable()
    ),

    category: z.enum(CATEGORY_OPTIONS, {
      errorMap: () => ({ message: "Choose a valid category." })
    }),

    // ✅ NEW
    subcategory: optionalString,

    title: z
      .string()
      .trim()
      .min(6, "Title must be at least 6 characters.")
      .max(120, "Title must be 120 characters or less."),

    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters.")
      .max(3000, "Description must be 3000 characters or less."),

    price: z
      .string()
      .trim()
      .transform((value) => (value ? Number(value) : null))
      .refine((value) => value === null || (!Number.isNaN(value) && value >= 0), {
        message: "Price must be a positive number."
      }),

    priceType: z.enum(LISTING_PRICE_TYPE_OPTIONS, {
      errorMap: () => ({ message: "Choose how this price should be shown." })
    }),

    location: z
      .string()
      .trim()
      .min(2, "Address is required.")
      .max(140, "Address must be 140 characters or less.")
      .default(DEFAULT_LOCATION),

    showExactAddressOnMap: z.preprocess(
      (value) => value === true || value === "true" || value === "on",
      z.boolean()
    ),

    contactName: z
      .string()
      .trim()
      .min(2, "Contact name is required.")
      .max(80, "Contact name must be 80 characters or less."),

    contactEmail: optionalString.refine(
      (value) => value === null || z.string().email().safeParse(value).success,
      "Enter a valid contact email."
    ),

    contactPhone: optionalString.refine(
      (value) => value === null || value.length >= 7,
      "Enter a valid contact phone number."
    ),

    imageUrl: optionalString.refine(
      (value) => value === null || z.string().url().safeParse(value).success,
      "Enter a valid image URL."
    )
  })
  .superRefine((value, context) => {
    if (value.listingIntent === "need" && !value.requestWindow) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requestWindow"],
        message: "Choose when you need this."
      });
    }

    if (value.priceType !== "contact" && value.price === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "Enter an amount or switch the price type to Contact for price."
      });
    }
  })
  .transform((value) => ({
    ...value,
    requestWindow: value.listingIntent === "need" ? value.requestWindow : null,
    showExactAddressOnMap: value.showExactAddressOnMap
  }));
export const flagListingSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Please share a short reason for flagging this listing.")
    .max(280, "Flag reasons must be 280 characters or less.")
});
