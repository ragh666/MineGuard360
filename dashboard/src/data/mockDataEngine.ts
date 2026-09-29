import { RawSensorData, ScenarioType } from "./types";
import { generateRawSensorDataForScenario } from "./syntheticSensorGenerator";

export const ALL_DEMO_SCENARIOS: ScenarioType[] = [
  "NORMAL_ROAD",
  "OBJECT_AHEAD",
  "APPROACHING_OBJECT",
  "BLIND_CURVE",
  "JUNCTION_CONFLICT",
  "FOLLOWING_TOO_CLOSE",
  "CRITICAL_TTC",
  "EMERGENCY_COLLISION",
  "RADAR_FAILURE",
  "ENCODER_FAILURE",
  "CAN_FAILURE",
  "LORA_FAILURE",
  "BRAKE_FAILURE",
  "SENSOR_DISAGREEMENT",
];

// Number of 500ms ticks before advancing to the next scenario (7 ticks = 3.5 seconds)
const TICKS_PER_SCENARIO = 7;

/**
 * FOG-HEMM Mock Data Engine
 *
 * Simulates incoming RAW sensor telemetry and automates sequential scenario cycling
 * for comprehensive testing and live demonstration.
 */
export class MockDataEngine {
  private currentScenario: ScenarioType = "NORMAL_ROAD";
  private stepIndex: number = 0;
  private ticksInCurrentScenario: number = 0;
  private isRunning: boolean = false;
  private intervalId: any = null;
  private currentSpeedMps: number = 5.55; // 20 km/h baseline
  private onTelemetryCallback: ((raw: RawSensorData) => void) | null = null;
  private onScenarioChangeCallback: ((scen: ScenarioType) => void) | null = null;

  constructor() {}

  public subscribe(callback: (raw: RawSensorData) => void) {
    this.onTelemetryCallback = callback;
  }

  public onScenarioChange(callback: (scen: ScenarioType) => void) {
    this.onScenarioChangeCallback = callback;
  }

  public setScenario(scenario: ScenarioType, triggerCallback: boolean = false) {
    this.currentScenario = scenario;
    this.stepIndex = 0;
    this.ticksInCurrentScenario = 0;
    this.currentSpeedMps = 5.55; // Reset baseline speed
    this.emitCurrentTelemetry();

    if (triggerCallback && this.onScenarioChangeCallback) {
      this.onScenarioChangeCallback(scenario);
    }
  }

  public nextScenario(): ScenarioType {
    const currentIndex = ALL_DEMO_SCENARIOS.indexOf(this.currentScenario);
    const nextIndex = (currentIndex + 1) % ALL_DEMO_SCENARIOS.length;
    const nextScen = ALL_DEMO_SCENARIOS[nextIndex];
    this.setScenario(nextScen, true);
    return nextScen;
  }

  public start(intervalMs: number = 500) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.ticksInCurrentScenario = 0;

    this.intervalId = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Called when brake command is active to simulate physical brake actuator speed reduction.
   */
  public applyBrakeDeceleration(decelerationRateMps2: number = 2.5) {
    if (this.currentSpeedMps > 0) {
      this.currentSpeedMps = Math.max(0, this.currentSpeedMps - decelerationRateMps2 * 0.5);
    }
  }

  public tick() {
    this.stepIndex += 1;
    this.ticksInCurrentScenario += 1;

    // After TICKS_PER_SCENARIO (3.5s), automatically advance to the next scenario!
    if (this.ticksInCurrentScenario >= TICKS_PER_SCENARIO) {
      this.nextScenario();
      return;
    }

    this.emitCurrentTelemetry();
  }

  public emitCurrentTelemetry() {
    const rawData = generateRawSensorDataForScenario(
      this.currentScenario,
      this.stepIndex,
      this.currentSpeedMps
    );

    if (this.onTelemetryCallback) {
      this.onTelemetryCallback(rawData);
    }
  }

  public getCurrentScenario(): ScenarioType {
    return this.currentScenario;
  }
}

export const mockEngineInstance = new MockDataEngine();
