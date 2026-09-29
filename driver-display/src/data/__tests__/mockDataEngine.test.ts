import { describe, it, expect, beforeEach } from "vitest";
import { MockDataEngine, ALL_DEMO_SCENARIOS } from "../mockDataEngine";

describe("MockDataEngine Automated Sequential Scenario Ticker", () => {
  let engine: MockDataEngine;

  beforeEach(() => {
    engine = new MockDataEngine();
  });

  it("should initialize with NORMAL_ROAD scenario", () => {
    expect(engine.getCurrentScenario()).toBe("NORMAL_ROAD");
  });

  it("should advance sequentially through ALL_DEMO_SCENARIOS and wrap around", () => {
    const sequenceCount = ALL_DEMO_SCENARIOS.length;
    expect(sequenceCount).toBe(14);

    // Initial is NORMAL_ROAD (index 0)
    for (let i = 1; i < sequenceCount; i++) {
      const next = engine.nextScenario();
      expect(next).toBe(ALL_DEMO_SCENARIOS[i]);
      expect(engine.getCurrentScenario()).toBe(ALL_DEMO_SCENARIOS[i]);
    }

    // Next should wrap back to NORMAL_ROAD (index 0)
    const wrapped = engine.nextScenario();
    expect(wrapped).toBe("NORMAL_ROAD");
    expect(engine.getCurrentScenario()).toBe("NORMAL_ROAD");
  });

  it("should notify onScenarioChange callback on nextScenario", () => {
    let notifiedScenario = "";
    engine.onScenarioChange((scen) => {
      notifiedScenario = scen;
    });

    const next = engine.nextScenario();
    expect(notifiedScenario).toBe(next);
    expect(notifiedScenario).toBe("OBJECT_AHEAD");
  });

  it("should automatically advance to next scenario after 7 ticks", () => {
    const changes: string[] = [];
    engine.onScenarioChange((scen) => {
      changes.push(scen);
    });

    expect(engine.getCurrentScenario()).toBe("NORMAL_ROAD");

    // 6 ticks: still in NORMAL_ROAD
    for (let i = 0; i < 6; i++) {
      engine.tick();
    }
    expect(changes.length).toBe(0);
    expect(engine.getCurrentScenario()).toBe("NORMAL_ROAD");

    // 7th tick triggers auto-advance
    engine.tick();
    expect(changes.length).toBe(1);
    expect(changes[0]).toBe("OBJECT_AHEAD");
    expect(engine.getCurrentScenario()).toBe("OBJECT_AHEAD");
  });
});
