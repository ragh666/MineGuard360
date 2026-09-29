import React, { useState } from "react";
import { SyntheticVehicleInfo, useVehicleStore } from "../../../store/vehicleStore";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Truck, Cpu, ShieldCheck, Battery, Radio, Gauge } from "lucide-react";
import { CanBusIcon } from "../../icons/MiningIcons";

export const FleetMonitorPage: React.FC = () => {
  const {
    getFleetVehicles,
    isFleetScalePreview,
    toggleFleetScalePreview,
    raw,
    calculated,
    decision,
  } = useVehicleStore();

  const fleet = getFleetVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("V01");

  const selectedVehicle =
    fleet.find((v) => v.vehicleId === selectedVehicleId) ?? fleet[0];

  // Mock trend chart data for telemetry history
  const trendData = [
    { time: "14:00", speed: 28, ttc: 8.5, risk: 15 },
    { time: "14:01", speed: 25, ttc: 6.2, risk: 25 },
    { time: "14:02", speed: 20, ttc: 4.5, risk: 45 },
    { time: "14:03", speed: 12, ttc: 2.8, risk: 65 },
    { time: "14:04", speed: 0, ttc: 1.2, risk: 85 },
  ];

  return (
    <div className="space-y-5">
      {/* Header Bar with Scale Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Fleet Safety & Telemetry Monitor
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Real-Time Vehicle Safety Telemetry & Communication Links
          </p>
        </div>

        <button
          onClick={toggleFleetScalePreview}
          className={`px-3.5 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all ${
            isFleetScalePreview
              ? "bg-purple-950/80 border-purple-500 text-purple-200"
              : "bg-slate-800 border-slate-600 text-slate-300"
          }`}
        >
          {isFleetScalePreview ? "PREVIEW SCALE (V01-V06 @ 24V)" : "PROTOTYPE REAL SCALE (V01-V02 @ 7.4V LiPo)"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Fleet Vehicle Table (Left 1 Col) */}
        <div className="bg-[#1e293b] border border-slate-700/80 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-700 pb-2">
            <span>Fleet Roster ({fleet.length})</span>
            <span>Scale: {isFleetScalePreview ? "24V Dumper" : "7.4V Pack"}</span>
          </div>

          <div className="space-y-2">
            {fleet.map((v) => {
              const isSelected = v.vehicleId === selectedVehicleId;
              return (
                <div
                  key={v.vehicleId}
                  onClick={() => setSelectedVehicleId(v.vehicleId)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-emerald-950/60 border-emerald-500 text-white shadow-md"
                      : "bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg">
                      <Truck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-bold font-mono text-sm">{v.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Block: <strong className="text-slate-200">{v.blockId}</strong> • {v.speedKmh} km/h
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span
                      className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                        v.status === "SAFE"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                          : v.status === "CRITICAL" || v.status === "EMERGENCY"
                          ? "bg-red-950 text-red-300 border border-red-500/40"
                          : "bg-amber-950 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {v.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">TTC: {v.ttcSeconds ?? "--"}s</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Vehicle Detail Drawer (Right 2 Cols) */}
        <div className="lg:col-span-2 bg-[#1e293b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black font-mono text-white">
                    {selectedVehicle.name}
                  </h3>
                  {selectedVehicle.isPrototypeReal ? (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      PHYSICAL PROTOTYPE
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
                      SYNTHETIC PREVIEW
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Telemetry Feed Node ID: <span className="text-white">{selectedVehicle.vehicleId}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                <Battery className="w-4 h-4 text-emerald-400" />
                <span>Voltage: <strong className="text-white">{selectedVehicle.batteryVoltageV}V</strong></span>
              </div>
            </div>
          </div>

          {/* AI Risk Advisory vs Deterministic State Comparison Card */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs uppercase font-bold text-purple-300">
                <Cpu className="w-4 h-4" /> AI Risk Advisory Score
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black font-mono text-purple-200">
                  {selectedVehicle.aiRiskScore}
                </span>
                <span className="text-xs font-bold text-slate-400">/ 100 ({selectedVehicle.aiRiskLevel})</span>
              </div>
              <span className="text-[10px] text-purple-400 font-mono block mt-1">ADVISORY ONLY — NO CONTROL AUTHORITY</span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs uppercase font-bold text-emerald-300">
                <ShieldCheck className="w-4 h-4" /> Deterministic Final Decision
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-mono uppercase text-emerald-400">
                  {selectedVehicle.status}
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono block mt-1">100% DETERMINISTIC OVERRIDE AUTHORITY</span>
            </div>
          </div>

          {/* Communication & Node Health Panel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-400 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-blue-400" /> LoRa RSSI:
              </div>
              <div className="text-sm font-bold text-white mt-1">-88 dBm (SNR 9.2)</div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-400 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-amber-400" /> Encoder Speed:
              </div>
              <div className="text-sm font-bold text-white mt-1">{selectedVehicle.speedKmh} km/h</div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-400">Stopping Margin:</div>
              <div className="text-sm font-bold text-emerald-400 mt-1">
                {calculated.stoppingDistanceMarginM !== null ? `${calculated.stoppingDistanceMarginM} m` : "--"}
              </div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-400">Controller Node:</div>
              <div className="text-sm font-bold text-emerald-400 mt-1">ESP32 ONLINE</div>
            </div>
          </div>

          {/* CAN Bus / SAE J1939 Telemetry Protocol Matrix Card */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700 space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-400">
                <CanBusIcon className="w-4 h-4 text-emerald-400" />
                <span>CAN Bus / SAE J1939 Telemetry Protocol Matrix</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-500/30">
                250 kbps J1939 BUS ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">SPN 84 — Vehicle Speed</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {selectedVehicle.speedKmh} km/h
                </div>
                <div className="text-[9px] text-emerald-400">PGN 65265 (CCVS)</div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">SPN 190 — Engine Speed (RPM)</div>
                <div className="text-base font-bold text-cyan-300 mt-0.5">
                  {raw.vehicle.engineRpm ?? 1450} RPM
                </div>
                <div className="text-[9px] text-cyan-400">PGN 61444 (EEC1)</div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">SPN 91 — Throttle Position</div>
                <div className="text-base font-bold text-amber-300 mt-0.5">
                  {raw.vehicle.throttlePercent ?? 35}%
                </div>
                <div className="text-[9px] text-amber-400">PGN 61443 (EEC2)</div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">SPN 597 — Brake Switch</div>
                <div className={`text-base font-bold mt-0.5 ${raw.vehicle.brakeApplied ? "text-red-400" : "text-emerald-400"}`}>
                  {raw.vehicle.brakeApplied ? "ACTIVE (APPLIED)" : "INACTIVE"}
                </div>
                <div className="text-[9px] text-slate-400">PGN 65265 (CCVS)</div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">SPN 523 — Transmission Gear</div>
                <div className="text-base font-bold text-purple-300 mt-0.5">
                  {raw.vehicle.gear ?? "FORWARD 3"}
                </div>
                <div className="text-[9px] text-purple-400">PGN 65272 (ETC1)</div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">DM1 Active Diagnostics</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5 truncate">
                  {raw.sensorHealth.canValid ? "0 FAULTS (NORMAL)" : "DTC 84-2: CAN TIMEOUT"}
                </div>
                <div className="text-[9px] text-slate-400">PGN 65226 (DM1)</div>
              </div>
            </div>
          </div>

          {/* Telemetry Trend Chart (Recharts) */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 space-y-2">
            <div className="text-xs font-bold uppercase text-slate-300 font-mono">
              Telemetry Trend History (Last 5 Mins)
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#475569" }} />
                  <Line type="monotone" dataKey="speed" stroke="#3b82f6" strokeWidth={2} name="Speed (km/h)" />
                  <Line type="monotone" dataKey="ttc" stroke="#f59e0b" strokeWidth={2} name="TTC (s)" />
                  <Line type="monotone" dataKey="risk" stroke="#a855f7" strokeWidth={2} name="AI Risk Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
