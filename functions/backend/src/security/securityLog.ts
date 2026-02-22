import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export async function logSecurityEvent(data: any) {
  await db.collection("securityLogs").add({
    ...data,
    timestamp: new Date(),
  });
}
