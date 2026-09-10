import { useState, useEffect, useRef, useId, type MouseEvent, type PointerEvent } from 'react';
import Hls from 'hls.js';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { Play, Lock, AlertCircle, RefreshCw, LogIn } from 'lucide-react';
import type { FlatVideoItem, PlaybackAuthResponse } from '../types';
import { auth, type User } from '../firebase';
import { cleanUrl, getVideoId, isValidVideoId } from '../data/lectureData';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface UniversalPlayerProps {
  key?: string;
  video: FlatVideoItem | null;
  user: User | null;
  onMarkWatched: (videoId: string) => void;
  onRequireLogin: () => void;
}

export function UniversalPlayer({
  video,
  user,
  onMarkWatched,
  onRequireLogin,
}: UniversalPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const hlsRef = useRef<Hls | null>(null);
  const plyrRef = useRef<Plyr | null>(null);
  const hasMarkedRef = useRef<boolean>(false);
  const currentIdRef = useRef<string | null>(null);
  const seekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef<number>(0);
  const ytContainerId = useId().replace(/:/g, '_');

  const [ytReady, setYtReady] = useState(false);
  const [seekOverlay, setSeekOverlay] = useState<{ text: string; side: 'left' | 'right' | 'center' } | null>(null);
  const [playerState, setPlayerState] = useState<{
    loading: boolean;
    error: string | null;
    errorType: string | null;
  }>({
    loading: false,
    error: null,
    errorType: null,
  });

  useEffect(() => {
    hasMarkedRef.current = false;
    currentIdRef.current = video ? getVideoId(video.url) : null;
    retryCountRef.current = 0;
    setPlayerState({ loading: false, error: null, errorType: null });
  }, [video]);

  const showSeekOverlay = (text: string, side: 'left' | 'right' | 'center' = 'center') => {
    if (seekTimerRef.current) clearTimeout(seekTimerRef.current);
    setSeekOverlay({ text, side });
    seekTimerRef.current = setTimeout(() => setSeekOverlay(null), 650);
  };

  useEffect(() => {
    return () => {
      if (seekTimerRef.current) clearTimeout(seekTimerRef.current);
    };
  }, []);

  const markCompleted = () => {
    const id = currentIdRef.current;
    if (!isValidVideoId(id) || hasMarkedRef.current) return;
    hasMarkedRef.current = true;
    if (id) onMarkWatched(id);
  };

  // YouTube API Script loader
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setYtReady(true);
      return;
    }
    if (document.getElementById('youtube-iframe-api-script')) {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prev === 'function') prev();
        setYtReady(true);
      };
      return;
    }
    const tag = document.createElement('script');
    tag.id = 'youtube-iframe-api-script';
    tag.src = 'https://www.youtube.com/iframe_api';
    window.onYouTubeIframeAPIReady = () => setYtReady(true);
    document.head.appendChild(tag);
  }, []);

  // Request short-lived token from backend
  async function requestBackendAuthorization(videoTargetUrl: string): Promise<PlaybackAuthResponse> {
    let idToken = 'preview-token';
    if (auth.currentUser) {
      try {
        idToken = await auth.currentUser.getIdToken(false);
      } catch (err) {
        console.warn('Failed to retrieve fresh Firebase ID token:', err);
      }
    }

    const res = await fetch('/api/video/playback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        videoId: getVideoId(videoTargetUrl),
        courseId: 'acs-frb-26',
        videoPath: videoTargetUrl,
      }),
    });

    const data: PlaybackAuthResponse = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Authorization failed from backend.');
    }
    return data;
  }

  // Play Bunny HLS Video with Signed Token
  async function playAuthenticatedBunnyVideo(videoTarget: FlatVideoItem) {
    const media = videoRef.current;
    if (!media || !videoTarget) return;

    // Clean up previous instances
    if (plyrRef.current) {
      try { plyrRef.current.destroy(); } catch {}
      plyrRef.current = null;
    }
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch {}
      hlsRef.current = null;
    }

    // Require authentication
    if (!auth.currentUser) {
      setPlayerState({
        loading: false,
        error: 'Please sign in with your Google account to unlock this ACS class.',
        errorType: 'AUTH_REQUIRED',
      });
      return;
    }

    setPlayerState({ loading: true, error: null, errorType: null });

    try {
      const clean = cleanUrl(videoTarget.url);
      const authResult = await requestBackendAuthorization(clean);
      const authorizedUrl = authResult.playbackUrl || clean;

      setPlayerState({ loading: false, error: null, errorType: null });

      if (Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr) => {
            xhr.withCredentials = false;
          },
          enableWorker: true,
          lowLatencyMode: false,
        });
        hlsRef.current = hls;

        hls.loadSource(authorizedUrl);
        hls.attachMedia(media);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const availableQualities = hls.levels.map((l) => l.height);
          availableQualities.unshift(0);

          plyrRef.current = new Plyr(media, {
            controls: [
              'play-large',
              'play',
              'progress',
              'current-time',
              'duration',
              'captions',
              'settings',
              'fullscreen',
            ],
            settings: ['captions', 'quality', 'speed'],
            speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
            quality: {
              default: 0,
              options: availableQualities,
              forced: true,
              onChange: (qualityHeight: number) => {
                if (qualityHeight === 0) hls.currentLevel = -1;
                else hls.currentLevel = hls.levels.findIndex((l) => l.height === qualityHeight);
              },
            },
            i18n: { qualityLabel: { 0: 'Auto' } },
          });

          media.play().catch(() => {});
        });

        // 403 / 401 token refresh handler
        hls.on(Hls.Events.ERROR, async (_event, data) => {
          if (data.fatal) {
            const code = data.response?.code;
            if ((code === 403 || code === 401) && retryCountRef.current < 2) {
              retryCountRef.current += 1;
              try {
                const refreshed = await requestBackendAuthorization(clean);
                if (refreshed.playbackUrl) {
                  hls.loadSource(refreshed.playbackUrl);
                  hls.startLoad();
                  return;
                }
              } catch {
                setPlayerState({
                  loading: false,
                  error: 'Playback authorization expired. Please reload the class.',
                  errorType: 'TOKEN_EXPIRED',
                });
                hls.destroy();
                return;
              }
            }

            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                if (retryCountRef.current < 2) {
                  retryCountRef.current += 1;
                  hls.startLoad();
                } else {
                  setPlayerState({
                    loading: false,
                    error: 'Network connection issue while loading class stream. Please check your internet.',
                    errorType: 'NETWORK_ERROR',
                  });
                  hls.destroy();
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setPlayerState({
                  loading: false,
                  error: 'Unable to stream this video. Please try again later.',
                  errorType: 'PLAYBACK_ERROR',
                });
                hls.destroy();
                break;
            }
          }
        });
      } else if (media.canPlayType('application/vnd.apple.mpegurl')) {
        media.src = authorizedUrl;
        plyrRef.current = new Plyr(media, {
          settings: ['captions', 'speed'],
          speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
        });
        media.play().catch(() => {});
      }
    } catch (err: any) {
      setPlayerState({
        loading: false,
        error: err.message || 'Authorization failed. Please try again.',
        errorType: 'AUTH_ERROR',
      });
    }
  }

  // Trigger HLS play on video or user change
  useEffect(() => {
    if (!video) return;
    const clean = cleanUrl(video.url);
    if (!/\.m3u8(?:$|\?)/i.test(clean)) return;

    playAuthenticatedBunnyVideo(video);

    return () => {
      const media = videoRef.current;
      if (media) {
        try {
          media.playbackRate = 1;
          media.pause();
        } catch {}
      }
      if (plyrRef.current) {
        try { plyrRef.current.destroy(); } catch {}
        plyrRef.current = null;
      }
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
    };
  }, [video, user]);

  // YouTube Player initialization
  useEffect(() => {
    if (!video || !ytReady) return;
    const clean = cleanUrl(video.url);
    if (/\.m3u8(?:$|\?)/i.test(clean)) return;
    const videoId = getVideoId(clean);
    if (!videoId) return;

    const timer = setTimeout(() => {
      if (!window.YT || !window.YT.Player) return;
      const el = document.getElementById(ytContainerId);
      if (!el) return;

      ytPlayerRef.current = new window.YT.Player(ytContainerId, {
        videoId,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (event: any) => {
            try { event.target.playVideo(); } catch {}
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) markCompleted();
          },
        },
      });
    }, 60);

    return () => {
      clearTimeout(timer);
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch {}
        ytPlayerRef.current = null;
      }
    };
  }, [video, ytReady, ytContainerId]);

  // YouTube 90% completion polling
  useEffect(() => {
    if (!video || !ytReady) return;
    if (/\.m3u8(?:$|\?)/i.test(cleanUrl(video.url))) return;
    const interval = setInterval(() => {
      const player = ytPlayerRef.current;
      if (!player || typeof player.getCurrentTime !== 'function') return;
      try {
        const current = player.getCurrentTime();
        const duration = player.getDuration();
        if (duration > 0 && current / duration >= 0.90) markCompleted();
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [video, ytReady]);

  if (!video) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-900/60 backdrop-blur-sm p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400">
          <Play className="w-8 h-8 ml-1" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-200">Select a class to start learning</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Pick any lecture from the subjects and chapters list on the right to start watching.
        </p>
      </div>
    );
  }

  const isHLS = /\.m3u8(?:$|\?)/i.test(cleanUrl(video.url));

  const handleHlsDoubleClick = (e: MouseEvent<HTMLVideoElement>) => {
    const media = videoRef.current;
    if (!media || !Number.isFinite(media.duration)) return;
    const rect = media.getBoundingClientRect();
    const x = e.clientX - rect.left;
    e.preventDefault();
    e.stopPropagation();
    if (x < rect.width / 2) {
      media.currentTime = Math.max(0, media.currentTime - 10);
      showSeekOverlay('−10s', 'left');
    } else {
      media.currentTime = Math.min(media.duration, media.currentTime + 10);
      showSeekOverlay('+10s', 'right');
    }
  };

  const handleHlsPointerDown = (e: PointerEvent<HTMLVideoElement>) => {
    const media = videoRef.current;
    if (!media) return;
    const rect = media.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > rect.width * 0.55) {
      try {
        media.playbackRate = 2;
        showSeekOverlay('2× Speed', 'right');
      } catch {}
    }
  };

  const handleHlsPointerUp = () => {
    const media = videoRef.current;
    if (!media) return;
    try {
      if (media.playbackRate === 2) {
        media.playbackRate = 1;
        showSeekOverlay('1× Normal', 'right');
      }
    } catch {}
  };

  const overlayPosition =
    seekOverlay?.side === 'left'
      ? 'left-8 sm:left-16'
      : seekOverlay?.side === 'right'
      ? 'right-8 sm:right-16'
      : 'left-1/2 -translate-x-1/2';

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
      {/* Gesture overlay */}
      {seekOverlay && isHLS && (
        <div className={`absolute top-1/2 -translate-y-1/2 ${overlayPosition} z-30 pointer-events-none`}>
          <div className="min-w-[80px] text-center rounded-full bg-black/80 backdrop-blur-md border border-white/20 px-4 py-2.5 text-white text-sm sm:text-base font-black shadow-2xl animate-fade-in">
            {seekOverlay.text}
          </div>
        </div>
      )}

      {/* Error / Auth Required Overlay */}
      {playerState.error && isHLS && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400 shadow-lg shadow-amber-500/10">
            {playerState.errorType === 'AUTH_REQUIRED' ? <Lock className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
          </div>
          <h4 className="text-lg font-extrabold text-white mb-2">Protected Playback</h4>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            {playerState.error}
          </p>
          {playerState.errorType === 'AUTH_REQUIRED' ? (
            <button
              onClick={onRequireLogin}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-6 py-2.5 rounded-xl font-bold text-white text-xs sm:text-sm shadow-xl shadow-cyan-500/20 transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" /> Sign In with Google
            </button>
          ) : (
            <button
              onClick={() => playAuthenticatedBunnyVideo(video)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" /> Retry Stream
            </button>
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {playerState.loading && isHLS && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-center">
          <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">
            Authorizing Secure Stream...
          </p>
        </div>
      )}

      {isHLS ? (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          preload="metadata"
          onDoubleClick={handleHlsDoubleClick}
          onPointerDown={handleHlsPointerDown}
          onPointerUp={handleHlsPointerUp}
          onPointerCancel={handleHlsPointerUp}
          onPointerLeave={handleHlsPointerUp}
          onTimeUpdate={(e) => {
            const current = e.currentTarget.currentTime;
            const duration = e.currentTarget.duration;
            if (duration > 0 && current / duration >= 0.90) markCompleted();
          }}
        />
      ) : (
        <div className="w-full h-full pointer-events-auto">
          <div id={ytContainerId} className="w-full h-full" />
        </div>
      )}
    </div>
  );
}
