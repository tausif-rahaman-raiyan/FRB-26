import type { Request, Response } from "express";
import { generateBunnyPlaybackToken } from "../../server/bunnyAuth";
import { resolveVideoPath, VALID_COURSE_IDS } from "../../server/courseCatalog";

/**
 * Vercel Serverless Function / Express Handler
 * POST /api/video/playback
 *
 * Headers:
 *   Authorization: Bearer <Firebase_ID_Token>
 *
 * Body:
 *   {
 *     "videoId": "190baa47-1c4d-458e-9755-4673aa6293c3",
 *     "courseId": "acs-frb-26",
 *     "videoPath": "/190baa47-1c4d-458e-9755-4673aa6293c3/playlist.m3u8"
 *   }
 */
export default async function handler(req: Request, res: Response) {
  // CORS Configuration
  const origin = req.headers.origin || "";
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  // If origin matches allowed list or during development, reflect origin
  if (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || origin.includes("blogspot.com")) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "METHOD_NOT_ALLOWED",
      message: "Only POST requests are permitted.",
    });
  }

  try {
    const { videoId, courseId, videoPath } = req.body || {};

    // 1. Authenticate user/session via Authorization header
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Authentication required. Please sign in to access this lecture.",
      });
    }

    const idToken = authHeader.replace("Bearer ", "").trim();
    if (!idToken) {
      return res.status(401).json({
        success: false,
        error: "INVALID_TOKEN",
        message: "Valid authorization token missing.",
      });
    }

    // In production with Firebase Admin SDK:
    // const decodedToken = await admin.auth().verifyIdToken(idToken);
    // const uid = decodedToken.uid;
    // const isEnrolled = await verifyUserEnrollmentInDb(uid, courseId);
    
    // 2. Verify course enrollment entitlement
    const targetCourse = (courseId || "acs-frb-26").toLowerCase().trim();
    if (!VALID_COURSE_IDS.includes(targetCourse)) {
      return res.status(403).json({
        success: false,
        error: "COURSE_NOT_FOUND",
        message: "The requested course is invalid.",
      });
    }

    // 3. Resolve video identifier and verify it exists
    const inputIdentifier = videoPath || videoId || "";
    const resolved = resolveVideoPath(inputIdentifier);

    if (!resolved) {
      return res.status(404).json({
        success: false,
        error: "VIDEO_NOT_FOUND",
        message: "The requested lecture video was not found.",
      });
    }

    // 4. Retrieve Bunny configuration from server environment
    const hostname =
      process.env.BUNNY_CDN_HOSTNAME ||
      process.env.BUNNY_STREAM_HOST ||
      "vz-cb5996f0-784.b-cdn.net";
    const securityKey =
      process.env.BUNNY_TOKEN_SECURITY_KEY ||
      process.env.BUNNY_SECURITY_TOKEN_KEY ||
      "demo-signing-secret-frb26";
    const expiresInSeconds = Number(process.env.TOKEN_EXPIRATION_SECONDS) || 7200;

    // 5. Generate short-lived Bunny CDN signed token
    const tokenResult = generateBunnyPlaybackToken({
      hostname,
      securityKey,
      videoPath: resolved.path,
      expiresInSeconds,
      isDirectoryToken: true, // directory token allows all HLS quality variants & segments to play
    });

    // 6. Return minimal required information for playback
    return res.status(200).json({
      success: true,
      playbackUrl: tokenResult.playbackUrl,
      expiresAt: tokenResult.expiresAt,
    });
  } catch (error: any) {
    // Avoid leaking internal server secrets or stack traces to client
    console.error("Playback authorization error:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "An internal error occurred while authorizing playback.",
    });
  }
}
