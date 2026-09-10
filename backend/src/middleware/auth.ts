import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { readSessionToken, type SessionUser } from "../auth/session.js";

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[env.sessionCookieName];
    if (!token) {
      return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
    }
    req.user = readSessionToken(token);
    next();
  } catch {
    return res.status(401).json({ success: false, error: "INVALID_SESSION" });
  }
}
