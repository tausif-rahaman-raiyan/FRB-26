import admin from "firebase-admin";
import { env } from "../config/env.js";

let initialized = false;

function initializeFirebaseAdmin() {
  if (initialized) return;
  if (!env.firebaseProjectId || !env.firebaseClientEmail || !env.firebasePrivateKey) {
    initialized = true;
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey,
    }),
  });
  initialized = true;
}

export async function verifyFirebaseIdToken(idToken: string) {
  initializeFirebaseAdmin();
  if (!admin.apps.length) {
    throw new Error("Firebase Admin is not configured on the backend environment.");
  }
  return admin.auth().verifyIdToken(idToken, true);
}
