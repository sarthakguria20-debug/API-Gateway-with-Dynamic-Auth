import { useState } from "react";
import { UserPayload } from "../types";
import { Copy, RefreshCw, Key, Shield } from "lucide-react";
import { motion } from "motion/react";

interface TokenManagerProps {
  onTokenGenerated: (token: string, payload: UserPayload) => void;
}

export default function TokenManager({ onTokenGenerated }: TokenManagerProps) {
  const [userId, setUserId] = useState(`user-${Math.floor(Math.random() * 1000)}`);
  const [tier, setTier] = useState<"free" | "pro">("free");
  const [loading, setLoading] = useState(false);
  const [currentItem, setCurrentItem] = useState<{ token: string; payload: UserPayload } | null>(null);

  const generateToken = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, tier }),
      });
      const data = await res.json();
      if (data.token) {
        setCurrentItem(data);
        onTokenGenerated(data.token, data.payload);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const copyToken = () => {
    if (currentItem?.token) {
      navigator.clipboard.writeText(currentItem.token);
    }
  };

  return (
    <div className="bg-[#141518] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col flex-shrink-0">
      <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-indigo-400" />
          Access Control
        </h2>
        {tier === "pro" ? (
          <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 rounded-sm font-medium flex items-center gap-1 uppercase tracking-wider">
            <Shield className="w-3 h-3" /> Pro Tier
          </span>
        ) : (
          <span className="bg-slate-500/10 text-slate-400 text-[10px] px-2 py-0.5 rounded-sm font-medium uppercase tracking-wider">
            Free Tier
          </span>
        )}
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase font-semibold text-slate-500 tracking-wider mb-2">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm font-mono outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-semibold text-slate-500 tracking-wider mb-2">API Tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as "free" | "pro")}
              className="w-full px-3 py-2 bg-[#1A1C20] border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm outline-none"
            >
              <option value="free">Free (5 req/min)</option>
              <option value="pro">Pro (50 req/min)</option>
            </select>
          </div>
        </div>

        <button
          onClick={generateToken}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-500/20"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin text-white/70" /> : "Generate JWT Credentials"}
        </button>

        {currentItem && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="pt-4 border-t border-white/10"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                Active JSON Web Token
              </span>
              <button
                onClick={copyToken}
                className="text-slate-400 hover:text-white transition-colors p-1"
                aria-label="Copy token"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3 overflow-x-auto relative group">
              <code className="text-[11px] font-mono text-emerald-400/90 break-all block whitespace-pre-wrap leading-relaxed">
                {currentItem.token}
              </code>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
