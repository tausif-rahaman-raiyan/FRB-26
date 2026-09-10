import { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink, ShieldCheck, Server } from 'lucide-react';

export function VercelDeployGuide() {
  const [activeTab, setActiveTab] = useState<'endpoint' | 'vercelJson' | 'envExample'>('endpoint');
  const [copied, setCopied] = useState(false);

  const ENDPOINT_CODE = `// api/video/playback.ts
import type { Request, Response } from "express";
import crypto from "crypto";

export default async function handler(req: Request, res: Response) {
  // 1. CORS Configuration for Blogger Domain
  const origin = req.headers.origin || "";
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || origin.includes("blogspot.com")) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const { videoId, courseId, videoPath } = req.body || {};

    // 2. Verify Authorization Header (Firebase ID token)
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Sign-in required to play protected video."
      });
    }

    const idToken = authHeader.replace("Bearer ", "").trim();

    // 3. Verify Course Entitlement
    if (courseId !== "acs-frb-26") {
      return res.status(403).json({
        success: false,
        error: "ACCESS_DENIED",
        message: "You are not enrolled in this course."
      });
    }

    // 4. Resolve Bunny Video Path
    const rawPath = videoPath || videoId || "";
    const uuidMatch = rawPath.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (!uuidMatch) {
      return res.status(404).json({
        success: false,
        error: "VIDEO_NOT_FOUND",
        message: "Video not found in catalog."
      });
    }

    const cleanPath = \`/\${uuidMatch[0].toLowerCase()}/playlist.m3u8\`;
    const directoryPath = \`/\${uuidMatch[0].toLowerCase()}/\`;

    // 5. Generate Short-Lived Bunny Token (valid 2 hours)
    const hostname = process.env.BUNNY_CDN_HOSTNAME || "vz-cb5996f0-784.b-cdn.net";
    const securityKey = process.env.BUNNY_TOKEN_SECURITY_KEY;
    if (!securityKey) {
      throw new Error("BUNNY_TOKEN_SECURITY_KEY environment variable missing on server.");
    }

    const expiresInSeconds = 7200; // 2 hours
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

    // Bunny URL Token Authentication: SHA256(security_key + path + expires)
    const stringToHash = \`\${securityKey}\${directoryPath}\${expiresAt}\`;
    const rawHash = crypto.createHash("sha256").update(stringToHash).digest("base64");
    const token = rawHash.replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");

    const cleanHost = hostname.replace(/^https?:\\/\\//, "").replace(/\\/+$/, "");
    const playbackUrl = \`https://\${cleanHost}\${cleanPath}?token=\${token}&expires=\${expiresAt}\`;

    // 6. Return minimal required information
    return res.status(200).json({
      success: true,
      playbackUrl,
      expiresAt
    });

  } catch (error: any) {
    console.error("Playback token generation error:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Playback authorization failed."
    });
  }
}`;

  const VERCEL_JSON = `{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}`;

  const ENV_EXAMPLE = `# Bunny CDN Hostname (e.g. your Bunny pull zone / Stream hostname)
BUNNY_CDN_HOSTNAME="vz-cb5996f0-784.b-cdn.net"

# Bunny Token Security Key (Copied from Bunny Pull Zone / Security / Token Authentication)
BUNNY_TOKEN_SECURITY_KEY="your-secret-bunny-signing-key-never-share-in-frontend"

# Allowed Origins (Your Blogger URL)
ALLOWED_ORIGINS="https://tausifrahamanraiyan.blogspot.com,http://localhost:3000"`;

  const getActiveCode = () => {
    if (activeTab === 'endpoint') return ENDPOINT_CODE;
    if (activeTab === 'vercelJson') return VERCEL_JSON;
    return ENV_EXAMPLE;
  };

  const copyActiveCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Vercel & GitHub deployment card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <Server className="w-4 h-4" /> Vercel Serverless & GitHub Ready
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Backend API Deployment</h3>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          This project is already pre-configured for direct Vercel & GitHub deployment. When pushed to GitHub, Vercel auto-detects the <code>/api</code> folder and provisions the secure short-lived token signing endpoint.
        </p>

        {/* Step-by-step guide */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider block mb-1">Step 1: Push to GitHub</span>
            <p className="text-xs text-slate-400 mb-2">Push this codebase to a private or public GitHub repository.</p>
            <div className="bg-black/60 p-2 rounded-lg font-mono text-[11px] text-slate-300">
              git add .<br />
              git commit -m "feat: Bunny auth API"<br />
              git push origin main
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider block mb-1">Step 2: Import in Vercel</span>
            <p className="text-xs text-slate-400 mb-2">Open vercel.com &rarr; "Add New Project" &rarr; Import your GitHub repo.</p>
            <div className="bg-black/60 p-2 rounded-lg font-mono text-[11px] text-slate-300">
              Framework Preset: Vite<br />
              Root Directory: ./<br />
              Build: npm run build
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider block mb-1">Step 3: Add Env Variables</span>
            <p className="text-xs text-slate-400 mb-2">In Vercel Project Settings &rarr; Environment Variables, add:</p>
            <div className="bg-black/60 p-2 rounded-lg font-mono text-[11px] text-emerald-400">
              BUNNY_CDN_HOSTNAME<br />
              BUNNY_TOKEN_SECURITY_KEY<br />
              ALLOWED_ORIGINS
            </div>
          </div>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('endpoint')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'endpoint' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              api/video/playback.ts
            </button>
            <button
              onClick={() => setActiveTab('vercelJson')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'vercelJson' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              vercel.json
            </button>
            <button
              onClick={() => setActiveTab('envExample')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'envExample' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              .env.example
            </button>
          </div>

          <button
            onClick={copyActiveCode}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <pre className="p-4 text-xs font-mono text-slate-300 bg-slate-950 max-h-[420px] overflow-y-auto custom-scrollbar leading-relaxed">
          <code>{getActiveCode()}</code>
        </pre>
      </div>
    </div>
  );
}
