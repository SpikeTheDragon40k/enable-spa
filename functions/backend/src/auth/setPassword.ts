import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logSecurityEvent } from "../security/securityLog";

const REGION = "europe-west1";

export const setPassword = onCall(
  { region: REGION },
  async (req) => {
    if (!req.auth?.uid) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const uid = req.auth.uid;
    const auth = getAuth();
    const db = getFirestore();

    try {
      const userRecord = await auth.getUser(uid);

      const hasPasswordProvider = userRecord.providerData.some(
        (p) => p.providerId === "password"
      );

      if (!hasPasswordProvider) {
        await logSecurityEvent({
          action: "set_password_failed",
          uid,
          email: userRecord.email,
          reason: "Password provider not linked",
          timestamp: Timestamp.now()
        });
        throw new HttpsError(
          "failed-precondition",
          "Password provider not linked"
        );
      }

      await db.collection("users").doc(uid).update({
        mustSetPassword: false,
        passwordSetAt: Timestamp.now()
      });

      await logSecurityEvent({
        action: "set_password_success",
        uid,
        email: userRecord.email,
        timestamp: Timestamp.now()
      });

      console.log(
        `[setPassword] OK: password set for user ${uid} (${userRecord.email})`
      );
      return { success: true };
    } catch (err) {
      await logSecurityEvent({
        action: "set_password_error",
        uid,
        error: err instanceof Error ? err.message : String(err),
        timestamp: Timestamp.now()
      });
      console.error(`[setPassword] KO:`, err);
      throw err;
    }
  }
);
