import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BarChart3, ShieldCheck, Activity, Timer } from "lucide-react";

export const SafetyAnalyticsPage: React.FC = () => {
  // Mock data for Safety Analytics charts
  const eventTrendsData = [
    { hour: "08:00", caution: 4, warning: 2, critical: 0 },
    { hour: "09:00", caution: 7, warning: 3, critical: 1 },
    { hour: "10:00", caution: 5, warning: 1, critical: 0 },
    { hour: "11:00", caution: 9, warning: 4, critical: 2 },
    { hour: "12:00", caution: 3, warning: 0, critical: 0 },
    { hour: "13:00", caution: 6, warning: 2, critical: 1 },
  ];

  const ttcHistogramData = [
    { range: "< 1.0s", count: 2 },
    { range: "1.0 - 2.0s", count: 5 },
    { range: "2.0 - 4.0s", count: 12 },
    { range: "4.0 - 6.0s", count: 24 },
    { range: "> 6.0s", count: 48 },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Safety Analytics & Performance Metrics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Historical Incident Metrics, TTC Histograms, and Brake Verification Statistics
          </p>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#1e293b] border border-slate-700 p-4 rounded-xl">
          <span className="text-xs uppercase font-bold text-slate-400 font-mono">Total Braking Events</span>
          <div className="text-2xl font-black font-mono text-white mt-1">14</div>
          <span className="text-[10px] text-emerald-400 font-mono">100% Brake Verified</span>
        </div>

        <div className="bg-[#1e293b] border border-slate-700 p-4 rounded-xl">
          <span className="text-xs uppercase font-bold text-slate-400 font-mono">Critical TTC Events</span>
          <div className="text-2xl font-black font-mono text-red-400 mt-1">3</div>
          <span className="text-[10px] text-slate-400 font-mono">TTC &lt; 2.0s</span>
        </div>

        <div className="bg-[#1e293b] border border-slate-700 p-4 rounded-xl">
          <span className="text-xs uppercase font-bold text-slate-400 font-mono">Near-Miss Avoidance</span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">100%</div>
          <span className="text-[10px] text-emerald-400 font-mono">0 Incidents</span>
        </div>

        <div className="bg-[#1e293b] border border-slate-700 p-4 rounded-xl">
          <span className="text-xs uppercase font-bold text-slate-400 font-mono">System Uptime</span>
          <div className="text-2xl font-black font-mono text-cyan-400 mt-1">99.98%</div>
          <span className="text-[10px] text-cyan-400 font-mono">LoRa Node Sync</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Events per Hour Trend Chart */}
        <div className="bg-[#1e293b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Safety Events per Hour
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={eventTrendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#475569" }} />
                <Line type="monotone" dataKey="caution" stroke="#f59e0b" name="Caution Events" />
                <Line type="monotone" dataKey="warning" stroke="#f97316" name="Warning Events" />
                <Line type="monotone" dataKey="critical" stroke="#ef4444" name="Critical Events" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TTC Range Histogram Chart */}
        <div className="bg-[#1e293b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
            <span className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-amber-400" /> Time-To-Collision Distribution Histogram
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ttcHistogramData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="range" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#475569" }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Occurrences" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
