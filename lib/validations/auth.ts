import * as z from "zod"

export const SignUpSchema = z.object({
  displayName: z.string().trim().min(1, "Name is required").max(120),
  email: z.email("Enter a valid email address").trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
})

export const SignInSchema = z.object({
  email: z.email("Enter a valid email address").trim(),
  password: z.string().min(1, "Password is required"),
})

export const MagicLinkSchema = z.object({
  email: z.email("Enter a valid email address").trim(),
})

export const ForgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address").trim(),
})

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
