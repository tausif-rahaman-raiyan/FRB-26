import { useState, useEffect } from 'react';
import { Copy, Check, Download, FileCode, Sparkles, CheckCircle2 } from 'lucide-react';

export function BloggerExporter() {
  const [copied, setCopied] = useState(false);
  const [xmlContent, setXmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/acs-frb26-blogger-template.xml')
      .then(res => res.text())
      .then(data => {
        setXmlContent(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleCopy = () => {
    if (!xmlContent) return;
    navigator.clipboard.writeText(xmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!xmlContent) return;
    const blob = new Blob([xmlContent], { type: 'text/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'acs-frb26-authenticated-blogger-template.xml');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Exporter Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/60 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Ready for Production Blogger
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-white">Modified Blogger Template Code</h3>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Contains the authenticated playback architecture, short-lived token requests, Plyr controls, Firestore progress syncing, and YouTube fallback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied Full Code!' : 'Copy Complete XML'}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Download .xml
          </button>
        </div>
      </div>

      {/* Key Improvements Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
            <CheckCircle2 className="w-4 h-4" /> Zero Secrets in Blogger
          </div>
          <p className="text-xs text-slate-400">
            Bunny API key and token signing secrets remain solely in your backend server.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
            <CheckCircle2 className="w-4 h-4" /> Auto Token Refresh & Recovery
          </div>
          <p className="text-xs text-slate-400">
            When token expires mid-class, HLS.js catches 403, requests a fresh token, and resumes playback.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-1">
            <CheckCircle2 className="w-4 h-4" /> Native HLS & Plyr UI
          </div>
          <p className="text-xs text-slate-400">
            Works smoothly on Chrome, Firefox, Edge, and iOS Safari native HLS.
          </p>
        </div>
      </div>

      {/* Code Preview Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>acs-frb26-authenticated-blogger-template.xml</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {loading ? 'Loading...' : `${xmlContent.split('\n').length} lines`}
          </span>
        </div>

        <div className="relative">
          <pre className="p-4 text-xs font-mono text-slate-300 bg-slate-950 max-h-[480px] overflow-y-auto custom-scrollbar leading-relaxed">
            <code>{loading ? 'Loading complete template...' : xmlContent}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
