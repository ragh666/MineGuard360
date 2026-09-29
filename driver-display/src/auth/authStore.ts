import { create } from "zustand";

export type StaffRole = "Operator" | "Supervisor" | "Admin";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
}

export interface DemoAccount {
  email: string;
  pass: string;
  user: StaffUser;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "raghavipunithan666@gmail.com",
    pass: "Ragh1915@",
    user: {
      id: "STAFF-001",
      name: "Raghavi Punithan",
      email: "raghavipunithan666@gmail.com",
      role: "Admin",
    },
  },
];

interface AuthState {
  user: StaffUser | null;
  token: string | null;
  error: string | null;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  hasAccess: (pageId: string) => boolean;
}

const STORAGE_KEY = "fog_hemm_control_room_session";

function loadSavedSession(): { user: StaffUser | null; token: string | null } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { user: parsed.user, token: parsed.token };
    }
  } catch (e) {
    console.error("Failed to load session", e);
  }
  return { user: null, token: null };
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialSession = loadSavedSession();

  return {
    user: initialSession.user,
    token: initialSession.token,
    error: null,

    login: (email, pass) => {
      const acc = DEMO_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === email.toLowerCase() && a.pass === pass
      );

      if (acc) {
        const token = `TOK_SESSION_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const sessionData = { user: acc.user, token };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));

        set({ user: acc.user, token, error: null });
        return true;
      }

      set({ error: "Invalid staff email or password." });
      return false;
    },

    logout: () => {
      sessionStorage.removeItem(STORAGE_KEY);
      set({ user: null, token: null, error: null });
    },

    hasAccess: (pageId: string) => {
      const { user } = get();
      if (!user) return false;

      // Operator access: Overview, Fleet Monitor, Block Manager, Risk Monitor, Event Log, Help
      // Supervisor access: Operator access + Environment Simulation, Safety Analytics
      // Admin access: All pages including Config
      switch (pageId) {
        case "CONFIG":
          return user.role === "Admin";
        case "ENVIRONMENT_SIMULATION":
        case "SAFETY_ANALYTICS":
          return user.role === "Supervisor" || user.role === "Admin";
        default:
          return true; // Overview, Fleet Monitor, Block Manager, Tokens, Risk, Event Log, Health, Help
      }
    },
  };
});
