import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Play, RotateCcw, ShieldCheck, ShieldAlert, UserCheck, UserX, AlertCircle, RefreshCw, KeyRound, Radio } from 'lucide-react';
import type { LectureItem, AuthSimulationState, PlaybackAuthResponse } from '../types';

const SAMPLE_LECTURES: LectureItem[] = [
  {
    id: 'phys-ch1-c1',
    text: 'Physics 1st Paper - Ch 1: Class 1',
    url: 'https://vz-cb5996f0-784.b-cdn.net/190baa47-1c4d-458e-9755-4673aa6293c3/playlist.m3u8',
    type: 'bunny',
    subject: 'Physics 1st Paper',
    chapter: 'ভৌতজগত ও পরিমাপ',
  },
  {
    id: 'phys-ch2-c1',
    text: 'Physics 1st Paper - Ch 2: Class 1',
    url: 'https://vz-cb5996f0-784.b-cdn.net/2029ac2a-3771-425b-bc8f-80c68bf3d0b9/playlist.m3u8',
    type: 'bunny',
    subject: 'Physics 1st Paper',
    chapter: 'ভেক্টর',
  },
  {
    id: 'math-ch1-c1',
    text: 'Higher Math 1st Paper - Ch 1: Class 1 (YouTube Fallback)',
    url: 'https://www.youtube.com/watch?v=67B9P3TgKa8',
    type: 'youtube',
    subject: 'Higher Math 1st Paper',
    chapter: 'ম্যাট্রিক্স ও নির্ণায়ক',
  }
];

