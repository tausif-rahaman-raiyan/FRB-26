import type { PlaybackAuthResponse } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const COURSE_ID = import.meta.env.VITE_COURSE_ID || "acs-frb-26";

export function getCourseId() {
  return COURSE_ID;
}

async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function loginWithFirebaseIdToken(idToken: string) {
  const res = await fetch(`${API_BASE}/api/auth/session/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error("Failed to create secure backend session.");
}

export async function logoutBackendSession() {
  await fetch(`${API_BASE}/api/auth/session/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function requestPlaybackAuthorization(videoId: string, courseId = COURSE_ID): Promise<PlaybackAuthResponse> {
  const res = await fetch(`${API_BASE}/api/video/playback`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courseId, videoId }),
  });
  const data = await parseJsonSafe<PlaybackAuthResponse>(res);
  if (!res.ok || !data?.success || !data.playbackUrl) {
    throw new Error(data?.message || data?.error || "Unable to authorize playback.");
  }
  return data;
}

export interface VideoProgressRecord {
  position: number;
  duration: number;
  completed: boolean;
  type: "bunny" | "youtube";
  updatedAt: string;
}

export async function loadCourseProgressSummary(courseId = COURSE_ID) {
  const res = await fetch(`${API_BASE}/api/progress/${courseId}/summary`, { credentials: "include" });
  const data = await parseJsonSafe<{ success: boolean; watchedVideoIds?: string[] }>(res);
  if (!res.ok || !data?.success) return [];
  return data.watchedVideoIds || [];
}

export async function loadVideoProgress(videoId: string, courseId = COURSE_ID): Promise<VideoProgressRecord | null> {
  const res = await fetch(`${API_BASE}/api/progress/${courseId}/${videoId}`, { credentials: "include" });
  const data = await parseJsonSafe<{ success: boolean; record?: VideoProgressRecord | null }>(res);
  if (!res.ok || !data?.success) return null;
  return data.record || null;
}

export async function saveVideoProgress(params: {
  videoId: string;
  type: "bunny" | "youtube";
  position: number;
  duration: number;
  completed?: boolean;
  courseId?: string;
}) {
  const { videoId, type, position, duration, completed = false, courseId = COURSE_ID } = params;
  await fetch(`${API_BASE}/api/progress/${courseId}/${videoId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, position, duration, completed }),
  });
}
