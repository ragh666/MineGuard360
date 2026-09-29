import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "../../context/LanguageContext";
import { Globe, Check, ChevronDown } from "lucide-react";
import { SupportedLanguage } from "../../locales";

interface LanguageSelectorProps {
  className?: string;
  variant?: "driver" | "dashboard";
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = "",
  variant = "driver",
}) => {
  const { language, setLanguage, supportedLanguages, currentLanguageOption } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  const isDriver = variant === "driver";

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer font-sans select-none ${
          isDriver
            ? "bg-[#0b1622]/90 hover:bg-[#122338] text-cyan-300 border-cyan-500/40 shadow-sm text-xs font-bold"
            : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700 shadow-sm text-xs font-semibold"
        }`}
        title="Change Language / भाषा बदलें / மொழியை மாற்றவும்"
      >
        <Globe className={`w-3.5 h-3.5 ${isDriver ? "text-cyan-400" : "text-emerald-400"}`} />
        <span className="font-bold tracking-wide">
          {currentLanguageOption.nativeName}
          {currentLanguageOption.code !== "en" && (
            <span className="opacity-60 text-[10px] ml-1 font-normal">({currentLanguageOption.name})</span>
          )}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-1.5 w-56 rounded-xl shadow-2xl border backdrop-blur-md z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isDriver
              ? "bg-[#0a1524]/95 border-cyan-500/40 text-gray-100"
              : "bg-[#1e293b]/98 border-slate-700 text-gray-100"
          }`}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-cyan-400" />
              Language / भाषा
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">8 Indic/En</span>
          </div>

          {/* List of 8 Languages */}
          <div className="py-1 max-h-72 overflow-y-auto">
            {supportedLanguages.map((option) => {
              const isSelected = option.code === language;
              return (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => handleSelect(option.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? isDriver
                        ? "bg-cyan-500/20 text-cyan-300 font-bold border-l-2 border-cyan-400"
                        : "bg-emerald-500/20 text-emerald-300 font-bold border-l-2 border-emerald-400"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold tracking-tight">{option.nativeName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{option.name}</span>
                  </div>
                  {isSelected && (
                    <Check className={`w-4 h-4 ${isDriver ? "text-cyan-400" : "text-emerald-400"}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
