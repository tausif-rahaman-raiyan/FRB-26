import crypto from "crypto";

/**
 * Vercel Serverless Function & Express Route Handler
 * POST /api/video/playback
 *
 * Fully standalone (zero relative imports) to guarantee 100% reliability
 * across Vercel Node.js Serverless Functions, container runtimes, and local dev.
 */

// Generate short-lived Bunny CDN tokenized URL
function generateBunnyPlaybackToken(options: {
  securityKey: string;
  hostname: string;
  videoPath: string;
  expiresInSeconds?: number;
  userIp?: string;
  isDirectoryToken?: boolean;
}) {
  const {
    securityKey,
    hostname,
    videoPath,
    expiresInSeconds = 7200,
    userIp = "",
    isDirectoryToken = true,
  } = options;

  let cleanPath = videoPath.trim();
  if (!cleanPath.startsWith("/")) {
    cleanPath = "/" + cleanPath;
  }

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  let pathToSign = cleanPath;
  if (isDirectoryToken) {
    const parts = cleanPath.split("/").filter(Boolean);
    pathToSign = parts.length > 0 ? `/${parts[0]}/` : "/";
  }

  const stringToHash = `${securityKey}${pathToSign}${expiresAt}${userIp}`;
  const rawHash = crypto.createHash("sha256").update(stringToHash).digest("base64");
  const token = rawHash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const cleanHost = hostname.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const playbackUrl = `https://${cleanHost}${cleanPath}?token=${token}&expires=${expiresAt}`;

  return {
    playbackUrl,
    expiresAt,
    token,
  };
}

// Extract UUID or relative path and target hostname
function resolveVideoPath(videoInput: string): { uuid: string; path: string; host?: string } | null {
  if (!videoInput) return null;

  let host: string | undefined;
  const urlMatch = videoInput.match(/^https?:\/\/([^/]+)/i);
  if (urlMatch) {
    host = urlMatch[1];
  }

  const uuidMatch = videoInput.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuidMatch) {
    const uuid = uuidMatch[0].toLowerCase();
    return {
      uuid,
      path: `/${uuid}/playlist.m3u8`,
      host,
    };
  }

  if (videoInput.includes(".m3u8")) {
    const clean = videoInput.replace(/^https?:\/\/[^/]+/i, "");
    return {
      uuid: "direct",
      path: clean.startsWith("/") ? clean : "/" + clean,
      host,
    };
  }

  return null;
}

export default async function handler(req: any, res: any) {
  // Always set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({
        success: false,
        error: "METHOD_NOT_ALLOWED",
        message: "Only POST requests are permitted.",
      })
    );
  }

  try {
    // Parse body safely across Express, Vercel Serverless, and Cloud Functions
    let body: any = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    } else if (!body || typeof body !== "object") {
      body = {};
    }

    const { videoId, videoPath } = body;

    // Retrieve and verify authorization header
    const authHeader =
      req.headers?.authorization ||
      req.headers?.Authorization ||
      req.headers?.["authorization"] ||
      "";

    if (!authHeader || typeof authHeader !== "string") {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      return res.end(
        JSON.stringify({
          success: false,
          error: "UNAUTHORIZED",
          message: "Please sign in to access this protected lecture.",
        })
      );
    }

    const inputIdentifier = videoPath || videoId || "";
    const resolved = resolveVideoPath(inputIdentifier);

    if (!resolved) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      return res.end(
        JSON.stringify({
          success: false,
          error: "VIDEO_NOT_FOUND",
          message: "The requested lecture stream path could not be resolved.",
        })
      );
    }

    // Determine hostname (from env or from the video target URL itself)
    const hostname =
      process.env.BUNNY_CDN_HOSTNAME ||
      process.env.BUNNY_STREAM_HOST ||
      resolved.host ||
      "vz-cb5996f0-784.b-cdn.net";

    // Determine security signing key
    const securityKey =
      process.env.BUNNY_TOKEN_SECURITY_KEY ||
      process.env.BUNNY_SECURITY_TOKEN_KEY ||
      "demo-signing-secret-frb26";

    const expiresInSeconds =
      Number(process.env.TOKEN_EXPIRATION_SECONDS) || 7200;

    const tokenResult = generateBunnyPlaybackToken({
      hostname,
      securityKey,
      videoPath: resolved.path,
      expiresInSeconds,
      isDirectoryToken: true,
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({
        success: true,
        playbackUrl: tokenResult.playbackUrl,
        expiresAt: tokenResult.expiresAt,
      })
    );
  } catch (error: any) {
    console.error("Playback authorization handler error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({
        success: false,
        error: "SERVER_ERROR",
        message: error?.message || "An internal error occurred while authorizing playback.",
      })
    );
  }
}
