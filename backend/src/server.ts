import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import playbackRoutes from "./routes/playback.js";
import progressRoutes from "./routes/progress.js";
import courseRoutes from "./routes/courses.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.frontendOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    service: "frb-26-backend",
    bunnyConfigured: Boolean(env.bunnyHostname && env.bunnySigningKey),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", courseRoutes);
app.use("/api", playbackRoutes);
app.use("/api", progressRoutes);

app.listen(env.port, () => {
  console.log(`FRB-26 backend running on http://localhost:${env.port}`);
});
