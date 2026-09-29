// PROTOTYPE DEMONSTRATION PARAMETERS — NOT CERTIFIED PRODUCTION SAFETY LIMITS

export interface SafetyParameters {
  reactionTimeS: number;
  nominalDecelerationMps2: number;
  safetyMarginM: number;

  cautionTtcS: number;
  warningTtcS: number;
  criticalTtcS: number;
  emergencyTtcS: number;

  cautionSpeedPercent: number;
  warningSpeedPercent: number;
  criticalSpeedKmh: number;

  minimumSafeSeparationM: number;

  staleDataMs: {
    radar: number;
    can: number;
    lora: number;
    encoder: number;
    brake: number;
  };

  vehicleLengthM: number;
  vehicleWidthM: number;
  corridorHalfWidthM: number;
  minRoadEdgeClearanceM: number;
  prototypeMaxSpeedKmh: number;
}

export const SAFETY_CONFIG: SafetyParameters = {
  reactionTimeS: 1.0,
  nominalDecelerationMps2: 5.0,
  safetyMarginM: 3.0,

  cautionTtcS: 6.0,
  warningTtcS: 4.0,
  criticalTtcS: 2.0,
  emergencyTtcS: 1.0,

  cautionSpeedPercent: 70,
  warningSpeedPercent: 30,
  criticalSpeedKmh: 0,

  minimumSafeSeparationM: 10.0,

  staleDataMs: {
    radar: 2000,
    can: 2000,
    lora: 3000,
    encoder: 1500,
    brake: 1000,
  },

  vehicleLengthM: 10.0,
  vehicleWidthM: 4.5,
  corridorHalfWidthM: 3.0,
  minRoadEdgeClearanceM: 1.5,
  prototypeMaxSpeedKmh: 30.0,
};
