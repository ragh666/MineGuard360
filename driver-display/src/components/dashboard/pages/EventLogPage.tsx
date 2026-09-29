import React, { useState } from "react";
import { useVehicleStore } from "../../../store/vehicleStore";
import { History, Download, Trash2, Search } from "lucide-react";

export const EventLogPage: React.FC = () => {
  const { eventLog, clearEventLog } = useVehicleStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  const filteredEvents = eventLog.filter((evt) => {
    const matchesSearch =
      evt.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.newState.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.reasonCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity =
      severityFilter === "ALL" || evt.newState === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const exportCsv = () => {
    if (eventLog.length === 0) return;

    const headers = "EventID,Timestamp,Vehicle,PrevState,NewState,ReasonCode,Action,TTC,Distance\n";
    const rows = eventLog
      .map(
        (e) =>
          `"${e.id}","${e.timestampStr}","${e.vehicleId}","${e.previousState}","${e.newState}","${e.reasonCode}","${e.finalAction}","${e.ttcSeconds ?? ""}","${e.distanceM ?? ""}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `fog_hemm_event_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Audit Event Stream & Safety Log
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Immutable Audit Ledger of Vehicle Safety State Transitions
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={exportCsv}
            disabled={eventLog.length === 0}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-md"
          >
            <Download className="w-4 h-4" /> EXPORT CSV
          </button>

          <button
            onClick={clearEventLog}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg flex items-center gap-1.5 transition-all border border-slate-700"
          >
            <Trash2 className="w-4 h-4 text-red-400" /> CLEAR LOG
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-[#1e293b] border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search events or reasons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Filter State:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg font-bold focus:outline-none"
          >
            <option value="ALL">ALL STATES</option>
            <option value="SAFE">SAFE</option>
            <option value="CAUTION">CAUTION</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="EMERGENCY">EMERGENCY</option>
            <option value="FAULT">FAULT</option>
          </select>
        </div>
      </div>

      {/* Event Stream Table */}
      <div className="bg-[#1e293b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-700 pb-2">
          <span>Logged Transitions ({filteredEvents.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Transition</th>
                <th className="p-3">Reason Code</th>
                <th className="p-3">Reason Description</th>
                <th className="p-3">Action</th>
                <th className="p-3 text-right">TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-500 italic">
                    No safety event transitions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/40">
                    <td className="p-3 text-slate-400">{evt.timestampStr}</td>
                    <td className="p-3 font-bold text-white">{evt.vehicleId}</td>
                    <td className="p-3 font-bold">
                      <span className="text-slate-400">{evt.previousState}</span>
                      <span className="mx-1">→</span>
                      <span
                        className={
                          evt.newState === "EMERGENCY" || evt.newState === "CRITICAL"
                            ? "text-red-400 font-extrabold"
                            : evt.newState === "WARNING"
                            ? "text-orange-400"
                            : "text-emerald-400"
                        }
                      >
                        {evt.newState}
                      </span>
                    </td>
                    <td className="p-3 text-amber-300 font-bold">{evt.reasonCode}</td>
                    <td className="p-3 text-slate-300">{evt.reason}</td>
                    <td className="p-3 font-bold text-cyan-300">{evt.finalAction}</td>
                    <td className="p-3 text-right font-bold">
                      {evt.ttcSeconds !== null ? `${evt.ttcSeconds}s` : "--"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
