import { useState, useEffect, useCallback } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  type User,
} from './firebase';
import { Navbar } from './components/Navbar';
import { LibraryView } from './components/LibraryView';
import { DashboardView } from './components/DashboardView';
import { DeployModal } from './components/DeployModal';

const LOCAL_STORAGE_KEY = 'acs_frb26_watched_videos';

export default function App() {
  const [currentView, setCurrentView] = useState<'library' | 'dashboard'>('library');
  const [user, setUser] = useState<User | null>(null);
  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Load local cache initially
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setWatchedVideos(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Sync Firebase Auth & Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const ref = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            const cloudWatched: string[] = data?.watchedVideos || [];
            // Merge with local watched
            setWatchedVideos((prev) => {
              const combined = Array.from(new Set([...prev, ...cloudWatched]));
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combined));
              } catch {}
              return combined;
            });
          }
        } catch (err) {
          console.warn('Could not sync progress from Firestore:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Mark a video as watched
  const handleMarkWatched = useCallback(
    async (videoId: string) => {
      if (!videoId) return;

      setWatchedVideos((prev) => {
        if (prev.includes(videoId)) return prev;
        const updated = [...prev, videoId];
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        } catch {}

        if (auth.currentUser) {
          const ref = doc(db, 'users', auth.currentUser.uid);
          setDoc(ref, { watchedVideos: updated, updatedAt: new Date().toISOString() }, { merge: true }).catch(
            (e) => console.warn('Failed saving progress to Firestore:', e)
          );
        }
        return updated;
      });
    },
    []
  );

  // Reset progress
  const handleResetProgress = async () => {
    setWatchedVideos([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {}

    if (auth.currentUser) {
      try {
        const ref = doc(db, 'users', auth.currentUser.uid);
        await setDoc(ref, { watchedVideos: [], updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('Error resetting Firestore progress:', err);
      }
    }
  };

  // Google Sign-In
  const handleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err.message || 'Google sign-in failed.');
    }
  };

  // Sign-Out
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.12),rgba(255,255,255,0))] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
      />

      {/* Auth error toast */}
      {authError && (
        <div className="bg-rose-500/20 border-b border-rose-500/30 px-4 py-2 text-center text-xs text-rose-300">
          {authError} &bull; Please ensure your domain is authorized in Firebase Console.
        </div>
      )}

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24">
        {/* Banner with Bengali Medical Dream quote */}
        <div className="w-full text-center py-3.5 mb-6 bg-slate-900/60 border border-slate-700/50 rounded-2xl backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.08)]">
          <h2 className="text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-blue-400 tracking-wide">
            &ldquo;একদিন সাদা কোটটা আমারই হবে — ইনশাআল্লাহ।&rdquo;
          </h2>
        </div>

        {/* View switching */}
        {currentView === 'library' ? (
          <LibraryView
            user={user}
            watchedVideos={watchedVideos}
            onMarkWatched={handleMarkWatched}
            onRequireLogin={handleLogin}
          />
        ) : (
          <DashboardView
            user={user}
            watchedVideos={watchedVideos}
            onResetProgress={handleResetProgress}
          />
        )}
      </main>

      {/* Vercel Deploy & Environment Guide Modal */}
      <DeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            &copy; {new Date().getFullYear()} ACS HSC FRB-26 &bull; Protected Bunny CDN Architecture
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setCurrentView('library')}
              className="hover:text-cyan-400 transition-colors"
            >
              Class Library
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="hover:text-cyan-400 transition-colors"
            >
              Progress Dashboard
            </button>
            <button
              onClick={() => setIsDeployModalOpen(true)}
              className="hover:text-cyan-400 transition-colors"
            >
              Vercel Hosting Setup
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
