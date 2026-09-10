import { BookOpen, BarChart3, LogIn, LogOut, CloudUpload, ShieldCheck } from 'lucide-react';
import type { User } from '../firebase';

interface NavbarProps {
  currentView: 'library' | 'dashboard';
  onViewChange: (view: 'library' | 'dashboard') => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenDeployModal: () => void;
}

export function Navbar({
  currentView,
  onViewChange,
  user,
  onLogin,
  onLogout,
  onOpenDeployModal,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 leading-tight">
              ACS FRB-26
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
              Protected HSC Revision Portal
            </p>
          </div>
        </div>

        {/* View Switch */}
        <div className="hidden sm:flex items-center space-x-1.5 bg-slate-900/70 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onViewChange('library')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'library'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Library</span>
          </button>
          <button
            onClick={() => onViewChange('dashboard')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'dashboard'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Right Actions: Deploy Modal & Auth */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenDeployModal}
            className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-cyan-500/20 px-3 py-1.5 rounded-lg transition-all"
            title="Deployment & environment config"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Deployment Setup</span>
          </button>

          {user ? (
            <div className="flex items-center space-x-2 bg-slate-900/80 pl-1.5 pr-3 py-1 rounded-full border border-white/10">
              <img
                src={user.photoURL || 'https://via.placeholder.com/32'}
                alt={user.displayName || 'User'}
                className="w-7 h-7 rounded-full border border-cyan-500/40 object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="hidden sm:inline text-xs font-bold text-slate-200 max-w-[110px] truncate">
                {user.displayName?.split(' ')[0] || 'Student'}
              </span>
              <button
                onClick={onLogout}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded-md transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-4 py-1.5 rounded-xl font-bold text-white text-xs shadow-md shadow-cyan-500/15 transition-transform hover:scale-105 active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
