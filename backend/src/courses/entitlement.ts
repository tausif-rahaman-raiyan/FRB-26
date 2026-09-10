import { env } from "../config/env.js";

export function hasCourseAccess(email: string, _courseId: string) {
  if (!env.allowedEmails.length) return true;
  return env.allowedEmails.includes(email.toLowerCase());
}
