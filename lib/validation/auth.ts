import { z } from "zod";

const phoneVerificationMethodSchema = z.enum(["text", "call"], {
  errorMap: () => ({ message: "Choose whether to verify your phone by text or voice call." })
});

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const signUpSchema = z
  .object({
    firstName: z.string().trim().min(2, "Enter your first name.").max(40, "First name is too long."),
    lastName: z.string().trim().min(2, "Enter your last name.").max(40, "Last name is too long."),
    email: z.string().trim().email("Enter a valid email address."),
    confirmEmail: z.string().trim().email("Enter a valid confirmation email."),
    phone: z
      .string()
      .trim()
      .refine((value) => value.replace(/\D/g, "").length >= 10, "Enter a valid phone number."),
    address: z.string().trim().min(6, "Enter your address or community.").max(140, "Address is too long."),
    phoneVerificationMethod: phoneVerificationMethodSchema,
    verifyAccount: z.enum(["on"]).optional(),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password.")
  })
  .superRefine((value, context) => {
    if (value.email.toLowerCase() !== value.confirmEmail.toLowerCase()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmEmail"],
        message: "Email addresses do not match."
      });
    }

    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match."
      });
    }
  });
