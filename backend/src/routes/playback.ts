import { Router } from "express";
import { createBunnyPlaybackUrl } from "../bunny/token.js";
import { hasCourseAccess } from "../courses/entitlement.js";
import { getVideo, isKnownCourse } from "../courses/catalog.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/video/playback", requireAuth, async (req, res) => {
  const { courseId, videoId } = req.body ?? {};

  if (!courseId || !videoId) {
    return res.status(400).json({ success: false, error: "MISSING_FIELDS" });
  }

  if (!isKnownCourse(courseId)) {
    return res.status(404).json({ success: false, error: "COURSE_NOT_FOUND" });
  }

  if (!req.user?.email || !hasCourseAccess(req.user.email, courseId)) {
    return res.status(403).json({ success: false, error: "COURSE_ACCESS_DENIED" });
  }

  const video = getVideo(String(videoId));
  if (!video || video.courseId !== courseId) {
    return res.status(404).json({ success: false, error: "VIDEO_NOT_FOUND_IN_COURSE" });
  }

  if (video.type !== "bunny" || !video.bunnyPath) {
    return res.status(400).json({ success: false, error: "NOT_BUNNY_VIDEO" });
  }

  const tokenized = createBunnyPlaybackUrl(video.bunnyPath);
  return res.json({ success: true, playbackUrl: tokenized.playbackUrl, expiresAt: tokenized.expiresAt });
});

export default router;
