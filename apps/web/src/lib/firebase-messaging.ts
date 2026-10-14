import { getMessaging, isSupported } from "firebase/messaging";
import { getFirebaseApp } from "./firebase";

export async function getFirebaseMessaging() {
  if (typeof window === "undefined" || !window.isSecureContext || !(await isSupported())) {
    return null;
  }
  const app = getFirebaseApp();
  return app ? getMessaging(app) : null;
}
