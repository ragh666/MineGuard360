import React, { useState } from "react";
import { DEMO_ACCOUNTS, useAuthStore } from "../../auth/authStore";
import { MineGuard360Brand } from "../common/MineGuard360Logo";
import { Shield, Lock, User, AlertCircle, ArrowRight } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login, error } = useAuthStore();
  const [email, setEmail] = useState("raghavipunithan666@gmail.com");
  const [pass, setPass] = useState("Ragh1915@");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, pass);
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPass(demoPass);
    login(demoEmail, demoPass);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md bg-[#1e293b] border border-slate-700/80 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
        {/* Header Header & Branding */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <MineGuard360Brand size="lg" />
          </div>
          <h1 className="text-base md:text-lg font-black uppercase tracking-wider text-slate-300">
            Control Room Command Center
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Staff Security Authorization Gate & Login
          </p>
        </div>

        {/* Error Alert Display */}
        {error && (
          <div className="p-3 bg-red-950/80 border border-red-500/80 rounded-xl text-red-200 text-xs font-mono flex items-center gap-2 animate-pulse">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Staff Email Address:</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="raghavipunithan666@gmail.com"
                className="w-full bg-slate-900 border border-slate-700 text-white pl-9 pr-3 py-2.5 rounded-xl font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Security Password:</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 text-white pl-9 pr-3 py-2.5 rounded-xl font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
          >
            <span>AUTHENTICATE & ENTER COMMAND CENTER</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Staff Logins */}
        <div className="pt-4 border-t border-slate-700/80 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider text-center">
            Authorized Staff Account (Click for Quick Login)
          </div>
          <div className="font-mono text-[11px]">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.user.id}
                type="button"
                onClick={() => handleQuickLogin(acc.email, acc.pass)}
                className="w-full p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/40 rounded-xl text-center font-bold text-slate-300 hover:text-emerald-400 transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="text-left">
                  <div className="text-white text-xs font-extrabold">{acc.user.name} ({acc.user.role})</div>
                  <div className="text-[10px] text-slate-400">{acc.email}</div>
                </div>
                <span className="px-2 py-1 bg-emerald-950 text-emerald-300 text-[10px] rounded border border-emerald-500/30 uppercase">
                  LOG IN AS ADMIN
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-[10px] text-slate-500 font-mono text-center pt-2 italic">
          Driver Display is unauthenticated (passive cab equipment). Control Room Dashboard requires staff login.
        </div>
      </div>
    </div>
  );
};
