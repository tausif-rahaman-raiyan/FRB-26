import { useEffect, useId, useRef, useState } from "react";
import Hls from "hls.js";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import { AlertCircle, Lock, LogIn, RefreshCw } from "lucide-react";
import type { FlatVideoItem } from "../types";
import { cleanUrl, getVideoId } from "../data/lectureData";
import { getCourseId, loadVideoProgress, requestPlaybackAuthorization, saveVideoProgress } from "../services/backendApi";
import type { User } from "../firebase";

interface UniversalPlayerProps {
  key?: string;
  video: FlatVideoItem | null;
  user: User | null;
  onMarkWatched: (videoId: string) => void;
  onRequireLogin: () => void;
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function UniversalPlayer({ video, user, onMarkWatched, onRequireLogin }: UniversalPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const plyrRef = useRef<Plyr | null>(null);
  const ytRef = useRef<any>(null);
  const ytContainerId = useId().replace(/:/g, "_");
  const retryRef = useRef(0);
  const saveTickRef = useRef(0);

  const [ytReady, setYtReady] = useState(false);
  const [state, setState] = useState<{ loading: boolean; error: string | null; code: string | null }>({
    loading: false,
    error: null,
    code: null,
  });

  const cleanupPlayers = () => {
    if (plyrRef.current) {
      try { plyrRef.current.destroy(); } catch {}
      plyrRef.current = null;
    }
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch {}
      hlsRef.current = null;
    }
    if (ytRef.current) {
      try { ytRef.current.destroy(); } catch {}
      ytRef.current = null;
    }
  };

  useEffect(() => () => cleanupPlayers(), []);

  useEffect(() => {
    if (window.YT?.Player) {
      setYtReady(true);
      return;
    }
    if (document.getElementById("youtube-iframe-api-script")) return;
    const tag = document.createElement("script");
    tag.id = "youtube-iframe-api-script";
    tag.src = "https://www.youtube.com/iframe_api";
    window.onYouTubeIframeAPIReady = () => setYtReady(true);
    document.head.appendChild(tag);
  }, []);

  async function restoreProgress(videoId: string, type: "bunny" | "youtube", media?: HTMLVideoElement | null, yt?: any) {
    const record = await loadVideoProgress(videoId, getCourseId());
    if (!record?.position || record.position <= 0) return;

    if (type === "bunny" && media) {
      const apply = () => {
        if (Number.isFinite(media.duration) && record.position < media.duration) {
          media.currentTime = record.position;
        }
      };
      media.addEventListener("loadedmetadata", apply, { once: true });
    }

    if (type === "youtube" && yt && typeof yt.seekTo === "function") {
      try { yt.seekTo(record.position, true); } catch {}
    }
  }

  function shouldSaveTick(current: number) {
    const rounded = Math.floor(current / 10);
    if (rounded > saveTickRef.current) {
      saveTickRef.current = rounded;
      return true;
    }
    return false;
  }

  async function playAuthenticatedBunnyVideo(item: FlatVideoItem) {
    const media = videoRef.current;
    if (!media) return;
    cleanupPlayers();

    if (!user) {
      setState({ loading: false, error: "Please sign in to access protected classes.", code: "AUTH_REQUIRED" });
      return;
    }

    const videoId = getVideoId(item.url);
    retryRef.current = 0;
    setState({ loading: true, error: null, code: null });

    try {
      const authResult = await requestPlaybackAuthorization(videoId, getCourseId());
      const streamUrl = authResult.playbackUrl!;

      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(media);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          plyrRef.current = new Plyr(media, {
            controls: ["play-large", "play", "progress", "current-time", "duration", "settings", "fullscreen"],
            settings: ["quality", "speed"],
          });
          restoreProgress(videoId, "bunny", media).catch(() => {});
          media.play().catch(() => {});
          setState({ loading: false, error: null, code: null });
        });

        hls.on(Hls.Events.ERROR, async (_event, data) => {
          if (!data.fatal) return;
          const statusCode = data.response?.code;
          if ((statusCode === 401 || statusCode === 403) && retryRef.current < 2) {
            retryRef.current += 1;
            try {
              const fresh = await requestPlaybackAuthorization(videoId, getCourseId());
              hls.loadSource(fresh.playbackUrl!);
              hls.startLoad();
              return;
            } catch {
              // fallthrough
            }
          }
          setState({ loading: false, error: "Stream authorization failed. Please retry.", code: "AUTH_EXPIRED" });
        });
      } else if (media.canPlayType("application/vnd.apple.mpegurl")) {
        media.src = streamUrl;
        restoreProgress(videoId, "bunny", media).catch(() => {});
        media.play().catch(() => {});
        setState({ loading: false, error: null, code: null });
      }
    } catch (error: any) {
      setState({ loading: false, error: error?.message || "Unable to authorize playback", code: "AUTH_FAILED" });
    }
  }

  useEffect(() => {
    if (!video) return;
    const url = cleanUrl(video.url);
    if (/\.m3u8(?:$|\?)/i.test(url)) {
      playAuthenticatedBunnyVideo(video);
      return;
    }

    if (!ytReady) return;
    const videoId = getVideoId(url);
    if (!videoId) return;

    cleanupPlayers();

    const timer = setTimeout(() => {
      if (!window.YT?.Player) return;
      ytRef.current = new window.YT.Player(ytContainerId, {
        videoId,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: async (event: any) => {
            await restoreProgress(videoId, "youtube", undefined, event.target);
            event.target.playVideo();
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              onMarkWatched(videoId);
              saveVideoProgress({
                courseId: getCourseId(),
                videoId,
                type: "youtube",
                position: Number(ytRef.current?.getDuration?.() || 0),
                duration: Number(ytRef.current?.getDuration?.() || 0),
                completed: true,
              });
            }
          },
        },
      });
    }, 30);

    return () => clearTimeout(timer);
  }, [video, ytReady, user]);

  if (!video) {
    return <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-950/50">Select a class to start learning</div>;
  }

  const isHls = /\.m3u8(?:$|\?)/i.test(cleanUrl(video.url));
  const activeVideoId = getVideoId(video.url);

  return (
    <div className="relative w-full h-full bg-black">
      {state.error && isHls && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 p-6 bg-slate-950/95 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            {state.code === "AUTH_REQUIRED" ? <Lock className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <p className="text-xs sm:text-sm text-slate-200 max-w-md">{state.error}</p>
          {state.code === "AUTH_REQUIRED" ? (
            <button onClick={onRequireLogin} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-lg text-xs font-bold">
              <LogIn className="w-4 h-4" /> Sign In
            </button>
          ) : (
            <button onClick={() => playAuthenticatedBunnyVideo(video)} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-lg text-xs font-bold">
              <RefreshCw className="w-4 h-4" /> Retry Stream
            </button>
          )}
        </div>
      )}

      {state.loading && isHls && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 text-xs text-cyan-300">Authorizing secure stream...</div>
      )}

      {isHls ? (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          preload="metadata"
          onTimeUpdate={(e) => {
            const current = e.currentTarget.currentTime;
            const duration = e.currentTarget.duration;
            if (duration > 0 && current / duration >= 0.9) onMarkWatched(activeVideoId);
            if (!user || !shouldSaveTick(current)) return;
            saveVideoProgress({
              courseId: getCourseId(),
              videoId: activeVideoId,
              type: "bunny",
              position: current,
              duration,
              completed: duration > 0 && current / duration >= 0.9,
            });
          }}
        />
      ) : (
        <div className="w-full h-full">
          <div id={ytContainerId} className="w-full h-full" />
        </div>
      )}
    </div>
  );
}
