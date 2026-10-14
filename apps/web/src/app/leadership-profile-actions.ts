"use server";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export type ProfileWorkspace = "leader" | "pastor";

const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  otherNames: z.string().trim().max(150).nullable(),
  dateOfBirth: z.string().min(1, "Enter your date of birth."),
  homeAddress: z.string().trim().max(300).nullable(),
  closestLandmark: z.string().trim().max(200).nullable(),
  phone: z.string().trim().max(30).nullable(),
  directoryBio: z.string().trim().max(300).nullable(),
  directoryVisible: z.boolean(),
  directoryPhoneVisible: z.boolean(),
  skills: z.array(z.string().trim().min(1).max(40)).max(12),
});

function getSessionCookie(workspace: ProfileWorkspace) {
  return workspace === "pastor" ? "acms_pastor_session" : "acms_leader_session";
}

function getProfilePath(workspace: ProfileWorkspace) {
  return `/${workspace}/profile`;
}

async function getSessionToken(workspace: ProfileWorkspace) {
  const token = (await cookies()).get(getSessionCookie(workspace))?.value;

  if (!token) {
    redirect("/login");
  }

  return token;
}

export async function updateLeadershipProfile(
  workspace: ProfileWorkspace,
  formData: FormData,
) {
  const optionalValue = (name: string) => {
    const value = String(formData.get(name) ?? "").trim();

    return value || null;
  };

  const result = profileSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    otherNames: optionalValue("otherNames"),
    dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    homeAddress: optionalValue("homeAddress"),
    closestLandmark: optionalValue("closestLandmark"),
    phone: optionalValue("phone"),
    directoryBio: optionalValue("directoryBio"),

    directoryVisible: formData.get("directoryVisible") === "on",

    directoryPhoneVisible: formData.get("directoryPhoneVisible") === "on",

    skills: String(formData.get("skills") ?? "")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean),
  });

  if (!result.success) {
    throw new Error(
      result.error.issues[0]?.message ?? "Check the profile details.",
    );
  }

  const token = await getSessionToken(workspace);

  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";

  const response = await fetch(`${apiUrl}/members/me`, {
    method: "PATCH",

    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },

    body: JSON.stringify(result.data),

    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    redirect("/login");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;

    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : body?.message;

    throw new Error(message ?? "Your profile could not be updated.");
  }

  revalidatePath(`/${workspace}`, "layout");
  revalidatePath(getProfilePath(workspace));

  redirect(`${getProfilePath(workspace)}?updated=1`);
}

export async function uploadLeadershipPhoto(
  workspace: ProfileWorkspace,
  imageData: string,
) {
  const token = await getSessionToken(workspace);

  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";

  const match =
    /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
      imageData,
    );

  if (!match || Buffer.byteLength(match[2], "base64") > 5_000_000) {
    throw new Error("Choose a JPEG, PNG, or WebP image no larger than 5 MB.");
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  const apiKey = process.env.CLOUDINARY_API_KEY;

  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary photo storage is not configured.");
  }

  const profileResponse = await fetch(`${apiUrl}/members/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!profileResponse.ok) {
    throw new Error("Your profile could not be loaded.");
  }

  const profileBody = (await profileResponse.json()) as {
    data: {
      id: string;
    };
  };

  const folder = "acms/members";

  const publicId = `${profileBody.data.id}-profile`;

  const timestamp = Math.floor(Date.now() / 1000);

  const signature = createHash("sha1")
    .update(
      `folder=${folder}&overwrite=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`,
    )
    .digest("hex");

  const form = new FormData();

  form.set("file", imageData);
  form.set("api_key", apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);
  form.set("folder", folder);
  form.set("public_id", publicId);
  form.set("overwrite", "true");

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: form,
    },
  );

  const uploaded = (await uploadResponse.json().catch(() => null)) as {
    secure_url?: string;
    error?: {
      message?: string;
    };
  } | null;

  if (!uploadResponse.ok || !uploaded?.secure_url) {
    throw new Error(uploaded?.error?.message ?? "Photo could not be uploaded.");
  }

  const response = await fetch(`${apiUrl}/members/me/profile-photo`, {
    method: "PATCH",

    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      profilePhotoUrl: uploaded.secure_url,
    }),

    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Profile photo could not be saved.");
  }

  revalidatePath(`/${workspace}`, "layout");
  revalidatePath(`/${workspace}/profile`);

  return uploaded.secure_url;
}

export async function removeLeadershipPhoto(workspace: ProfileWorkspace) {
  const token = await getSessionToken(workspace);

  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";

  const profileResponse = await fetch(`${apiUrl}/members/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!profileResponse.ok) {
    throw new Error("Your profile could not be loaded.");
  }

  const profileBody = (await profileResponse.json()) as {
    data: {
      id: string;
    };
  };

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  const apiKey = process.env.CLOUDINARY_API_KEY;

  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary photo storage is not configured.");
  }

  const publicId = `acms/members/${profileBody.data.id}-profile`;

  const timestamp = Math.floor(Date.now() / 1000);

  const signature = createHash("sha1")
    .update(
      `invalidate=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`,
    )
    .digest("hex");

  const form = new FormData();

  form.set("public_id", publicId);
  form.set("api_key", apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);
  form.set("invalidate", "true");

  const destroyResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: "POST",
      body: form,
    },
  );

  if (!destroyResponse.ok) {
    throw new Error("The profile photo could not be removed.");
  }

  const response = await fetch(`${apiUrl}/members/me/profile-photo`, {
    method: "PATCH",

    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      profilePhotoUrl: null,
    }),

    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("The saved profile photo could not be removed.");
  }

  revalidatePath(`/${workspace}`, "layout");
  revalidatePath(`/${workspace}/profile`);
}