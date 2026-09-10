import crypto from "crypto";

export interface BunnyTokenOptions {
  securityKey: string;
  hostname: string;
  videoPath: string; // e.g. "/190baa47-1c4d-458e-9755-4673aa6293c3/playlist.m3u8"
  expiresInSeconds?: number; // default: 7200 (2 hours)
  userIp?: string;
  isDirectoryToken?: boolean; // signs the directory prefix e.g. "/190baa47-1c4d-458e-9755-4673aa6293c3/"
}

export interface BunnyTokenResult {
  playbackUrl: string;
  expiresAt: number;
  token: string;
  videoPath: string;
}

/**
 * Generates a short-lived signed Bunny CDN tokenized URL.
 * Follows Bunny CDN URL Token Authentication specification:
 * Hash = Base64Url(SHA256(securityKey + path + expires + (ip || "")))
 */
export function generateBunnyPlaybackToken(options: BunnyTokenOptions): BunnyTokenResult {
  const {
    securityKey,
    hostname,
    videoPath,
    expiresInSeconds = 7200,
    userIp = "",
    isDirectoryToken = false,
  } = options;

  if (!securityKey) {
    throw new Error("BUNNY_TOKEN_SECURITY_KEY is not configured on the server.");
  }

  // Ensure leading slash
  let cleanPath = videoPath.trim();
  if (!cleanPath.startsWith("/")) {
    cleanPath = "/" + cleanPath;
  }

  // Unix expiration timestamp in seconds
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // If directory token is desired (allows sub-playlists and .ts segments to inherit authorization)
  let pathToSign = cleanPath;
  if (isDirectoryToken) {
    const parts = cleanPath.split("/").filter(Boolean);
    pathToSign = parts.length > 0 ? `/${parts[0]}/` : "/";
  }

  // Bunny Token Authentication algorithm: SHA256(key + path + expires + [ip])
  const stringToHash = `${securityKey}${pathToSign}${expiresAt}${userIp}`;
  const rawHash = crypto.createHash("sha256").update(stringToHash).digest("base64");

  // Convert to URL-safe Base64: + -> -, / -> _, remove trailing =
  const token = rawHash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  // Clean hostname (remove https:// or trailing slashes if present)
  const cleanHost = hostname.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  // Construct short-lived playback URL with query parameters
  const playbackUrl = `https://${cleanHost}${cleanPath}?token=${token}&expires=${expiresAt}`;

  return {
    playbackUrl,
    expiresAt,
    token,
    videoPath: cleanPath,
  };
}
