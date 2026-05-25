import { useState, useRef, useEffect } from "react";
import { GatewayResponse, MetricData } from "../types";
import { Play, Activity, Clock, Server, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface ApiTesterProps {
  activeToken: string | null;
}

interface LogEntry {
  id: string;
  timestamp: number;
  status: number;
  response: GatewayResponse;
  headers: Record<string, string>;
}

export default function ApiTester({ activeToken }: ApiTesterProps) {
  const [path, setPath] = useState("/users/profile");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  const makeRequest = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (activeToken) {
        headers["Authorization"] = `Bearer ${activeToken}`;
      }

      const res = await fetch(`/api/gateway${path}`, { headers });
      const data = await res.json();
      
      const newLog: LogEntry = {
        id: Math.random().toString(36).substring(7),
        timestamp: start,
        status: res.status,
        response: data,
        headers: {
          limit: res.headers.get("x-ratelimit-limit") || "-",
          remaining: res.headers.get("x-ratelimit-remaining") || "-",
        }
      };

      setLogs((prev) => [newLog, ...prev].slice(0, 50)); // Keep last 50
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLogs([]);
  }, [activeToken]);

  const latestLog = logs[0];
  const rateLimitStatus = latestLog?.headers ? 
    Number(latestLog.headers.remaining) / Number(latestLog.headers.limit) : 1;

  return (
    <div className="bg-[#141518] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full">
      <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Gateway Simulation
        </h2>
        {activeToken ? (
          <span className="flex items-center gap-1 text-emerald-400 text-[10px] tracking-wider uppercase font-bold">
            <ShieldCheck className="w-3 h-3" /> Token Attached
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-500 text-[10px] tracking-wider uppercase font-bold">
            <AlertTriangle className="w-3 h-3" /> No Auth
          </span>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col min-h-0">
        <div className="flex gap-3 mb-6">
          <div className="flex-1 flex overflow-hidden rounded-xl border border-white/10 bg-black/20 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
            <span className="px-4 border-r border-white/10 bg-white/[0.02] text-slate-400 text-sm flex items-center font-mono">
              GET /api/gateway
            </span>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="flex-1 px-4 py-3 outline-none font-mono text-sm bg-transparent text-white placeholder-slate-600"
              placeholder="/users/profile"
            />
          </div>
          <button
            onClick={makeRequest}
            disabled={loading}
            className="bg-white/10 hover:bg-white/15 border border-white/5 text-white font-medium px-6 py-3 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 flex-shrink-0 backdrop-blur-sm"
          >
            {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Play className="fill-current w-4 h-4" />}
            Send Request
          </button>
        </div>

        {/* Real-time metrics panel */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <MetricCard 
            title="Gateway Hop Latency" 
            value={latestLog?.response.metrics?.gatewayLatencyMs != null ? `${latestLog.response.metrics.gatewayLatencyMs}` : "-"}
            unit="ms"
          />
          <MetricCard 
            title="Upstream Latency" 
            value={latestLog?.response.metrics?.upstreamLatencyMs != null ? `${latestLog.response.metrics.upstreamLatencyMs}` : "-"}
            unit="ms"
          />
          <div className="bg-[#1A1C20] border border-white/5 rounded-xl p-5 relative overflow-hidden shadow-inner flex flex-col justify-between">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Rate Limit
            </div>
            <div className="flex items-end gap-2">
              <h2 className="text-3xl font-light text-white font-mono">
                {latestLog ? `${latestLog.headers.remaining} / ${latestLog.headers.limit}` : "-"}
              </h2>
            </div>
            {latestLog && (
              <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full">
                <div 
                  className={cn("h-full transition-all duration-500", 
                    rateLimitStatus > 0.5 ? "bg-emerald-500" : rateLimitStatus > 0.2 ? "bg-amber-500" : "bg-rose-500")}
                  style={{ width: `${Math.max(0, rateLimitStatus * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 border border-white/5 rounded-xl bg-black/20 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span>Network Traffic Log</span>
            <span>{logs.length} Requests</span>
          </div>
          <div className="flex-1 overflow-y-auto p-0 font-mono text-[11px]">
            <table className="w-full">
              <thead className="bg-white/[0.01] text-slate-500 text-left hidden md:table-header-group sticky top-0 backdrop-blur-md z-10">
                <tr>
                  <th className="px-5 py-3 font-medium">TIMESTAMP</th>
                  <th className="px-5 py-3 font-medium">PATH</th>
                  <th className="px-5 py-3 font-medium">METRICS</th>
                  <th className="px-5 py-3 font-medium text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="text-slate-400">
                <AnimatePresence>
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-slate-600 text-center py-12 font-sans text-sm">
                        No requests sent yet. Generate a token and send a request.
                      </td>
                    </tr>
                  )}
                  {logs.map((log) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, backgroundColor: "rgba(255,255,255,0.05)" }}
                      animate={{ opacity: 1, backgroundColor: "transparent" }}
                      className={cn(
                        "border-b border-white/5 hover:bg-white/[0.02] transition-colors flex flex-col md:table-row",
                        log.status === 429 && "bg-amber-500/[0.02] hover:bg-amber-500/[0.04]",
                        log.status !== 200 && log.status !== 429 && "bg-rose-500/[0.02] hover:bg-rose-500/[0.04]"
                      )}
                    >
                      <td className="px-5 py-3 md:py-4 border-b border-white/5 md:border-0 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit', fractionalSecondDigits: 3 })}
                      </td>
                      <td className="px-5 py-3 md:py-4 text-indigo-300 border-b border-white/5 md:border-0 truncate max-w-[200px]">
                        GET {path}
                      </td>
                      <td className="px-5 py-3 md:py-4 border-b border-white/5 md:border-0">
                        {log.status === 200 && log.response.metrics ? (
                          <span className="flex items-center gap-3">
                            <span className="text-slate-500">Hop: <span className="text-indigo-400">{log.response.metrics.gatewayLatencyMs}ms</span></span>
                            <span className="text-slate-500">Up: <span className="text-emerald-400">{log.response.metrics.upstreamLatencyMs}ms</span></span>
                          </span>
                        ) : log.status === 429 ? (
                           <span className="text-amber-500/70 truncate max-w-[200px] block">{log.response.message}</span>
                        ) : (
                           <span className="text-rose-500/70 truncate max-w-[200px] block">{log.response.error}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 md:py-4 text-left md:text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded-sm font-medium tracking-wider text-[10px]",
                          log.status === 200 ? "bg-emerald-500/10 text-emerald-400" :
                          log.status === 429 ? "bg-amber-500/10 text-amber-500" :
                          "bg-rose-500/10 text-rose-500"
                        )}>
                          {log.status === 200 ? "AUTHORIZED" : log.status === 429 ? "RATE_LIMITED" : "DENIED"}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit }: { title: string; value: string; unit?: string }) {
  return (
    <div className="bg-[#1A1C20] border border-white/5 p-5 rounded-xl shadow-inner flex flex-col justify-between">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{title}</p>
      <div className="flex items-end gap-1">
        <h2 className="text-3xl font-light text-white font-mono">{value}</h2>
        {unit && value !== "-" && <span className="text-sm text-slate-500 font-mono pb-1">{unit}</span>}
      </div>
    </div>
  );
}