export function PlayerTestLab() {
  const [selectedVideo, setSelectedVideo] = useState<LectureItem>(SAMPLE_LECTURES[0]);
  const [authState, setAuthState] = useState<AuthSimulationState>({
    role: 'enrolled',
    userName: 'Tausif Rahaman Raiyan',
    userEmail: 'student@example.com',
    tokenExpired: false,
  });

  const [logs, setLogs] = useState<Array<{ id: string; time: string; msg: string; type: 'info' | 'success' | 'warn' | 'error' }>>([]);
  const [loading, setLoading] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [currentPlaybackUrl, setCurrentPlaybackUrl] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const addLog = (msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ id: Math.random().toString(), time, msg, type }, ...prev.slice(0, 19)]);
  };

  const stopPlayback = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
    setCurrentPlaybackUrl(null);
    setTokenExpiresAt(null);
  };

  const playAuthenticatedVideo = async () => {
    stopPlayback();
    setPlayerError(null);

    if (selectedVideo.type === 'youtube') {
      addLog(`Playing YouTube fallback video [${selectedVideo.id}] directly.`, 'info');
      return;
    }

    if (authState.role === 'guest') {
      const err = 'User not logged in. Playback denied before token request.';
      setPlayerError(err);
      addLog(err, 'warn');
      return;
    }

    setLoading(true);
    addLog(`Initiating playback authorization request for video: ${selectedVideo.url}`, 'info');

    try {
      // Simulate Firebase ID Token from current user
      const simulatedFirebaseToken = authState.role === 'enrolled'
        ? 'firebase-id-token-valid-enrolled-student'
        : 'firebase-id-token-unenrolled-user';

      // Call our real backend endpoint /api/video/playback
      const res = await fetch('/api/video/playback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${simulatedFirebaseToken}`,
        },
        body: JSON.stringify({
          videoId: selectedVideo.id,
          courseId: 'acs-frb-26',
          videoPath: selectedVideo.url,
        }),
      });

      const data: PlaybackAuthResponse = await res.json();

      if (!res.ok || !data.success || !data.playbackUrl) {
        throw new Error(data.message || 'Authorization failed from backend.');
      }

      addLog(`Backend authorized playback! Signed token received. Expires in: 2h`, 'success');
      setCurrentPlaybackUrl(data.playbackUrl);
      setTokenExpiresAt(data.expiresAt || null);

      const media = videoRef.current;
      if (!media) return;

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });
        hlsRef.current = hls;

        hls.loadSource(data.playbackUrl);
        hls.attachMedia(media);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          addLog(`HLS manifest loaded successfully with ${hls.levels.length} quality levels.`, 'success');
          media.play().catch(() => {
            addLog('Autoplay blocked by browser policy; click play on video.', 'warn');
          });
        });

        hls.on(Hls.Events.ERROR, (_event, errorData) => {
          if (errorData.fatal) {
            const status = errorData.response?.code;
            if (status === 403 || status === 401) {
              addLog(`Bunny CDN returned ${status} Forbidden: Token expired or invalid signature.`, 'error');
              setPlayerError('Bunny authorization token expired or invalid.');
            } else {
              addLog(`HLS fatal network/media error: ${errorData.details}`, 'error');
            }
          }
        });
      } else if (media.canPlayType('application/vnd.apple.mpegurl')) {
        media.src = data.playbackUrl;
        media.play().catch(() => {});
        addLog('Loaded via Native Safari HLS engine.', 'info');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to authorize stream.';
      setPlayerError(msg);
      addLog(`Authorization Error: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    playAuthenticatedVideo();
    return () => {
      stopPlayback();
    };
  }, [selectedVideo, authState.role]);

  return (
    <div className="space-y-6">
      {/* Simulation Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <KeyRound className="w-3.5 h-3.5" /> Authentication State Controller
            </span>
            <h3 className="text-lg font-bold text-white">Interactive Playback Test Lab</h3>
            <p className="text-xs text-slate-400">
              Switch student roles to test backend authorization, token verification, and error handling.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setAuthState(s => ({ ...s, role: 'enrolled' }))}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                authState.role === 'enrolled'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Enrolled Student
            </button>

            <button
              onClick={() => setAuthState(s => ({ ...s, role: 'guest' }))}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                authState.role === 'guest'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <UserX className="w-4 h-4 text-amber-400" />
              Logged Out (Guest)
            </button>

            <button
              onClick={playAuthenticatedVideo}
              className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ml-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-request Token
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Player on left, Video selector & Live Handshake log on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Player View */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl flex items-center justify-center">
            {selectedVideo.type === 'youtube' ? (
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/67B9P3TgKa8?autoplay=0"
                title="YouTube Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                />

                {loading && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20">
                    <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-3" />
                    <p className="text-sm font-semibold text-white">Validating session with backend...</p>
                    <p className="text-xs text-slate-400 mt-1">Generating signed Bunny CDN playback URL</p>
                  </div>
                )}

                {playerError && !loading && (
                  <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                    <ShieldAlert className="w-12 h-12 text-amber-400 mb-3" />
                    <h4 className="text-lg font-bold text-white mb-1">Access Restricted</h4>
                    <p className="text-xs text-slate-300 max-w-sm mb-4">{playerError}</p>
                    <button
                      onClick={() => setAuthState(s => ({ ...s, role: 'enrolled' }))}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                    >
                      Simulate Login as Enrolled Student
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Video Metadata Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                  {selectedVideo.subject} • {selectedVideo.chapter}
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">{selectedVideo.text}</h4>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                selectedVideo.type === 'bunny' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {selectedVideo.type === 'bunny' ? 'Bunny HLS (Protected)' : 'YouTube'}
              </span>
            </div>

            {currentPlaybackUrl && (
              <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 break-all">
                <span className="text-slate-500 font-semibold block mb-0.5">Signed Authorized Stream:</span>
                <span className="text-emerald-400 font-mono text-[11px]">{currentPlaybackUrl}</span>
                {tokenExpiresAt && (
                  <span className="block mt-1 text-[10px] text-slate-500">
                    Expires at timestamp: {tokenExpiresAt} (~2 hours short-lived window)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Lecture Selection & Live Logs */}
        <div className="lg:col-span-5 space-y-4">
          {/* Lecture Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Select Class to Test</h4>
            <div className="space-y-2">
              {SAMPLE_LECTURES.map(lec => (
                <button
                  key={lec.id}
                  onClick={() => setSelectedVideo(lec)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                    selectedVideo.id === lec.id
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-white shadow-sm'
                      : 'bg-slate-800/40 border-slate-700/40 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${selectedVideo.id === lec.id ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <div>
                      <p className="font-semibold truncate max-w-[200px]">{lec.text}</p>
                      <p className="text-[10px] text-slate-500">{lec.type.toUpperCase()}</p>
                    </div>
                  </div>
                  {selectedVideo.id === lec.id && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Live Handshake Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-72">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                Live Network Handshake
              </span>
              <button
                onClick={() => setLogs([])}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
              {logs.length === 0 ? (
                <p className="text-slate-600 text-center py-8 text-xs">Ready for playback authorization events.</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 leading-tight">
                    <span className="text-slate-600 text-[10px] shrink-0">{log.time}</span>
                    <span
                      className={`break-words ${
                        log.type === 'success'
                          ? 'text-emerald-400'
                          : log.type === 'warn'
                          ? 'text-amber-400'
                          : log.type === 'error'
                          ? 'text-rose-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {log.msg}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
