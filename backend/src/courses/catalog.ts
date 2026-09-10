import fs from "node:fs";
import path from "node:path";

export interface CourseRecord {
  courseId: string;
  name: string;
  description: string;
}

export interface VideoRecord {
  videoId: string;
  title: string;
  courseId: string;
  subject: string;
  chapter: string;
  order: number;
  type: "bunny" | "youtube";
  url: string;
  bunnyPath: string | null;
}

const repoRoot = path.resolve(process.cwd(), "..");
const coursesPath = path.join(repoRoot, "data", "courses.json");
const videosPath = path.join(repoRoot, "data", "videos.json");

export const courseCatalog: CourseRecord[] = JSON.parse(fs.readFileSync(coursesPath, "utf8"));
export const videoCatalog: VideoRecord[] = JSON.parse(fs.readFileSync(videosPath, "utf8"));

const courseSet = new Set(courseCatalog.map((c) => c.courseId));
const videoById = new Map(videoCatalog.map((v) => [v.videoId, v]));

export function isKnownCourse(courseId: string) {
  return courseSet.has(courseId);
}

export function getVideo(videoId: string) {
  return videoById.get(videoId) || null;
}

export function getCourseVideos(courseId: string) {
  return videoCatalog.filter((video) => video.courseId === courseId);
}
