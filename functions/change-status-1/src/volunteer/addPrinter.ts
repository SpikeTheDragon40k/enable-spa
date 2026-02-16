import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

initializeApp();

const db = getFirestore();
const REGION = "europe-west1";

// Types based on volunteerData.ts

interface VolunteerPrinter {
  id?: string;
  brand: string;
  model: string;
  buildVolumeX?: number;
  buildVolumeY?: number;
  buildVolumeZ?: number;
  multiMaterial?: boolean;
  flexibleSupported?: boolean;
  directDrive?: boolean;
  notes?: string;
  active?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

// Helper: Get user role
async function getUserRole(uid: string): Promise<string> {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) throw new HttpsError("not-found", "User not found");
  const role = userDoc.get("role");
  if (!role) throw new HttpsError("failed-precondition", "Role missing");
  return role;
}

// 2️⃣ addPrinter
export const addPrinter = onCall(
  { region: REGION },
  async (req) => {
    const { auth, data } = req;
    if (!auth) throw new HttpsError("unauthenticated", "Authentication required");
    const uid = auth.uid;
    const role = await getUserRole(uid);
    if (role !== "volunteer") throw new HttpsError("permission-denied", "Only volunteers can add printers");

    const requiredFields: Array<keyof VolunteerPrinter> = ["brand", "model"];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        throw new HttpsError("invalid-argument", `Missing required field: ${field}`);
      }
    }

    const printerData: VolunteerPrinter = {
      brand: data.brand,
      model: data.model,
      buildVolumeX: data.buildVolumeX,
      buildVolumeY: data.buildVolumeY,
      buildVolumeZ: data.buildVolumeZ,
      multiMaterial: data.multiMaterial,
      flexibleSupported: data.flexibleSupported,
      directDrive: data.directDrive,
      notes: data.notes || "",
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const printersRef = db.collection("users").doc(uid).collection("printers");
    const printerDoc = await printersRef.add(printerData);

    return { printerId: printerDoc.id };
  }
);
