import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

export const personalProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120, "Full name is too long."),
  phone: optionalString.refine(
    (value) => value === null || value.length >= 7,
    "Enter a valid phone number."
  ),
  address: optionalString
});
