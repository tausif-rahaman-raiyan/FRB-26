import { useState } from 'react';
import { CheckCircle2, Clock, ChevronDown, RotateCcw, Award, BookOpen } from 'lucide-react';
import { CircularProgress } from './CircularProgress';
import { lectureData, formatChapterName, getVideoId, isValidVideoId } from '../data/lectureData';
import type { User } from '../firebase';

interface DashboardViewProps {
  user: User | null;
  watchedVideos: string[];
  onResetProgress: () => Promise<void>;
}

export function DashboardView({ user, watchedVideos, onResetProgress }: DashboardViewProps) {
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>(lectureData[0].name);
  const [resetting, setResetting] = useState(false);

  const isVideoWatched = (url: string) => {
    const id = getVideoId(url);
    return isValidVideoId(id) && watchedVideos.includes(id);
  };

  const getSubjectChapterStats = (subject: typeof lectureData[0]) => {
    const totalChaps = subject.chapters.length;
    let compChaps = 0;
    const compList: string[] = [];
    const uncompList: string[] = [];

    subject.chapters.forEach((chap) => {
      const validLinks = chap.links.filter((link) => isValidVideoId(getVideoId(link.url)));
      const isChapComp =
        validLinks.length > 0 && validLinks.every((link) => isVideoWatched(link.url));

      if (isChapComp) {
        compChaps++;
        compList.push(chap.name);
      } else {
        uncompList.push(chap.name);
      }
    });

    return { totalChaps, compChaps, compList, uncompList };
  };

  // Global calculations across all 13 subjects
  let globalTotalChaps = 0;
  let globalCompChaps = 0;
  let globalTotalClasses = 0;
  let globalCompClasses = 0;

  lectureData.forEach((sub) => {
    const stats = getSubjectChapterStats(sub);
    globalTotalChaps += stats.totalChaps;
    globalCompChaps += stats.compChaps;

    sub.chapters.forEach((chap) => {
      chap.links.forEach((l) => {
        if (isValidVideoId(getVideoId(l.url))) {
          globalTotalClasses++;
          if (isVideoWatched(l.url)) {
            globalCompClasses++;
          }
        }
      });
    });
  });

  const activeSubject = lectureData.find((s) => s.name === selectedSubjectName) || lectureData[0];
  const activeSubjectStats = getSubjectChapterStats(activeSubject);

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all saved progress? This action cannot be reversed.')) {
      return;
    }
    setResetting(true);
    try {
      await onResetProgress();
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Cards: User Profile & Global Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* User Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <img
            src={user?.photoURL || 'https://via.placeholder.com/96'}
            referrerPolicy="no-referrer"
            alt={user?.displayName || 'Student'}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-3.5 border-4 border-slate-800 shadow-2xl object-cover"
          />
          <h2 className="text-xl sm:text-2xl font-black text-white">{user?.displayName || 'Guest Student'}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {user?.email || 'Sign in with Google to automatically track your chapter completions.'}
          </p>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-[11px] bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 px-3 py-1 rounded-full font-bold">
              ACS FRB-26 Batch
            </span>
            <span className="text-[11px] bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-medium">
              {globalCompClasses} of {globalTotalClasses} Classes Done
            </span>
          </div>

          {user && (
            <button
              onClick={handleReset}
              disabled={resetting}
              className="mt-5 flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-4 py-2 rounded-full transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{resetting ? 'Resetting...' : 'Reset All Progress'}</span>
            </button>
          )}
        </div>

        {/* Global Progress Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-cyan-400" />
            <h3 className="text-slate-300 font-bold uppercase tracking-wider text-xs sm:text-sm">
              All Subjects Overall Progress
            </h3>
          </div>
          <CircularProgress completed={globalCompChaps} total={globalTotalChaps} size="lg" />
          <p className="text-xs text-slate-400 mt-4 text-center">
            {globalCompChaps} of {globalTotalChaps} chapters fully completed across 13 subjects
          </p>
        </div>
      </div>

      {/* Subject Chapter Inspector */}
      <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">Subject Chapter Breakdown</h2>
              <p className="text-xs text-slate-400">View finished and pending chapters by subject</p>
            </div>
          </div>

          {/* Subject Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedSubjectName}
              onChange={(e) => setSelectedSubjectName(e.target.value)}
              className="appearance-none bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold cursor-pointer shadow-lg w-full sm:w-72"
            >
              {lectureData.map((sub) => (
                <option key={sub.name} value={sub.name}>
                  {sub.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Detailed Grid for the active subject */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Progress Dial */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center bg-black/25 p-6 rounded-2xl border border-white/5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              {activeSubject.name}
            </h4>
            <CircularProgress
              completed={activeSubjectStats.compChaps}
              total={activeSubjectStats.totalChaps}
              size="lg"
            />
          </div>

          {/* Chapters Lists */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Completed */}
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 flex flex-col">
              <h4 className="text-emerald-400 font-bold text-xs sm:text-sm flex items-center mb-3 pb-2 border-b border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
                <span>Finished Chapters ({activeSubjectStats.compList.length})</span>
              </h4>
              <ul className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {activeSubjectStats.compList.length > 0 ? (
                  activeSubjectStats.compList.map((name) => (
                    <li key={name} className="flex items-start text-xs text-slate-300">
                      <span className="text-emerald-400 mr-2 font-bold">✓</span>
                      <span>{formatChapterName(name)}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-500 italic py-2">No chapters fully completed yet.</li>
                )}
              </ul>
            </div>

            {/* Remaining */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col">
              <h4 className="text-slate-300 font-bold text-xs sm:text-sm flex items-center mb-3 pb-2 border-b border-white/5">
                <Clock className="w-4 h-4 mr-2 text-cyan-400" />
                <span>Remaining Chapters ({activeSubjectStats.uncompList.length})</span>
              </h4>
              <ul className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {activeSubjectStats.uncompList.length > 0 ? (
                  activeSubjectStats.uncompList.map((name) => (
                    <li key={name} className="flex items-start text-xs text-slate-400">
                      <span className="text-slate-600 mr-2 font-bold">○</span>
                      <span>{formatChapterName(name)}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-emerald-400 italic py-2">🎉 All chapters completed!</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
