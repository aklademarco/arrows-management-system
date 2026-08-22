export type CheckInResult = {
  success: boolean;
  message: string;
  status?: string;
  distanceMeters?: number;
};

/**
 * Shared check-in submission used by the member and leader portals.
 * Each portal supplies the bearer token from its own session cookie.
 */
export async function performCheckIn(
  token: string | undefined,
  eventId: string,
  latitude: number,
  longitude: number,
  accuracyMeters: number,
): Promise<CheckInResult> {
  if (!token)
    return { success: false, message: "Your session has expired. Sign in again." };
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  try {
    const response = await fetch(`${apiUrl}/attendance/check-in`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, latitude, longitude, accuracyMeters }),
      cache: "no-store",
    });
    const body = (await response.json()) as {
      message?: string;
      data?: { status: string; distanceMeters: number };
      details?: {
        accuracyMeters?: number;
        maximumAccuracyMeters?: number;
      };
      error?: { message?: string };
    };
    const failureMessage =
      body.details?.accuracyMeters !== undefined &&
      body.details.maximumAccuracyMeters !== undefined
        ? `Location accuracy is ${body.details.accuracyMeters.toFixed(1)} m; ${body.details.maximumAccuracyMeters} m or better is required.`
        : body.message ?? body.error?.message ?? "Check-in could not be completed.";
    return response.ok && body.data
      ? { success: true, message: body.message ?? "Attendance recorded.", status: body.data.status, distanceMeters: body.data.distanceMeters }
      : { success: false, message: failureMessage };
  } catch {
    return { success: false, message: "The attendance service is unavailable." };
  }
}

export type CheckInAction = (
  eventId: string,
  latitude: number,
  longitude: number,
  accuracyMeters: number,
) => Promise<CheckInResult>;
