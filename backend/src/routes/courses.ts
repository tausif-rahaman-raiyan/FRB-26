import { Router } from "express";
import { courseCatalog, getCourseVideos } from "../courses/catalog.js";

const router = Router();

router.get("/courses", (_req, res) => {
  return res.json({ success: true, courses: courseCatalog });
});

router.get("/courses/:courseId/videos", (req, res) => {
  const { courseId } = req.params;
  return res.json({ success: true, videos: getCourseVideos(courseId) });
});

export default router;
