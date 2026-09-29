import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

// Create or connect to persistent SQLite database
const dbPath = path.resolve(process.cwd(), "fog_hemm.db");
export const db = new DatabaseSync(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS system_state (
    id TEXT PRIMARY KEY,
    state_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS blocks (
    block_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    restricted INTEGER NOT NULL,
    occupancy_state TEXT NOT NULL,
    occupants_json TEXT NOT NULL,
    weather TEXT NOT NULL,
    road_condition TEXT NOT NULL,
    fog_density REAL NOT NULL,
    visibility_m REAL NOT NULL,
    boundary_sensors TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS safety_events (
    id TEXT PRIMARY KEY,
    timestamp_ms INTEGER NOT NULL,
    timestamp_str TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    block_id TEXT,
    prev_state TEXT,
    new_state TEXT NOT NULL,
    reason_code TEXT NOT NULL,
    reason TEXT NOT NULL,
    ttc_seconds REAL,
    distance_m REAL,
    required_stopping_dist_m REAL,
    available_dist_m REAL,
    final_action TEXT NOT NULL
  );
`);

export function saveStateToDb(id: string, stateObj: any): void {
  try {
    const stmt = db.prepare(`
      INSERT INTO system_state (id, state_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        state_json = excluded.state_json,
        updated_at = excluded.updated_at
    `);
    stmt.run(id, JSON.stringify(stateObj), Date.now());
  } catch (err) {
    console.error("[DB] Failed to save state:", err);
  }
}

export function loadStateFromDb(id: string): any | null {
  try {
    const stmt = db.prepare(`SELECT state_json FROM system_state WHERE id = ?`);
    const row = stmt.get(id) as { state_json: string } | undefined;
    if (row && row.state_json) {
      return JSON.parse(row.state_json);
    }
  } catch (err) {
    console.error("[DB] Failed to load state:", err);
  }
  return null;
}

export function saveEventToDb(event: any): void {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO safety_events (
        id, timestamp_ms, timestamp_str, vehicle_id, block_id,
        prev_state, new_state, reason_code, reason,
        ttc_seconds, distance_m, required_stopping_dist_m, available_dist_m,
        final_action
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      event.id,
      event.timestampMs,
      event.timestampStr,
      event.vehicleId,
      event.blockId || null,
      event.previousState || null,
      event.newState,
      event.reasonCode,
      event.reason,
      event.ttcSeconds ?? null,
      event.distanceM ?? null,
      event.requiredStoppingDistanceM ?? null,
      event.availableDistanceM ?? null,
      event.finalAction
    );
  } catch (err) {
    console.error("[DB] Failed to save safety event:", err);
  }
}

export function loadEventsFromDb(limit: number = 50): any[] {
  try {
    const stmt = db.prepare(`
      SELECT * FROM safety_events
      ORDER BY timestamp_ms DESC
      LIMIT ?
    `);
    const rows = stmt.all(limit) as any[];
    return rows.map((r) => ({
      id: r.id,
      timestampMs: r.timestamp_ms,
      timestampStr: r.timestamp_str,
      vehicleId: r.vehicle_id,
      blockId: r.block_id,
      previousState: r.prev_state,
      newState: r.new_state,
      reasonCode: r.reason_code,
      reason: r.reason,
      ttcSeconds: r.ttc_seconds,
      distanceM: r.distance_m,
      requiredStoppingDistanceM: r.required_stopping_dist_m,
      availableDistanceM: r.available_dist_m,
      finalAction: r.final_action,
    }));
  } catch (err) {
    console.error("[DB] Failed to load safety events:", err);
    return [];
  }
}
