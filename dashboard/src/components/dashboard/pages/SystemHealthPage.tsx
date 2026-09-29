import React from "react";
import { useVehicleStore } from "../../../store/vehicleStore";
import {
  RadarSweepIcon,
  LoraCommsIcon,
  CanBusIcon,
  BrakingIcon,
} from "../../icons/MiningIcons";
import { Activity, Cpu, Gauge, Radio } from "lucide-react";

export const SystemHealthPage: React.FC = () => {
  const { raw } = useVehicleStore();

  const nodes = [
    {
      name: "ESP32 Primary Vehicle Controller (V01)",
      type: "ESP32 Hardware Node",
      ok: raw.sensorHealth.encoderValid && raw.sensorHealth.canValid,
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      bus: "Wired CAN / Internal SPI",
    },
    {
      name: "FOG-LOCK Sector Coordinator Node",
      type: "ESP32 Hardware Node",
      ok: raw.sensorHealth.loraValid,
      icon: <Radio className="w-5 h-5 text-purple-400" />,
      bus: "LoRa Transceiver (433 MHz)",
    },
    {
      name: "Short-Range Doppler Radar / LiDAR Sensor",
      type: "Radar Transceiver Feed",
      ok: raw.sensorHealth.radarValid,
      icon: <RadarSweepIcon className="w-5 h-5 text-amber-400" />,
      bus: "SPI / Serial UART",
    },
    {
      name: "Wheel Hall Speed Encoder Sensor",
      type: "Pulse Encoder Sensor",
      ok: raw.sensorHealth.encoderValid,
      icon: <Gauge className="w-5 h-5 text-cyan-400" />,
      bus: "Pulse Interrupt GPIO",
    },
    {
      name: "Vehicle CAN Bus Network",
      type: "High-Speed CAN Interface",
      ok: raw.sensorHealth.canValid,
      icon: <CanBusIcon className="w-5 h-5 text-blue-400" />,
      bus: "CAN-H / CAN-L (500 kbps)",
    },
    {
      name: "Brake Actuator & PWM Deceleration Feedback",
      type: "Actuator Sensor Feedback",
      ok: raw.sensorHealth.brakeValid,
      icon: <BrakingIcon className="w-5 h-5 text-red-400" />,
      bus: "PWM Actuator Drive / Feedback",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            System Component & Network Node Health Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Node Integrity Monitoring for ESP32 Controllers, Sensors, and Links
          </p>
        </div>
      </div>

      {/* Node Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {nodes.map((n) => (
          <div
            key={n.name}
            className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 shadow-lg transition-all ${
              n.ok
                ? "bg-[#1e293b] border-slate-700/80"
                : "bg-hatched-fault text-white border-gray-500 shadow-md"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700">
                  {n.icon}
                </div>
                <div>
                  <h3 className="font-mono font-bold text-sm text-white">{n.name}</h3>
                  <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{n.type}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Bus Link: {n.bus}</span>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                  n.ok
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                    : "bg-black text-red-300 border border-red-500/60"
                }`}
              >
                {n.ok ? "ONLINE" : "FAULT"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CAN Bus / SAE J1939 Network Telemetry */}
      <div className="bg-[#1e293b] border border-slate-700/80 p-5 rounded-xl shadow-lg space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-400">
            <CanBusIcon className="w-4 h-4 text-emerald-400" />
            <span>CAN Bus / SAE J1939 Active Signal Specification</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-500/30">
            ISO 11898 CAN 2.0B / SAE J1939-21
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">SPN 84 (CCVS)</div>
            <div className="text-sm font-bold text-white mt-0.5">Wheel Speed</div>
            <div className="text-[10px] text-emerald-400">0.00390625 km/h per bit</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">SPN 190 (EEC1)</div>
            <div className="text-sm font-bold text-cyan-300 mt-0.5">Engine RPM</div>
            <div className="text-[10px] text-cyan-400">0.125 rpm per bit</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">SPN 91 (EEC2)</div>
            <div className="text-sm font-bold text-amber-300 mt-0.5">Accelerator Pedal</div>
            <div className="text-[10px] text-amber-400">0.4% per bit</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">SPN 597 (CCVS)</div>
            <div className="text-sm font-bold text-purple-300 mt-0.5">Brake Switch</div>
            <div className="text-[10px] text-purple-400">2-bit Status (00/01)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
