export type NavigationMode = 'MANUAL' | 'WAYPOINT_AUTO' | 'LIMP_HOME' | 'RTL' | 'HOLD';

export type FailsafeLevel = 0 | 1 | 2 | 3;

export interface UGVPose {
  x: number;             // meters in local grid
  y: number;             // meters in local grid
  heading: number;       // degrees (0-360, 0 = North / Up)
  pitch: number;         // degrees (-30 to +30)
  roll: number;          // degrees (-30 to +30)
  linearVelocity: number;// m/s (-1.5 to +2.5)
  angularVelocity: number; // rad/s (-2.0 to +2.0)
  odometryDistance: number; // total meters travelled
}

export interface Waypoint {
  id: string;
  index: number;
  x: number;
  y: number;
  status: 'pending' | 'active' | 'reached' | 'skipped';
  speedLimit?: number;
  label?: string;
}

export interface FailsafeState {
  currentMode: FailsafeLevel; // 0=Nominal, 1=Vision Degraded, 2=Vision Critical, 3=Security Tamper
  modeLabel: string;
  cameraLensObscuration: number; // 0.0 - 1.0 (0% to 100%)
  vMaxAllowed: number;           // m/s dynamic limit
  airPurgeFiring: boolean;       // Optical nozzle active
  zeroizationEngaged: boolean;   // Cryptographic crowbar wiped
}

export interface SystemHealth {
  batteryPct: number;            // 0 - 100%
  batteryVoltage: number;        // Volts (~24.0V)
  currentAmps: number;           // Amperes
  motorTempL: number;            // °C
  motorTempR: number;            // °C
  canBusLoad: number;            // %
  rfSignalDbm: number;           // dBm (-30 to -95)
  latencyMs: number;             // ms
  secocAuthRate: number;         // % (99.9%)
  freshnessCounter: number;      // anti-replay monotonic counter
  tipOverRisk: number;           // 0.0 - 1.0
  gpsFix: '3D_RTK_FIX' | 'DGPS' | 'ESTIMATED_EKF';
  satellites: number;
}

export interface PerceptionObstacle {
  id: string;
  type: 'NEGATIVE_VOID' | 'TRENCH' | 'BUNKER' | 'VEHICLE' | 'DEBRIS' | 'PERSONNEL';
  x: number; // relative to origin or local map
  y: number;
  distance: number; // meters from UGV
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'CRITICAL';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'DANGER' | 'SECOC';
  source: string;
  message: string;
}

export interface TeleopCommand {
  linear: number;  // -1 to 1
  angular: number; // -1 to 1
  brake: boolean;
}
