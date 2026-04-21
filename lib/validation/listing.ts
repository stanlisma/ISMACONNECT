import { z } from "zod";

import { CATEGORY_OPTIONS, DEFAULT_LOCATION } from "@/lib/constants";

const optionalString = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

export const listingSchema = z
  .object({
    category: z.enum(CATEGORY_OPTIONS, {
      errorMap: () => ({ message: "Choose a valid category." })
    }),
    title: z
      .string()
      .trim()
      .min(6, "Title must be at least 6 characters.")
      .max(120, "Title must be 120 characters or less."),
    description: z
      .string()
      .trim()
      .min(30, "Description must be at least 30 characters.")
      .max(3000, "Description must be 3000 characters or less."),
    price: z
      .string()
      .trim()
      .transform((value) => (value ? Number(value) : null))
      .refine((value) => value === null || (!Number.isNaN(value) && value >= 0), {
        message: "Price must be a positive number."
      }),
    location: z
      .string()
      .trim()
      .min(2, "Location is required.")
      .max(80, "Location must be 80 characters or less.")
      .default(DEFAULT_LOCATION),
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
  .refine((value) => value.contactEmail || value.contactPhone, {
    message: "Add at least one contact method: email or phone.",
    path: ["contactEmail"]
  });

export const flagListingSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Please share a short reason for flagging this listing.")
    .max(280, "Flag reasons must be 280 characters or less.")
});
