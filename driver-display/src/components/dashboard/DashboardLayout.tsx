import React from "react";
import { DashboardPageId, useVehicleStore } from "../../store/vehicleStore";
import { useAuthStore } from "../../auth/authStore";
import { LoginPage } from "./LoginPage";
import { useTranslation } from "../../context/LanguageContext";
import { LanguageSelector } from "../common/LanguageSelector";
import { MineGuard360Brand } from "../common/MineGuard360Logo";
import { SoundAlarmIndicator } from "../common/SoundAlarmIndicator";
import {
  LayoutDashboard,
  Truck,
  Layers,
  Key,
  Cpu,
  BarChart3,
  CloudRain,
  History,
  Activity,
  Sliders,
  HelpCircle,
  Shield,
  Radio,
  LogOut,
  UserCheck,
} from "lucide-react";

interface SidebarItem {
  id: DashboardPageId;
  labelKey: string;
  defaultLabel: string;
  icon: React.ReactNode;
}

const ALL_SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "OVERVIEW", labelKey: "dashboard.nav.overview", defaultLabel: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "FLEET_MONITOR", labelKey: "dashboard.nav.fleetMonitor", defaultLabel: "Fleet Monitor", icon: <Truck className="w-4 h-4" /> },
  { id: "BLOCK_MANAGER", labelKey: "dashboard.nav.blockManager", defaultLabel: "Block Manager", icon: <Layers className="w-4 h-4" /> },
  { id: "MOVEMENT_TOKENS", labelKey: "dashboard.nav.movementTokens", defaultLabel: "Movement Tokens", icon: <Key className="w-4 h-4" /> },
  { id: "RISK_MONITOR", labelKey: "dashboard.nav.riskMonitor", defaultLabel: "Risk Monitor", icon: <Cpu className="w-4 h-4" /> },
  { id: "SAFETY_ANALYTICS", labelKey: "dashboard.nav.safetyAnalytics", defaultLabel: "Safety Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "ENVIRONMENT_SIMULATION", labelKey: "dashboard.nav.environmentSimulation", defaultLabel: "Environment & Faults", icon: <CloudRain className="w-4 h-4" /> },
  { id: "EVENT_LOG", labelKey: "dashboard.nav.eventLog", defaultLabel: "Event Log", icon: <History className="w-4 h-4" /> },
  { id: "SYSTEM_HEALTH", labelKey: "dashboard.nav.systemHealth", defaultLabel: "System Health", icon: <Activity className="w-4 h-4" /> },
  { id: "CONFIG", labelKey: "dashboard.nav.config", defaultLabel: "Config", icon: <Sliders className="w-4 h-4" /> },
  { id: "SAFETY_METRICS", labelKey: "dashboard.nav.safetyMetrics", defaultLabel: "Safety Metrics", icon: <Shield className="w-4 h-4" /> },
  { id: "HELP", labelKey: "dashboard.nav.help", defaultLabel: "Help & Docs", icon: <HelpCircle className="w-4 h-4" /> },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout, hasAccess } = useAuthStore();
  const {
    activeDashboardPage,
    setActiveDashboardPage,
    isFleetScalePreview,
    toggleFleetScalePreview,
    decision,
    isDemoRunning,
    toggleDemoMode,
    backendConnected,
  } = useVehicleStore();

  const { t } = useTranslation();

  // GATE 1: Gated Authentication Screen Check
  if (!user) {
    return <LoginPage />;
  }

  // Filter sidebar items by user role permissions
  const authorizedSidebarItems = ALL_SIDEBAR_ITEMS.filter((item) =>
    hasAccess(item.id)
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 flex flex-col font-sans select-none">
      {/* Top Header Bar */}
      <header className="bg-[#1e293b] border-b border-slate-700/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <MineGuard360Brand size="md" />
          <div className="border-l border-slate-700 pl-3">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black uppercase tracking-tight text-white">
                {t("dashboard.title", "Control Room Command Center")}
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                {t("dashboard.staffAuthenticated", "STAFF AUTHENTICATED")}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              {t("dashboard.subtitle", "Mining Sector 4 Digital Block Coordinator & Fleet Safety Surveillance")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
          {/* Backend Online/Offline Status Indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold ${
              backendConnected
                ? "bg-emerald-950/80 border-emerald-500/80 text-emerald-300"
                : "bg-red-950/90 border-red-500/80 text-red-300 animate-pulse"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendConnected ? "bg-emerald-400" : "bg-red-500"
              }`}
            ></span>
            <span>{backendConnected ? t("dashboard.backendOnline", "BACKEND ONLINE") : t("dashboard.backendOffline", "BACKEND OFFLINE")}</span>
          </div>

          {/* Operator Attribution Indicator */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {t("dashboard.loggedInAs", "Logged in as")} <strong className="text-white">{user.name}</strong> (
              <span className="text-emerald-400 font-bold">{user.role}</span>)
            </span>
          </div>

          {/* Real-time Safety Sound Alarm Indicator */}
          <SoundAlarmIndicator safetyState={decision.safetyState} aiRiskLevel={decision.aiRiskLevel} />

          {/* Language Selector */}
          <LanguageSelector variant="dashboard" />

          {/* Logout Action */}
          <button
            onClick={logout}
            title={t("dashboard.logout", "Sign out of Control Room")}
            className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-200 font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("dashboard.logout", "Logout")}</span>
          </button>

          {/* Fleet Scale Toggle Button */}
          <button
            onClick={toggleFleetScalePreview}
            className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isFleetScalePreview
                ? "bg-purple-950/80 border-purple-500/80 text-purple-200"
                : "bg-slate-800 border-slate-600 text-slate-300"
            }`}
          >
            <span>{isFleetScalePreview ? t("dashboard.fleetScale", "FLEET SCALE (V01-V06)") : t("dashboard.prototypeScale", "PROTOTYPE SCALE (V01-V02)")}</span>
          </button>

          {/* Demo Ticker Quick Control */}
          <button
            onClick={toggleDemoMode}
            className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isDemoRunning
                ? "bg-amber-950/80 border-amber-500/80 text-amber-300"
                : "bg-emerald-950/80 border-emerald-500/80 text-emerald-300"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isDemoRunning ? "animate-spin text-amber-400" : ""}`} />
            <span>{isDemoRunning ? t("dashboard.tickerActive", "TICKER ACTIVE") : t("dashboard.paused", "PAUSED")}</span>
          </button>
        </div>
      </header>

      {/* Main Container with Left Sidebar & Content Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside className="w-64 bg-[#1e293b]/90 border-r border-slate-700/80 flex flex-col justify-between p-3 flex-shrink-0">
          <nav className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1.5 tracking-wider flex justify-between">
              <span>{t("dashboard.commandModules", "Command Modules")}</span>
              <span className="text-emerald-400">{user.role} {t("dashboard.role", "Role")}</span>
            </div>
            {authorizedSidebarItems.map((item) => {
              const isActive = activeDashboardPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveDashboardPage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <span className={isActive ? "text-emerald-400" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{t(item.labelKey, item.defaultLabel)}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer Info */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>{t("dashboard.staffId", "Staff ID")}:</span>
              <span className="text-emerald-400 font-bold">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("dashboard.role", "Role")}:</span>
              <span className="text-white font-bold">{user.role}</span>
            </div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800 italic">
              {t("dashboard.sessionActive", "Authenticated Session Active")}
            </div>
          </div>
        </aside>

        {/* Dynamic Page Content View */}
        <main className="flex-1 overflow-y-auto p-5 bg-[#0f172a]">
          {children}
        </main>
      </div>
    </div>
  );
};

