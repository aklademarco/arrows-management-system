"use server";

import { z } from "zod";

export type RegistrationState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

const commonEmailTypos: Record<string, string> = {
  "gmal.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",

  "yaho.com": "yahoo.com",
  "yhoo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",

  "hotmal.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmail.con": "hotmail.com",

  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlook.con": "outlook.com",
};

const emailSchema = z
  .email("Enter a valid email address.")
  .max(255, "Email address is too long.")
  .toLowerCase()
  .superRefine((email, ctx) => {
    const [username, domain] = email.split("@");
    const correctedDomain = commonEmailTypos[domain];

    if (correctedDomain) {
      ctx.addIssue({
        code: "custom",
        message: `Did you mean ${username}@${correctedDomain}?`,
      });
    }
  });

const registrationSchema = z
  .object({
    firstName: z.string().trim().min(1, "Enter your first name.").max(100),

    lastName: z.string().trim().min(1, "Enter your last name.").max(100),

    otherNames: z.string().trim().max(150).optional(),

    dateOfBirth: z.string().min(1, "Enter your date of birth."),

    homeAddress: z
      .string()
      .trim()
      .max(300, "Home address is too long.")
      .optional()
      .or(z.literal("")),

    closestLandmark: z
      .string()
      .trim()
      .max(200, "Closest landmark is too long.")
      .optional()
      .or(z.literal("")),

    email: emailSchema,

    phone: z
      .string()
      .trim()
      .max(30, "Enter a shorter phone number.")
      .optional()
      .or(z.literal("")),

    requestedDepartmentId: z
      .uuid("Choose a valid department.")
      .optional()
      .or(z.literal("")),

    password: z
      .string()
      .min(6, "Use at least 6 characters.")
      .max(128, "Password is too long"),
      

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
    dateOfBirth: result.data.dateOfBirth,
    homeAddress: result.data.homeAddress,
    closestLandmark: result.data.closestLandmark,
    email: result.data.email,
    phone: result.data.phone,
    requestedDepartmentId: result.data.requestedDepartmentId,
    password: result.data.password,
  };

  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";

  try {
    const response = await fetch(`${apiUrl}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        phone: payload.phone || undefined,
        otherNames: payload.otherNames || undefined,
        homeAddress: payload.homeAddress || undefined,
        closestLandmark: payload.closestLandmark || undefined,
        requestedDepartmentId: payload.requestedDepartmentId || undefined,
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
      message:
        "The registration service is unavailable. Please try again shortly.",
    };
  }
}
