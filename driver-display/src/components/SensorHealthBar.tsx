import React from "react";
import { RawEnvironmentData, SensorHealth } from "../data/types";
import { Activity, Cpu, Radio, Disc, CloudRain } from "lucide-react";

interface SensorHealthBarProps {
  health: SensorHealth;
  environment: RawEnvironmentData;
}

export const SensorHealthBar: React.FC<SensorHealthBarProps> = ({ health, environment }) => {
  const sensors = [
    { name: "RADAR", ok: health.radarValid, icon: <Activity className="w-3.5 h-3.5" /> },
    { name: "ENCODER", ok: health.encoderValid, icon: <Cpu className="w-3.5 h-3.5" /> },
    { name: "CAN BUS", ok: health.canValid, icon: <Activity className="w-3.5 h-3.5" /> },
    { name: "LORA LINK", ok: health.loraValid, icon: <Radio className="w-3.5 h-3.5" /> },
    { name: "BRAKE ACT", ok: health.brakeValid, icon: <Disc className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="bg-hud-card border border-hud-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Sensor Health Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase font-bold text-gray-400 mr-2">Sensors:</span>
        {sensors.map((s) => (
          <div
            key={s.name}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
              s.ok
                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                : "bg-red-950/80 border-red-500/80 text-red-200 animate-pulse"
            }`}
          >
            {s.icon}
            <span>{s.name}</span>
            <span className="text-[10px] uppercase font-bold">
              {s.ok ? "OK" : "FAULT"}
            </span>
          </div>
        ))}
      </div>

      {/* Environmental Badge */}
      <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 text-xs font-mono">
        <CloudRain className="w-4 h-4 text-cyan-400" />
        <span className="text-gray-400">Weather:</span>
        <span className="text-cyan-300 font-bold">{environment.weather}</span>
        <span className="text-gray-500">|</span>
        <span className="text-gray-400">Vis:</span>
        <span className="text-amber-300 font-bold">{environment.visibility}</span>
      </div>
    </div>
  );
};
