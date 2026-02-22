import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

initializeApp();

const db = getFirestore();
const REGION = "europe-west1";

// Helper: Get user role
async function getUserRole(uid: string): Promise<string> {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) throw new HttpsError("not-found", "User not found");
  const role = userDoc.get("role");
  if (!role) throw new HttpsError("failed-precondition", "Role missing");
  return role;
}

// Attiva volontari
export const activateVolunteers = onCall(
  { region: REGION },
  async (req) => {
    const { auth, data } = req;
    if (!auth) throw new HttpsError("unauthenticated", "Authentication required");
    const uid = auth.uid;
    const role = await getUserRole(uid);
    if (role !== "admin") throw new HttpsError("permission-denied", "Only admins can activate volunteers");

    const { ids } = data;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new HttpsError("invalid-argument", "ids must be a non-empty array");
    }

    const batch = db.batch();
    ids.forEach((volunteerId: string) => {
      const userRef = db.collection("users").doc(volunteerId);
      batch.update(userRef, {
        active: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    return { success: true };
  }
);

// Disattiva volontari
export const deactivateVolunteers = onCall(
  { region: REGION },
  async (req) => {
    const { auth, data } = req;
    if (!auth) throw new HttpsError("unauthenticated", "Authentication required");
    const uid = auth.uid;
    const role = await getUserRole(uid);
    if (role !== "admin") throw new HttpsError("permission-denied", "Only admins can deactivate volunteers");

    const { ids } = data;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new HttpsError("invalid-argument", "ids must be a non-empty array");
    }

    const batch = db.batch();
    ids.forEach((volunteerId: string) => {
      const userRef = db.collection("users").doc(volunteerId);
      batch.update(userRef, {
        active: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    return { success: true };
  }
);
