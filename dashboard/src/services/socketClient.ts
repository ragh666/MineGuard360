import { io, Socket } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export type ConnectionStatus = "CONNECTED" | "CONNECTING" | "CONNECTION LOST";

class SocketService {
  private socket: Socket | null = null;
  private statusListeners: Array<(status: ConnectionStatus) => void> = [];
  private currentStatus: ConnectionStatus = "CONNECTING";

  public init(): Socket | null {
    if (this.socket) {
      return this.socket;
    }

    this.currentStatus = "CONNECTING";
    this.notifyStatus(this.currentStatus);

    if (!BACKEND_URL) {
      this.currentStatus = "CONNECTION LOST";
      this.notifyStatus(this.currentStatus);
      if (import.meta.env.DEV) {
        console.error("[SocketService] VITE_BACKEND_URL is not configured");
      }
      return null;
    }

    if (import.meta.env.DEV) {
      console.log("[SocketService] Backend URL:", BACKEND_URL);
    }

    this.socket = io(BACKEND_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      if (import.meta.env.DEV) {
        console.log("[SocketService] Socket connected:", this.socket?.id);
      }
      this.currentStatus = "CONNECTED";
      this.notifyStatus(this.currentStatus);
    });

    this.socket.on("disconnect", (reason) => {
      if (import.meta.env.DEV) {
        console.warn(`[SocketService] Disconnected from Backend (${reason})`);
      }
      this.currentStatus = "CONNECTION LOST";
      this.notifyStatus(this.currentStatus);
    });

    this.socket.on("connect_error", (error) => {
      if (import.meta.env.DEV) {
        console.warn(`[SocketService] Connection error:`, error.message);
      }
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
