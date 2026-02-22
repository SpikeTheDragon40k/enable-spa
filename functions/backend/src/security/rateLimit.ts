import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import crypto from "crypto";

const db = getFirestore();

const EMAIL_WINDOW = 5 * 60 * 1000; // 5 min
const IP_WINDOW = 60 * 60 * 1000;   // 1 ora
const MAX_IP_REQUESTS = 3;

export async function checkEmailRateLimit(email: string) {
  const ref = db.collection("rateLimits").doc(`email_${email}`);
  const now = Date.now();

  const snap = await ref.get();

  if (snap.exists && now - snap.data()!.lastRequest < EMAIL_WINDOW) {
    throw new HttpsError("resource-exhausted", "Too many email requests");
  }

  await ref.set({ lastRequest: now });
}

export async function checkIpRateLimit(ip: string) {
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
  const ref = db.collection("rateLimits").doc(`ip_${ipHash}`);
  const now = Date.now();

  const snap = await ref.get();

  if (snap.exists) {
    const data = snap.data()!;
    if (now - data.windowStart < IP_WINDOW && data.count >= MAX_IP_REQUESTS) {
      throw new HttpsError("resource-exhausted", "Too many requests from this IP");
    }

    if (now - data.windowStart < IP_WINDOW) {
      await ref.update({ count: data.count + 1 });
      return;
    }
  }

  await ref.set({
    windowStart: now,
    count: 1,
  });
}
