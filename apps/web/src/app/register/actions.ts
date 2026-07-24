"use server";

import { z } from "zod";

export type RegistrationState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

const registrationSchema = z
  .object({
    firstName: z.string().trim().min(1, "Enter your first name.").max(100),
    lastName: z.string().trim().min(1, "Enter your last name.").max(100),
    otherNames: z.string().trim().max(150).optional(),
    email: z.email("Enter a valid email address.").toLowerCase(),
    phone: z
      .string()
      .trim()
      .regex(/^\+[1-9]\d{7,14}$/, "Use international format, such as +233240000000.")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(12, "Use at least 12 characters.")
      .max(128)
      .regex(/[a-z]/, "Add a lowercase letter.")
      .regex(/[A-Z]/, "Add an uppercase letter.")
      .regex(/\d/, "Add a number.")
      .regex(/[^A-Za-z0-9]/, "Add a special character."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export async function register(
  _previousState: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const result = registrationSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  const payload = {
    firstName: result.data.firstName,
    lastName: result.data.lastName,
    otherNames: result.data.otherNames,
    email: result.data.email,
    phone: result.data.phone,
    password: result.data.password,
  };
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";

  try {
    const response = await fetch(`${apiUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        phone: payload.phone || undefined,
        otherNames: payload.otherNames || undefined,
      }),
      cache: "no-store",
    });
    const body = (await response.json()) as { message?: string };

    return response.ok
      ? {
          success: true,
          message: body.message ?? "Your registration was received.",
        }
      : {
          success: false,
          message: body.message ?? "Registration could not be completed.",
        };
  } catch {
    return {
      success: false,
      message: "The registration service is unavailable. Please try again shortly.",
    };
  }
}
