import { useState } from 'react';
import { X, Check, Copy, Server, Terminal, Shield, ExternalLink, Play } from 'lucide-react';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeployModal({ isOpen, onClose }: DeployModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testUrl, setTestUrl] = useState('https://vz-74274b7e-976.b-cdn.net/4efc2e42-1e96-4191-88f2-d85fbf80e922/playlist.m3u8');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/video/playback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer preview-token',
        },
        body: JSON.stringify({
          videoId: 'test-demo',
          courseId: 'acs-frb-26',
          videoPath: testUrl,
        }),
      });
      const rawText = await res.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = rawText;
      }
      setTestResult({ status: res.status, ok: res.ok, data });
    } catch (err: any) {
      setTestResult({ status: 500, ok: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const envVariables = [
    {
      name: 'BUNNY_SECURITY_TOKEN_KEY',
      desc: 'Your Bunny CDN URL Authentication Key (configured in Bunny Pull Zone or Stream Security Settings)',
      example: 'your_secret_bunny_token_key_here',
    },
    {
      name: 'BUNNY_STREAM_HOST',
      desc: 'Allowed Bunny Stream host or Pull zone hostname (Optional fallback)',
      example: 'vz-74274b7e-976.b-cdn.net',
    },
    {
      name: 'TOKEN_EXPIRATION_SECONDS',
      desc: 'Validity duration for each playback token (e.g. 7200 for 2 hours)',
      example: '7200',
    },
    {
      name: 'FIREBASE_PROJECT_ID',
      desc: 'Your Firebase project ID (optional for local/server token verification)',
      example: 'hsc-courses-app',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Vercel Full Website Hosting Guide</h3>
              <p className="text-xs text-slate-400">Everything is bundled and ready to deploy in 1 click</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Architecture Status */}
          <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-2xl p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <p className="font-bold text-cyan-300 text-sm mb-1">Production-Ready Architecture</p>
              This project is built with <strong className="text-white">React 18 + Vite</strong> on the frontend and a secure <strong className="text-white">Express Backend</strong>.
              All 13 subjects and chapters from ACS FRB-26 are embedded. Bunny CDN keys remain 100% hidden on the server.
            </div>
          </div>

          {/* Steps to deploy to Vercel */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-cyan-400" />
              How to Deploy to Vercel (Zero extra setup needed)
            </h4>
            <ol className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2 bg-slate-950/60 p-3 rounded-xl border border-white/5">
                <span className="font-mono font-black text-cyan-400">1.</span>
                <span>Push this code to your GitHub repository or click "Deploy with Vercel".</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-950/60 p-3 rounded-xl border border-white/5">
                <span className="font-mono font-black text-cyan-400">2.</span>
                <span>In your Vercel Project Dashboard, open <strong>Settings &rarr; Environment Variables</strong>.</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-950/60 p-3 rounded-xl border border-white/5">
                <span className="font-mono font-black text-cyan-400">3.</span>
                <span>Add the Bunny CDN token secret variables listed below.</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-950/60 p-3 rounded-xl border border-white/5">
                <span className="font-mono font-black text-cyan-400">4.</span>
                <span>Click <strong>Deploy</strong>. Vercel automatically builds both the Vite SPA and serverless API endpoints!</span>
              </li>
            </ol>
          </div>

          {/* Environment Variables */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Required Environment Variables for Vercel
            </h4>
            <div className="space-y-3">
              {envVariables.map((v) => (
                <div key={v.name} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-cyan-400 text-xs">{v.name}</span>
                    <button
                      onClick={() => copyToClipboard(v.name, v.name)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedKey === v.name ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Key</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">{v.desc}</p>
                  <div className="bg-slate-900 px-2.5 py-1.5 rounded-lg font-mono text-[11px] text-slate-300 border border-white/5">
                    {v.example}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Test Backend Signing */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              Live Backend Signing Endpoint Test
            </h4>
            <p className="text-[11px] text-slate-400 mb-3">
              Test sending a request to <code className="text-cyan-400 font-mono">/api/video/playback</code> to confirm your backend generates signed tokens.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
              <button
                onClick={handleRunTest}
                disabled={testing}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Test Backend'}
              </button>
            </div>

            {testResult && (
              <div className="mt-3 p-3 bg-black/50 border border-slate-800 rounded-xl font-mono text-[11px] overflow-x-auto max-h-40">
                <div className="text-slate-400 mb-1">
                  Status: <span className={testResult.ok ? 'text-emerald-400' : 'text-rose-400'}>{testResult.status}</span>
                </div>
                <pre className="text-slate-300">{JSON.stringify(testResult.data || testResult.error, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/50 flex items-center justify-between">
          <a
            href="https://vercel.com/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:underline"
          >
            <span>Vercel Documentation</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
