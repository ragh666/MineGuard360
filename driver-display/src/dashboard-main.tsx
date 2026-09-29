import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ControlRoomDashboard } from './components/dashboard/ControlRoomDashboard';
import { LanguageProvider } from './context/LanguageContext';
import { MineGuardSplashScreen } from './components/common/MineGuardSplashScreen';
import './index.css';

const DashboardApp: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <MineGuardSplashScreen
        durationMs={3000}
        onComplete={() => setShowSplash(false)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#0f172a] text-gray-100 font-sans">
      <ControlRoomDashboard />
    </main>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider storageKey="fog_dashboard_lang">
      <DashboardApp />
    </LanguageProvider>
  </React.StrictMode>
);
