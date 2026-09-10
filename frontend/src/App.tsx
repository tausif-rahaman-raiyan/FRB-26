import { useState, useEffect, useCallback } from "react";
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from "./firebase";
import { Navbar } from "./components/Navbar";
import { LibraryView } from "./components/LibraryView";
import { DashboardView } from "./components/DashboardView";
import { DeployModal } from "./components/DeployModal";
import { getCourseId, loadCourseProgressSummary, loginWithFirebaseIdToken, logoutBackendSession, saveVideoProgress } from "./services/backendApi";

const LOCAL_STORAGE_KEY = "acs_frb26_watched_videos";

export default function App() {
  const [currentView, setCurrentView] = useState<"library" | "dashboard">("library");
  const [user, setUser] = useState<User | null>(null);
  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) setWatchedVideos(JSON.parse(saved));
    } catch {
      // ignore cache parse issues
    }
  }, []);

  const refreshSecureProgress = useCallback(async () => {
    try {
      const backendWatched = await loadCourseProgressSummary(getCourseId());
      setWatchedVideos((prev) => {
        const merged = Array.from(new Set([...prev, ...backendWatched]));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      });
    } catch {
      // backend unavailable; keep cached progress
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthError(null);

      if (!currentUser) {
        await logoutBackendSession();
        return;
      }

      try {
        const idToken = await currentUser.getIdToken(true);
        await loginWithFirebaseIdToken(idToken);
        await refreshSecureProgress();
      } catch (error: any) {
        setAuthError(error?.message || "Authentication sync failed.");
      }
    });

    return () => unsubscribe();
  }, [refreshSecureProgress]);

  const handleMarkWatched = useCallback(async (videoId: string) => {
    if (!videoId) return;
    setWatchedVideos((prev) => {
      if (prev.includes(videoId)) return prev;
      const updated = [...prev, videoId];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    await saveVideoProgress({
      videoId,
      type: "bunny",
      position: 0,
      duration: 1,
      completed: true,
      courseId: getCourseId(),
    });
  }, []);

  const handleResetProgress = async () => {
    setWatchedVideos([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setAuthError(error?.message || "Google sign-in failed.");
    }
  };

  const handleLogout = async () => {
    await logoutBackendSession();
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-[#020617] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.12),rgba(255,255,255,0))] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
      />

      {authError && (
        <div className="bg-rose-500/20 border-b border-rose-500/30 px-4 py-2 text-center text-xs text-rose-300">
          {authError}
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24">
        <div className="w-full text-center py-3.5 mb-6 bg-slate-900/60 border border-slate-700/50 rounded-2xl backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.08)]">
          <h2 className="text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-blue-400 tracking-wide">
            &ldquo;একদিন সাদা কোটটা আমারই হবে — ইনশাআল্লাহ।&rdquo;
          </h2>
        </div>

        {currentView === "library" ? (
          <LibraryView
            user={user}
            watchedVideos={watchedVideos}
            onMarkWatched={handleMarkWatched}
            onRequireLogin={handleLogin}
          />
        ) : (
          <DashboardView user={user} watchedVideos={watchedVideos} onResetProgress={handleResetProgress} />
        )}
      </main>

      <DeployModal isOpen={isDeployModalOpen} onClose={() => setIsDeployModalOpen(false)} />
    </div>
  );
}
