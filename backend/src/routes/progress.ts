import { Router } from "express";
import { hasCourseAccess } from "../courses/entitlement.js";
import { getVideo, isKnownCourse } from "../courses/catalog.js";
import { requireAuth } from "../middleware/auth.js";
import { getProgress, getUserCourseProgress, setProgress } from "../progress/store.js";
import { env } from "../config/env.js";

const router = Router();

router.get("/progress/:courseId/summary", requireAuth, (req, res) => {
  const { courseId } = req.params;
  if (!isKnownCourse(courseId)) return res.status(404).json({ success: false, error: "COURSE_NOT_FOUND" });
  if (!req.user?.email || !hasCourseAccess(req.user.email, courseId)) {
    return res.status(403).json({ success: false, error: "COURSE_ACCESS_DENIED" });
  }

  const records = getUserCourseProgress(req.user.uid, courseId);
  const watchedVideoIds = records.filter((record) => record.completed).map((record) => record.videoId);
  return res.json({ success: true, records, watchedVideoIds });
});

router.get("/progress/:courseId/:videoId", requireAuth, (req, res) => {
  const { courseId, videoId } = req.params;
  if (!isKnownCourse(courseId)) return res.status(404).json({ success: false, error: "COURSE_NOT_FOUND" });
  if (!req.user?.email || !hasCourseAccess(req.user.email, courseId)) {
    return res.status(403).json({ success: false, error: "COURSE_ACCESS_DENIED" });
  }

  const video = getVideo(videoId);
  if (!video || video.courseId !== courseId) {
    return res.status(404).json({ success: false, error: "VIDEO_NOT_FOUND_IN_COURSE" });
  }

  const record = getProgress(req.user.uid, courseId, videoId);
  return res.json({ success: true, record });
});

router.put("/progress/:courseId/:videoId", requireAuth, (req, res) => {
  const { courseId, videoId } = req.params;
  const { position, duration, completed, type } = req.body ?? {};

  if (!isKnownCourse(courseId)) return res.status(404).json({ success: false, error: "COURSE_NOT_FOUND" });
  if (!req.user?.email || !hasCourseAccess(req.user.email, courseId)) {
    return res.status(403).json({ success: false, error: "COURSE_ACCESS_DENIED" });
  }

  const video = getVideo(videoId);
  if (!video || video.courseId !== courseId) {
    return res.status(404).json({ success: false, error: "VIDEO_NOT_FOUND_IN_COURSE" });
  }

  const safeDuration = Number.isFinite(duration) && duration > 0 ? Number(duration) : 0;
  const safePosition = Number.isFinite(position) ? Math.max(0, Math.min(Number(position), safeDuration || Number(position))) : 0;
  const normalizedCompleted = Boolean(completed || (safeDuration > 0 && safePosition / safeDuration >= env.completionThreshold));

  const record = setProgress({
    userId: req.user.uid,
    courseId,
    videoId,
    position: safePosition,
    duration: safeDuration,
    completed: normalizedCompleted,
    type: type === "youtube" ? "youtube" : "bunny",
    updatedAt: new Date().toISOString(),
  });

  return res.json({ success: true, record });
});

export default router;
