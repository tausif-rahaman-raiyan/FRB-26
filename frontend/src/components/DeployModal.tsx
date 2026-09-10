import { X, ShieldCheck, Server, Globe } from 'lucide-react';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const envItems = [
  'BUNNY_HOSTNAME',
  'BUNNY_LIBRARY_ID',
  'BUNNY_SIGNING_KEY',
  'AUTH_SECRET',
  'DATABASE_URL',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'ENROLLED_EMAILS',
];

export function DeployModal({ isOpen, onClose }: DeployModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-white">Deployment Guide (Single GitHub Repository)</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 text-xs sm:text-sm mb-5">
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4">
            <Globe className="w-5 h-5 text-cyan-400 mb-2" />
            <p className="text-slate-200 font-semibold">Frontend</p>
            <p className="text-slate-400 mt-1">Build and deploy <code>frontend/dist</code> to GitHub Pages.</p>
          </div>
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4">
            <Server className="w-5 h-5 text-cyan-400 mb-2" />
            <p className="text-slate-200 font-semibold">Backend</p>
            <p className="text-slate-400 mt-1">Deploy <code>backend</code> to a secure Node runtime; do not host on GitHub Pages.</p>
          </div>
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4">
            <ShieldCheck className="w-5 h-5 text-cyan-400 mb-2" />
            <p className="text-slate-200 font-semibold">Security</p>
            <p className="text-slate-400 mt-1">Keep Bunny/Auth secrets in runtime environment variables only.</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-2">Required backend secrets/environment variables:</p>
        <div className="bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-cyan-300 grid sm:grid-cols-2 gap-1.5">
          {envItems.map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>
    </div>
  );
}
