import React from "react";
import { useVehicleStore } from "../../../store/vehicleStore";
import { useAuthStore } from "../../../auth/authStore";
import { Key, Lock, ShieldCheck, AlertCircle } from "lucide-react";

export const MovementTokensPage: React.FC = () => {
  const { tokens, forceRestrictVehicle } = useVehicleStore();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Digital Movement Tokens Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Cryptographic Sequence Tokens Issued for FOG-LOCK Digital Blocks
          </p>
        </div>

        <div className="bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-mono p-2 rounded-lg max-w-md">
          <strong className="font-bold">RULE:</strong> Tokens are system-computed only. Manual token issuance is prohibited. Operators may only issue Force Restrict actions.
        </div>
      </div>

      {/* Token Ledger Table Card */}
      <div className="bg-[#1e293b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-bold uppercase text-slate-300 tracking-wider">
            <Key className="w-4 h-4 text-purple-400" /> Active & Historical Token Ledger
          </span>
          <span className="text-xs font-mono text-slate-400">
            Total Tokens: {tokens.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-3">Token ID</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Block ID</th>
                <th className="p-3">Direction</th>
                <th className="p-3">Issued Time</th>
                <th className="p-3">Expiry Time</th>
                <th className="p-3">Sequence</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Operator Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {tokens.map((t) => (
                <tr key={t.tokenId} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-purple-300">{t.tokenId}</td>
                  <td className="p-3 font-bold text-white">{t.vehicleId}</td>
                  <td className="p-3 text-cyan-300 font-bold">{t.blockId}</td>
                  <td className="p-3">{t.direction}</td>
                  <td className="p-3 text-slate-400">{new Date(t.issuedAt).toLocaleTimeString()}</td>
                  <td className="p-3 text-slate-400">{new Date(t.expiresAt).toLocaleTimeString()}</td>
                  <td className="p-3">#{t.sequence}</td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        t.status === "VALID"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                          : "bg-red-950 text-red-300 border border-red-500/40"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {t.status === "VALID" ? (
                      <button
                        onClick={() => {
                          const currentUser = useAuthStore.getState().user;
                          const opStr = currentUser ? `${currentUser.name} (${currentUser.role})` : "Operator Action";
                          forceRestrictVehicle(t.vehicleId, opStr);
                        }}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-mono text-[11px] font-bold rounded flex items-center gap-1 ml-auto transition-all"
                      >
                        <Lock className="w-3.5 h-3.5" /> REVOKE TOKEN
                      </button>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">REVOKED</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
