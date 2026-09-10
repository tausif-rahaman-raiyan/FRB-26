export interface ProgressRecord {
  userId: string;
  courseId: string;
  videoId: string;
  position: number;
  duration: number;
  completed: boolean;
  type: "bunny" | "youtube";
  updatedAt: string;
}

const progressMap = new Map<string, ProgressRecord>();

function key(userId: string, courseId: string, videoId: string) {
  return `${userId}::${courseId}::${videoId}`;
}

export function getProgress(userId: string, courseId: string, videoId: string) {
  return progressMap.get(key(userId, courseId, videoId)) || null;
}

export function setProgress(record: ProgressRecord) {
  progressMap.set(key(record.userId, record.courseId, record.videoId), record);
  return record;
}

export function getUserCourseProgress(userId: string, courseId: string) {
  const values: ProgressRecord[] = [];
  for (const value of progressMap.values()) {
    if (value.userId === userId && value.courseId === courseId) values.push(value);
  }
  return values;
}
