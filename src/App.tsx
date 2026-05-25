import { useState } from "react";
import TokenManager from "./components/TokenManager";
import ApiTester from "./components/ApiTester";
import { UserPayload } from "./types";
import { ShieldCheck, Network } from "lucide-react";

export default function App() {
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserPayload | null>(null);

  const handleTokenGenerated = (token: string, payload: UserPayload) => {
    setActiveToken(token);
    setCurrentUser(payload);
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-8 flex flex-shrink-0 items-center justify-between border-b border-white/10 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Network className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white mb-0.5">
              Gateway<span className="text-indigo-400">Matrix</span>
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Edge Auth & Rate Limiting | v1.0.0
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#141518] border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 text-xs font-medium text-emerald-500 uppercase tracking-widest">
             <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
             Active JWT: {currentUser ? <span className="font-mono text-white">{currentUser.userId}</span> : <span className="text-slate-500 uppercase tracking-widest font-sans">None</span>}
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 p-8 w-full overflow-hidden flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow min-h-0">
          {/* Left Column - Controls (Token Manager) */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2">
            <div className="text-sm text-slate-400 leading-relaxed mb-2">
              <p>
                This lab simulates a minimal API gateway. Watch how the gateway decodes JSON Web Tokens to determine the user tier and applies dynamic token-bucket rate limits, adding minimal latency before forwarding requests to the upstream mock service.
              </p>
            </div>
            <TokenManager onTokenGenerated={handleTokenGenerated} />
          </div>

          {/* Right Column - Console/Simulation */}
          <div className="lg:col-span-8 h-full min-h-0 flex flex-col">
             <ApiTester activeToken={activeToken} />
          </div>
        </div>
      </main>
      
      <footer className="flex items-center justify-between text-[10px] text-slate-600 font-mono tracking-widest py-3 px-8 border-t border-white/5 flex-shrink-0">
        <div className="flex gap-8">
          <span>ENCRYPTION: AES-256-GCM</span>
          <span>JWT_ALGO: HS256</span>
          <span>EDGE_NODE: ASIA-SE-1</span>
        </div>
        <div className="text-indigo-500">SYSTEM SECURE | END-TO-END VERIFIED</div>
      </footer>
    </div>
  );
}
