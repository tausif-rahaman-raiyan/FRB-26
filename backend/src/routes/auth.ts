import { Router } from "express";
import rateLimit from "express-rate-limit";
import { verifyFirebaseIdToken } from "../auth/firebase.js";
import { createSessionToken } from "../auth/session.js";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "TOO_MANY_LOGIN_ATTEMPTS" },
});

router.post("/session/login", loginLimiter, async (req, res) => {
  try {
    const { idToken } = req.body ?? {};
    if (!idToken || typeof idToken !== "string") {
      return res.status(400).json({ success: false, error: "MISSING_ID_TOKEN" });
    }

    const decoded = await verifyFirebaseIdToken(idToken);
    const token = createSessionToken({
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name,
    });

    res.cookie(env.sessionCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: env.sessionCookieSameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.json({ success: true, user: { uid: decoded.uid, email: decoded.email, name: decoded.name } });
  } catch (error: any) {
    return res.status(401).json({ success: false, error: "AUTH_FAILED", message: error?.message });
  }
});

router.post("/session/logout", requireAuth, (_req, res) => {
  res.clearCookie(env.sessionCookieName, { path: "/" });
  return res.json({ success: true });
});

router.get("/session/me", requireAuth, (req, res) => {
  return res.json({ success: true, user: req.user });
});

router.get("/csrf-token", requireAuth, (req, res) => {
  return res.json({ success: true, csrfToken: req.csrfToken?.() || "" });
});

export default router;
