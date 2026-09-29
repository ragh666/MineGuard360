import { io, Socket } from "socket.io-client";

const getBackendUrl = () => {
  if (typeof import.meta !== "undefined") {
    const env = (import.meta as any).env;
    if (env?.VITE_WS_URL) return env.VITE_WS_URL;
    if (env?.VITE_API_URL) return env.VITE_API_URL;
    if (env?.VITE_BACKEND_URL) return env.VITE_BACKEND_URL;
  }
  if (typeof window !== "undefined") {
    if (window.location.port === "4000" || (window.location.port !== "3000" && window.location.port !== "3001" && window.location.port !== "5173")) {
      return window.location.origin;
    }
  }
  return "http://localhost:4000";
};

const BACKEND_URL = getBackendUrl();

export type ConnectionStatus = "CONNECTED" | "CONNECTING" | "CONNECTION LOST";

class SocketService {
  private socket: Socket | null = null;
  private statusListeners: Array<(status: ConnectionStatus) => void> = [];
  private currentStatus: ConnectionStatus = "CONNECTING";

  public init(): Socket {
    if (this.socket) {
      return this.socket;
    }

    this.currentStatus = "CONNECTING";
    this.notifyStatus(this.currentStatus);

    this.socket = io(BACKEND_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log(`[SocketService] Connected to Shared Backend at ${BACKEND_URL}`);
      this.currentStatus = "CONNECTED";
      this.notifyStatus(this.currentStatus);
    });

    this.socket.on("disconnect", (reason) => {
      console.warn(`[SocketService] Disconnected from Backend (${reason})`);
      this.currentStatus = "CONNECTION LOST";
      this.notifyStatus(this.currentStatus);
    });

    this.socket.on("connect_error", (error) => {
      console.warn(`[SocketService] Connection error:`, error.message);
      this.currentStatus = "CONNECTION LOST";
      this.notifyStatus(this.currentStatus);
    });

    return this.socket;
  }

  public getSocket(): Socket | null {
    if (!this.socket) {
      return this.init();
    }
    return this.socket;
  }

  public getStatus(): ConnectionStatus {
    return this.currentStatus;
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.push(callback);
    callback(this.currentStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyStatus(status: ConnectionStatus) {
    this.statusListeners.forEach((cb) => cb(status));
  }

  // Realtime emission helpers
  public emitEnvironmentUpdate(env: any) {
    this.getSocket()?.emit("environment:update", env);
  }

  public emitDynamicsUpdate(speedKmh: number, leadDistanceM: number, leadSpeedKmh?: number) {
    this.getSocket()?.emit("dynamics:update", { speedKmh, leadDistanceM, leadSpeedKmh });
  }

  public emitBlockSelect(blockId: string) {
    this.getSocket()?.emit("block:select", blockId);
  }

  public emitBlockUpdate(blockId: string, updates: any) {
    this.getSocket()?.emit("block:update", { blockId, updates });
  }

  public emitFaultToggle(faultKey: string) {
    this.getSocket()?.emit("fault:toggle", faultKey);
  }

  public emitFaultClear() {
    this.getSocket()?.emit("fault:clear");
  }

  public emitScenarioSet(scenario: string) {
    this.getSocket()?.emit("scenario:set", scenario);
  }

  public emitDemoToggle(isRunning: boolean) {
    this.getSocket()?.emit("demo:toggle", isRunning);
  }

  public requestState() {
    this.getSocket()?.emit("state:request");
  }
}

export const socketService = new SocketService();
