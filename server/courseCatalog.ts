// Server-side Course & Video Catalog for ACS FRB-26
// This ensures that only legitimate enrolled students can request signed tokens for valid course videos.

export interface VideoEntry {
  id: string; // Video UUID
  path: string; // e.g. "/190baa47-1c4d-458e-9755-4673aa6293c3/playlist.m3u8"
  title: string;
  subject: string;
  chapter: string;
}

export const VALID_COURSE_IDS = ["acs-frb-26", "mystudytracker"];

// List of all legitimate Bunny video UUIDs in ACS FRB-26
export const BUNNY_VIDEO_REGISTRY: Record<string, VideoEntry> = {
  "190baa47-1c4d-458e-9755-4673aa6293c3": {
    id: "190baa47-1c4d-458e-9755-4673aa6293c3",
    path: "/190baa47-1c4d-458e-9755-4673aa6293c3/playlist.m3u8",
    title: "Class 1",
    subject: "Physics 1st Paper",
    chapter: "Chapter 1_ ভৌতজগত ও পরিমাপ",
  },
  "2029ac2a-3771-425b-bc8f-80c68bf3d0b9": {
    id: "2029ac2a-3771-425b-bc8f-80c68bf3d0b9",
    path: "/2029ac2a-3771-425b-bc8f-80c68bf3d0b9/playlist.m3u8",
    title: "Class 1",
    subject: "Physics 1st Paper",
    chapter: "Chapter 2_ ভেক্টর",
  },
  "4f02929f-3ade-4c71-bb32-56d77b070818": {
    id: "4f02929f-3ade-4c71-bb32-56d77b070818",
    path: "/4f02929f-3ade-4c71-bb32-56d77b070818/playlist.m3u8",
    title: "Class 2",
    subject: "Physics 1st Paper",
    chapter: "Chapter 2_ ভেক্টর",
  },
  "d2fab479-c570-4e59-b926-8685acdbb374": {
    id: "d2fab479-c570-4e59-b926-8685acdbb374",
    path: "/d2fab479-c570-4e59-b926-8685acdbb374/playlist.m3u8",
    title: "Class 3",
    subject: "Physics 1st Paper",
    chapter: "Chapter 2_ ভেক্টর",
  },
  // Default path resolver allows any valid UUID format belonging to this course
};

/**
 * Extracts a clean Bunny video UUID from various input formats:
 * - Direct UUID: 190baa47-1c4d-458e-9755-4673aa6293c3
 * - Full path: /190baa47-1c4d-458e-9755-4673aa6293c3/playlist.m3u8
 * - Full URL: https://vz-cb5996f0-784.b-cdn.net/190baa47-1c4d-458e-9755-4673aa6293c3/playlist.m3u8
 */
export function resolveVideoPath(videoInput: string): { uuid: string; path: string } | null {
  if (!videoInput) return null;

  // Check for standard UUID regex
  const uuidMatch = videoInput.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (!uuidMatch) return null;

  const uuid = uuidMatch[0].toLowerCase();
  return {
    uuid,
    path: `/${uuid}/playlist.m3u8`,
  };
}
