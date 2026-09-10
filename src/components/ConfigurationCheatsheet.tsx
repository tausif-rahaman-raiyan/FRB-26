import { useState } from 'react';
import { Settings, Check, ExternalLink, ShieldAlert, Sparkles, Key } from 'lucide-react';

export function ConfigurationCheatsheet() {
  const [testKey, setTestKey] = useState('sample-bunny-security-key');
  const [testHost, setTestHost] = useState('vz-cb5996f0-784.b-cdn.net');
  const [testUuid, setTestUuid] = useState('190baa47-1c4d-458e-9755-4673aa6293c3');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const handleSimulateToken = () => {
    const expires = Math.floor(Date.now() / 1000) + 7200;
    const path = `/${testUuid}/playlist.m3u8`;
    // Quick demo token simulation
    const dummyHash = btoa(`${testKey}${testUuid}${expires}`).replace(/=/g, '').slice(0, 24);
    setGeneratedUrl(`https://${testHost}${path}?token=${dummyHash}&expires=${expires}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <Settings className="w-4 h-4" /> Production Checklist
        </div>
        <h3 className="text-xl font-bold text-white mb-2">5 Key Configuration Values</h3>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          To connect your deployed Vercel backend with your Blogger frontend and Bunny CDN, configure these five values:
        </p>

        <div className="mt-6 space-y-4">
          {/* Item 1 */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">1. BUNNY HOSTNAME</span>
                <p className="text-xs text-slate-300 mt-1 font-semibold">vz-cb5996f0-784.b-cdn.net</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Located in your Bunny.net dashboard under <strong>Stream &rarr; Video Libraries</strong> or <strong>CDN &rarr; Pull Zones</strong>.
                </p>
              </div>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-1 rounded-md font-mono">
                Server &amp; Client
              </span>
            </div>
          </div>

          {/* Item 2 */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">2. VIDEO PATH FORMAT</span>
                <p className="text-xs text-slate-300 mt-1 font-semibold">/{'{video-guid}'}/playlist.m3u8</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Example: <code>/190baa47-1c4d-458e-9755-4673aa6293c3/playlist.m3u8</code>. Your existing code already adheres to this format!
                </p>
              </div>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-1 rounded-md font-mono">
                Standard HLS
              </span>
            </div>
          </div>

          {/* Item 3 */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">3. COURSE ID</span>
                <p className="text-xs text-slate-300 mt-1 font-semibold">acs-frb-26</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sent from the player in <code>BACKEND_CONFIG.courseId</code>. The backend verifies this against the user's enrollment before issuing playback signatures.
                </p>
              </div>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-1 rounded-md font-mono">
                RBAC Entitlement
              </span>
            </div>
          </div>

          {/* Item 4 */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">4. BACKEND API URL</span>
                <p className="text-xs text-slate-300 mt-1 font-semibold">https://your-vercel-app.vercel.app</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Once your Vercel project is created, copy your Vercel deployment domain and paste it into line 68 of your Blogger XML template: <code>apiBaseUrl: 'https://...'</code>.
                </p>
              </div>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-1 rounded-md font-mono">
                Blogger Template
              </span>
            </div>
          </div>

          {/* Item 5 */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">5. BUNNY SIGNING SECRET</span>
                <p className="text-xs text-slate-300 mt-1 font-semibold">BUNNY_TOKEN_SECURITY_KEY</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  In Bunny dashboard &rarr; Pull Zone / Stream &rarr; Security &rarr; Enable <strong>Token Authentication</strong> &rarr; Copy the Security Key into Vercel environment variables.
                </p>
              </div>
              <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2.5 py-1 rounded-md font-mono">
                Server Only Secret
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Token Signature Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Key className="w-4 h-4 text-cyan-400" />
          Test Token Signing Logic
        </h4>
        <p className="text-xs text-slate-400 mb-4">
          Test how a video path and security key are signed into a short-lived Bunny HLS playback link:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Hostname</label>
            <input
              type="text"
              value={testHost}
              onChange={e => setTestHost(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Video GUID</label>
            <input
              type="text"
              value={testUuid}
              onChange={e => setTestUuid(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Security Key</label>
            <input
              type="password"
              value={testKey}
              onChange={e => setTestKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
            />
          </div>
        </div>

        <button
          onClick={handleSimulateToken}
          className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
        >
          Compute Test Tokenized URL
        </button>

        {generatedUrl && (
          <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 break-all">
            {generatedUrl}
          </div>
        )}
      </div>
    </div>
  );
}
