import React from "react";
import {
  HemmDumperIcon,
  FogVisibilityIcon,
  RadarSweepIcon,
  SafeCorridorIcon,
  TokenBlockIcon,
  BlindCurveIcon,
  JunctionIcon,
  HighwallEdgeIcon,
  NarrowRoadIcon,
  BrakingIcon,
  LoraCommsIcon,
  CanBusIcon,
  OccupancyGridIcon,
} from "../../icons/MiningIcons";
import { HelpCircle, ShieldCheck, Cpu, HardDrive } from "lucide-react";

export const HelpPage: React.FC = () => {
  const iconLegend = [
    { name: "HEMM Dumper", icon: <HemmDumperIcon className="w-6 h-6 text-emerald-400" />, desc: "Mining dumper truck marker" },
    { name: "Fog / Visibility", icon: <FogVisibilityIcon className="w-6 h-6 text-cyan-400" />, desc: "Reduced atmospheric visibility" },
    { name: "Radar Sweep", icon: <RadarSweepIcon className="w-6 h-6 text-amber-400" />, desc: "Radar perception sensor feed" },
    { name: "Safe Corridor", icon: <SafeCorridorIcon className="w-6 h-6 text-blue-400" />, desc: "Projected safe corridor path" },
    { name: "Token / Block", icon: <TokenBlockIcon className="w-6 h-6 text-purple-400" />, desc: "FOG-LOCK digital railway permission token" },
    { name: "Blind Curve", icon: <BlindCurveIcon className="w-6 h-6 text-amber-400" />, desc: "Blind curve sector (Block B1)" },
    { name: "Junction X-Pass", icon: <JunctionIcon className="w-6 h-6 text-purple-400" />, desc: "Crossing path intersection (Block B3)" },
    { name: "Highwall Edge", icon: <HighwallEdgeIcon className="w-6 h-6 text-red-400" />, desc: "Pit highwall / cliff margin (Block B4)" },
    { name: "Narrow Road", icon: <NarrowRoadIcon className="w-6 h-6 text-cyan-400" />, desc: "Narrow haul road segment (Block B2)" },
    { name: "Braking Skidmarks", icon: <BrakingIcon className="w-6 h-6 text-red-400" />, desc: "Active brake command & skid feedback" },
    { name: "LoRa Comms", icon: <LoraCommsIcon className="w-6 h-6 text-emerald-400" />, desc: "LoRa 433 MHz wireless link" },
    { name: "CAN Bus Link", icon: <CanBusIcon className="w-6 h-6 text-blue-400" />, desc: "High-speed wired vehicle CAN bus" },
    { name: "Occupancy Grid", icon: <OccupancyGridIcon className="w-6 h-6 text-cyan-400" />, desc: "Relative 5x5 occupancy perception grid" },
  ];

  const decisionLevels = [
    "1. EMERGENCY / IMMINENT COLLISION (TTC <= 1.0s in corridor -> EMERGENCY_BRAKING 0 km/h)",
    "2. CORRIDOR-BLOCKING HAZARD (Corridor blocked & Stopping Margin <= 0 -> BRAKE 0 km/h)",
    "3. CRITICAL TTC (TTC <= 2.0s -> BRAKE 0 km/h)",
    "4. INSUFFICIENT STOPPING DISTANCE (Available < Required -> BRAKE 0 km/h)",
    "5. CRITICAL SENSOR FAULT (Radar/Encoder missing or stale -> FAULT 0 km/h)",
    "6. FOG-LOCK CONFLICT (DENIED or Token invalid -> SLOW_DOWN 0 km/h)",
    "7. ROAD EDGE / HIGHWALL HAZARD (Clearance < 1.5m -> SLOW_DOWN 30% speed)",
    "8. INSUFFICIENT VEHICLE SEPARATION (Separation < Protected -> SLOW_DOWN 30% speed)",
    "9. WARNING TTC (TTC <= 4.0s -> SLOW_DOWN 30% speed)",
    "10. CAUTION TTC (TTC <= 6.0s -> SPEED_LIMIT 70% speed)",
    "11. ENVIRONMENT / COMM ADVISORY (Fog/Wet road/LoRa comm loss -> SPEED_LIMIT advisory)",
    "12. SAFE (All metrics within normal bounds -> PROCEED full speed)",
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Help, Documentation & Icon Legend
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            System Architecture, Deterministic Priority Sitemap, Custom SVG Legend, and BOM Mapping
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Custom SVG Icon Legend */}
        <div className="bg-[#1e293b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-4">
          <div className="text-xs font-bold uppercase text-slate-300 font-mono flex items-center gap-2 border-b border-slate-700 pb-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" /> Mining Icon Set Legend
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            {iconLegend.map((item) => (
              <div key={item.name} className="flex items-center gap-3 p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                <div className="p-1.5 bg-slate-800 rounded">{item.icon}</div>
                <div>
                  <div className="font-bold text-white">{item.name}</div>
                  <div className="text-[11px] text-slate-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 12-Level Deterministic Priority Sitemap */}
        <div className="bg-[#1e293b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-4">
          <div className="text-xs font-bold uppercase text-slate-300 font-mono flex items-center gap-2 border-b border-slate-700 pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> 12-Level Deterministic Hierarchy
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            {decisionLevels.map((lvl, idx) => (
              <div key={idx} className="p-2 bg-slate-900/60 rounded border border-slate-800 text-slate-300">
                {lvl}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hardware BOM Mapping Section */}
      <div className="bg-[#1e293b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-3 font-mono text-xs">
        <div className="text-xs font-bold uppercase text-slate-300 flex items-center gap-2 border-b border-slate-700 pb-2">
          <HardDrive className="w-4 h-4 text-cyan-400" /> Physical Prototype Hardware BOM Mapping
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-slate-900 p-3 rounded border border-slate-800">
            <span className="text-slate-400">Microcontroller:</span>
            <div className="text-emerald-400 font-bold mt-0.5">ESP32-WROOM-32 (Dual Core 240MHz)</div>
          </div>
          <div className="bg-slate-900 p-3 rounded border border-slate-800">
            <span className="text-slate-400">Perception Sensors:</span>
            <div className="text-amber-400 font-bold mt-0.5">24GHz Doppler Radar / LiDAR Feed</div>
          </div>
          <div className="bg-slate-900 p-3 rounded border border-slate-800">
            <span className="text-slate-400">Wireless Comms:</span>
            <div className="text-purple-400 font-bold mt-0.5">SX1278 LoRa Transceiver (433 MHz)</div>
          </div>
          <div className="bg-slate-900 p-3 rounded border border-slate-800">
            <span className="text-slate-400">Speed Encoder:</span>
            <div className="text-cyan-400 font-bold mt-0.5">Hall Effect Wheel Pulse Encoder</div>
          </div>
          <div className="bg-slate-900 p-3 rounded border border-slate-800">
            <span className="text-slate-400">Power Pack:</span>
            <div className="text-white font-bold mt-0.5">2S LiPo 7.4V Prototype Pack</div>
          </div>
          <div className="bg-slate-900 p-3 rounded border border-slate-800">
            <span className="text-slate-400">Actuator Drive:</span>
            <div className="text-red-400 font-bold mt-0.5">PWM Motor Drive & Brake Actuator</div>
          </div>
        </div>
      </div>
    </div>
  );
};
