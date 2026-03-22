import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

export const createShipmentRequest = onCall(
  {region: "europe-west1"},
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const {
      reason,
      senderName,
      senderAddress,
      senderNotes,
      recipientName,
      recipientAddress,
      recipientPhone,
      deliveryNotes,
      length,
      width,
      height,
      weight,
    } = request.data;

    if (!reason || !senderName || !senderAddress || !recipientName || !recipientAddress) {
      throw new HttpsError("invalid-argument", "Missing required fields");
    }

    const db = getFirestore();
    const now = FieldValue.serverTimestamp();

    const payload: Record<string, unknown> = {
      createdAt: now,
      updatedAt: now,
      createdBy: uid,
      email: request.auth?.token?.email ?? null,
      reason,
      senderName,
      senderAddress,
      recipientName,
      recipientAddress,
      status: "pending",
    };

    if (senderNotes !== undefined && senderNotes !== "") payload.senderNotes = senderNotes;
    if (recipientPhone !== undefined && recipientPhone !== "") payload.recipientPhone = recipientPhone;
    if (deliveryNotes !== undefined && deliveryNotes !== "") payload.deliveryNotes = deliveryNotes;
    if (length !== undefined && length !== null) payload.length = length;
    if (width !== undefined && width !== null) payload.width = width;
    if (height !== undefined && height !== null) payload.height = height;
    if (weight !== undefined && weight !== null) payload.weight = weight;

    const docRef = await db.collection("shipmentRequests").add(payload);

    return {success: true, id: docRef.id};
  }
);

export const approveShipmentRequest = onCall(
  {region: "europe-west1"},
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const {requestId} = request.data;
    if (!requestId) {
      throw new HttpsError("invalid-argument", "Missing requestId");
    }

    const db = getFirestore();

    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists || userSnap.data()?.role !== "admin") {
      throw new HttpsError("permission-denied", "Admin role required");
    }

    const ref = db.collection("shipmentRequests").doc(requestId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Request not found");
    }

    await ref.update({
      status: "approved",
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {success: true};
  }
);

export const deleteShipmentRequest = onCall(
  {region: "europe-west1"},
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const {requestId} = request.data;
    if (!requestId) {
      throw new HttpsError("invalid-argument", "Missing requestId");
    }

    const db = getFirestore();

    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      throw new HttpsError("permission-denied", "User not found");
    }
    const role = userSnap.data()?.role;

    const ref = db.collection("shipmentRequests").doc(requestId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Request not found");
    }

    const data = snap.data()!;

    if (role !== "admin") {
      if (data.createdBy !== uid) {
        throw new HttpsError("permission-denied", "Cannot delete another user's request");
      }
      if (data.status !== "pending") {
        throw new HttpsError("permission-denied", "Can only delete pending requests");
      }
    }

    await ref.update({
      status: "deleted",
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {success: true};
  }
);
