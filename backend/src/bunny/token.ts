import crypto from "node:crypto";
import { env } from "../config/env.js";

export function createBunnyPlaybackUrl(videoPath: string) {
  const cleanPath = videoPath.startsWith("/") ? videoPath : `/${videoPath}`;
  const expiresAt = Math.floor(Date.now() / 1000) + env.tokenTtlSeconds;
  const firstSegment = cleanPath.split("/").filter(Boolean)[0] || "";
  const pathToSign = firstSegment ? `/${firstSegment}/` : "/";
  const digest = crypto
    .createHash("sha256")
    .update(`${env.bunnySigningKey}${pathToSign}${expiresAt}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const host = env.bunnyHostname.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return {
    playbackUrl: `https://${host}${cleanPath}?token=${digest}&expires=${expiresAt}`,
    expiresAt,
  };
}
