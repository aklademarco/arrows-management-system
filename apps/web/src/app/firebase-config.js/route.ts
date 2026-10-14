import { firebaseConfig, isFirebaseConfigured } from "@/lib/firebase";

export function GET() {
  if (!isFirebaseConfigured()) {
    return new Response("Push notifications are not configured.", { status: 503 });
  }
  // Firebase web configuration is public; never include service-account credentials.
  return new Response(`self.ACMS_FIREBASE_CONFIG = ${JSON.stringify(firebaseConfig)};`, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
