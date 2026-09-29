/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        safety: {
          safe: "#22C55E",       // Green
          caution: "#FACC15",    // Yellow
          warning: "#F97316",    // Orange
          critical: "#EF4444",   // Red
          fault: "#6B7280",      // Gray
          corridor: "#3B82F6",   // Blue
        },
        hud: {
          bg: "#111827",
          card: "#1F2937",
          border: "#374151",
          text: "#F9FAFB",
          accent: "#3B82F6"
        }
      }
    },
  },
  plugins: [],
}
