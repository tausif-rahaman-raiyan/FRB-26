import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface SessionUser {
  uid: string;
  email: string;
  name?: string;
}

export function createSessionToken(user: SessionUser) {
  return jwt.sign(user, env.sessionSecret, { expiresIn: "7d" });
}

export function readSessionToken(token: string): SessionUser {
  return jwt.verify(token, env.sessionSecret) as SessionUser;
}
