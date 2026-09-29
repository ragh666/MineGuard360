import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { PassiveDriverDisplay } from './components/PassiveDriverDisplay';
import { LanguageProvider } from './context/LanguageContext';
import { MineGuardSplashScreen } from './components/common/MineGuardSplashScreen';
import './index.css';

const DriverApp: React.FC = () => {
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
    <main className="w-screen h-screen min-h-screen bg-[#090d16] text-gray-100 overflow-hidden font-sans p-2 md:p-3 flex flex-col justify-between select-none">
      <PassiveDriverDisplay />
    </main>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider storageKey="fog_driver_lang">
      <DriverApp />
    </LanguageProvider>
  </React.StrictMode>
);
