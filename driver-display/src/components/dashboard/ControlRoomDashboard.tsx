import React from "react";
import { useVehicleStore } from "../../store/vehicleStore";
import { DashboardLayout } from "./DashboardLayout";
import { OverviewPage } from "./pages/OverviewPage";
import { FleetMonitorPage } from "./pages/FleetMonitorPage";
import { BlockManagerPage } from "./pages/BlockManagerPage";
import { MovementTokensPage } from "./pages/MovementTokensPage";
import { RiskMonitorPage } from "./pages/RiskMonitorPage";
import { SafetyAnalyticsPage } from "./pages/SafetyAnalyticsPage";
import { EnvironmentSimulationPage } from "./pages/EnvironmentSimulationPage";
import { EventLogPage } from "./pages/EventLogPage";
import { SystemHealthPage } from "./pages/SystemHealthPage";
import { ConfigPage } from "./pages/ConfigPage";
import { HelpPage } from "./pages/HelpPage";

export const ControlRoomDashboard: React.FC = () => {
  const { activeDashboardPage } = useVehicleStore();

  const renderActivePage = () => {
    switch (activeDashboardPage) {
      case "OVERVIEW":
        return <OverviewPage />;
      case "FLEET_MONITOR":
        return <FleetMonitorPage />;
      case "BLOCK_MANAGER":
        return <BlockManagerPage />;
      case "MOVEMENT_TOKENS":
        return <MovementTokensPage />;
      case "RISK_MONITOR":
        return <RiskMonitorPage />;
      case "SAFETY_ANALYTICS":
        return <SafetyAnalyticsPage />;
      case "ENVIRONMENT_SIMULATION":
        return <EnvironmentSimulationPage />;
      case "EVENT_LOG":
        return <EventLogPage />;
      case "SYSTEM_HEALTH":
        return <SystemHealthPage />;
      case "CONFIG":
        return <ConfigPage />;
      case "HELP":
        return <HelpPage />;
      default:
        return <OverviewPage />;
    }
  };

  return <DashboardLayout>{renderActivePage()}</DashboardLayout>;
};
