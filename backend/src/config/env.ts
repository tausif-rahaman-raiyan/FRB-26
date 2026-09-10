import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT || 4000),
  frontendOrigins: (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean),
  sessionCookieName: process.env.SESSION_COOKIE_NAME || "frb26_session",
  sessionCookieSameSite: (process.env.SESSION_COOKIE_SAMESITE || "lax") as "lax" | "strict" | "none",
  sessionSecret: required("AUTH_SECRET"),
  bunnyHostname: required("BUNNY_HOSTNAME"),
  bunnySigningKey: required("BUNNY_SIGNING_KEY"),
  bunnyLibraryId: process.env.BUNNY_LIBRARY_ID || "",
  tokenTtlSeconds: Number(process.env.BUNNY_TOKEN_TTL_SECONDS || 900),
  completionThreshold: Number(process.env.COMPLETION_THRESHOLD || 0.9),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
  firebasePrivateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  allowedEmails: (process.env.ENROLLED_EMAILS || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean),
};
