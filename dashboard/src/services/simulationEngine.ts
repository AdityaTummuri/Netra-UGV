import type { UGVPose, Waypoint, FailsafeState, SystemHealth, PerceptionObstacle, LogEntry, NavigationMode, TeleopCommand, FailsafeLevel } from '../types/telemetry';
import { playWaypointPlacedSound, playAirPurgeSound, playEmergencyAlertSound } from '../utils/audio';

// Default initial state
export const INITIAL_POSE: UGVPose = {
  x: 0,
  y: 0,
  heading: 59, // Bearing ~059° toward WP-1 (Alpha Recon)
  pitch: 0,
  roll: 0,
  linearVelocity: 0,
  angularVelocity: 0,
  odometryDistance: 0,
};

export const INITIAL_FAILSAFE: FailsafeState = {
  currentMode: 0,
  modeLabel: 'NOMINAL (Level 0)',
  cameraLensObscuration: 0.05,
  vMaxAllowed: 1.8,
  airPurgeFiring: false,
  zeroizationEngaged: false,
};

export const INITIAL_HEALTH: SystemHealth = {
  batteryPct: 88,
  batteryVoltage: 25.2,
  currentAmps: 4.2,
  motorTempL: 42.4,
  motorTempR: 43.1,
  canBusLoad: 34,
  rfSignalDbm: -68,
  latencyMs: 14,
  secocAuthRate: 99.8,
  freshnessCounter: 10420,
  tipOverRisk: 0.04,
  gpsFix: '3D_RTK_FIX',
  satellites: 18,
};

export const DEFAULT_WAYPOINTS: Waypoint[] = [
  { id: 'wp-1', index: 1, x: 25, y: 15, status: 'pending', speedLimit: 1.5, label: 'ALPHA RECON' },
  { id: 'wp-2', index: 2, x: 50, y: -20, status: 'pending', speedLimit: 1.2, label: 'BRAVO OBSERVATION' },
  { id: 'wp-3', index: 3, x: 15, y: -45, status: 'pending', speedLimit: 1.0, label: 'CHARLIE TRENCH CHECK' },
  { id: 'wp-4', index: 4, x: -30, y: -25, status: 'pending', speedLimit: 1.5, label: 'DELTA PERIMETER' },
  { id: 'wp-5', index: 5, x: 0, y: 0, status: 'pending', speedLimit: 0.8, label: 'BASE HOME' },
];

export const SIMULATED_OBSTACLES: PerceptionObstacle[] = [
  { id: 'obs-1', type: 'NEGATIVE_VOID', x: 38, y: -8, distance: 14.5, confidence: 0.94, severity: 'CRITICAL' },
  { id: 'obs-2', type: 'TRENCH', x: 20, y: -38, distance: 28.0, confidence: 0.89, severity: 'CRITICAL' },
  { id: 'obs-3', type: 'BUNKER', x: -40, y: 30, distance: 52.0, confidence: 0.97, severity: 'MEDIUM' },
  { id: 'obs-4', type: 'DEBRIS', x: 12, y: 8, distance: 9.2, confidence: 0.82, severity: 'LOW' },
];

export class NetraSimulationService {
  private pose: UGVPose = { ...INITIAL_POSE };
  private failsafe: FailsafeState = { ...INITIAL_FAILSAFE };
  private health: SystemHealth = { ...INITIAL_HEALTH };
  private waypoints: Waypoint[] = [...DEFAULT_WAYPOINTS];
  private obstacles: PerceptionObstacle[] = [...SIMULATED_OBSTACLES];
  private mode: NavigationMode = 'HOLD';
  private teleopCmd: TeleopCommand = { linear: 0, angular: 0, brake: false };
  private trailHistory: [number, number][] = [[0, 0]];
  private logs: LogEntry[] = [];
  private demoScenario: string = 'OFF';
  private intervalTimer: number | null = null;
  private listeners: (() => void)[] = [];
  private airPurgeTimeout: number | null = null;

  constructor() {
    this.addLog('INFO', 'NETRA_CORE', 'Netra UGV Ground Control Station initialized');
    this.addLog('SECOC', 'CAN_SECURITY', 'SecOC AES-128-CMAC authentication bus online');
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public start() {
    if (this.intervalTimer !== null) return;
    const dt = 0.05; // 20 Hz update loop
    this.intervalTimer = window.setInterval(() => {
      this.step(dt);
      this.notify();
    }, 50);
  }

  public stop() {
    if (this.intervalTimer !== null) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  // Getters
  public getPose(): UGVPose { return { ...this.pose }; }
  public getFailsafe(): FailsafeState { return { ...this.failsafe }; }
  public getHealth(): SystemHealth { return { ...this.health }; }
  public getWaypoints(): Waypoint[] { return [...this.waypoints]; }
  public getObstacles(): PerceptionObstacle[] { return [...this.obstacles]; }
  public getMode(): NavigationMode { return this.mode; }
  public getTrail(): [number, number][] { return [...this.trailHistory]; }
  public getLogs(): LogEntry[] { return [...this.logs]; }
  public getDemoScenario(): string { return this.demoScenario; }

  // Setters & Commands
  public setMode(newMode: NavigationMode) {
    if (this.failsafe.zeroizationEngaged) return;
    this.mode = newMode;
    this.addLog('INFO', 'PLANNER', `Navigation mode changed to ${newMode}`);
  }

  public setTeleopCommand(cmd: TeleopCommand) {
    this.teleopCmd = { ...cmd };
  }

  public setWaypoints(wps: Waypoint[]) {
    this.waypoints = wps;
    this.notify();
  }

  public addWaypoint(x: number, y: number, label?: string) {
    const nextIndex = this.waypoints.length + 1;
    const newWp: Waypoint = {
      id: `wp-${Date.now().toString(36)}-${nextIndex}`,
      index: nextIndex,
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      status: 'pending',
      speedLimit: 1.5,
      label: label || `WP-${String(nextIndex).padStart(2, '0')}`
    };
    this.waypoints = [...this.waypoints, newWp];
    playWaypointPlacedSound();
    this.addLog('INFO', 'MISSION', `Waypoint ${newWp.label} added at (${newWp.x}m, ${newWp.y}m)`);
    this.notify();
    return newWp;
  }

  public removeWaypoint(id: string) {
    this.waypoints = this.waypoints.filter(w => w.id !== id).map((w, idx) => ({
      ...w,
      index: idx + 1
    }));
    this.addLog('INFO', 'MISSION', `Waypoint ${id} deleted`);
    this.notify();
  }

  public clearWaypoints() {
    this.waypoints = [];
    this.addLog('WARN', 'MISSION', 'All mission waypoints cleared');
    this.notify();
  }

  public startWaypointMission() {
    if (this.waypoints.length === 0) {
      this.addLog('WARN', 'MISSION', 'Cannot start mission: No waypoints placed');
      return;
    }
    // Mark first pending as active
    let activated = false;
    this.waypoints = this.waypoints.map(w => {
      if (!activated && (w.status === 'pending' || w.status === 'active')) {
        activated = true;
        return { ...w, status: 'active' };
      }
      return w.status === 'reached' ? w : { ...w, status: 'pending' };
    });
    this.setMode('WAYPOINT_AUTO');
    this.addLog('INFO', 'PLANNER', 'Autonomous Waypoint Tracking mission activated');
    this.notify();
  }

  public resetMissionProgress() {
    this.waypoints = this.waypoints.map(w => ({ ...w, status: 'pending' }));
    this.notify();
  }

  public triggerEmergencyStop() {
    this.mode = 'HOLD';
    this.pose.linearVelocity = 0;
    this.pose.angularVelocity = 0;
    this.teleopCmd = { linear: 0, angular: 0, brake: true };
    playEmergencyAlertSound();
    this.addLog('DANGER', 'FAILSAFE', 'EMERGENCY STOP (E-STOP) ACTIVATED! Vehicle immobilized.');
    this.notify();
  }

  public triggerAirPurge() {
    if (this.failsafe.airPurgeFiring) return;
    this.failsafe.airPurgeFiring = true;
    playAirPurgeSound();
    this.addLog('INFO', 'PERCEPTION', 'Air-Purge nozzle activated: High-pressure CO2 blast to clean lens');

    if (this.airPurgeTimeout) clearTimeout(this.airPurgeTimeout);
    this.airPurgeTimeout = window.setTimeout(() => {
      this.failsafe.airPurgeFiring = false;
      this.failsafe.cameraLensObscuration = 0.04;
      if (this.failsafe.currentMode === 1 || this.failsafe.currentMode === 2) {
        this.setFailsafeLevel(0);
      }
      this.addLog('INFO', 'PERCEPTION', 'Air-Purge cycle complete. Lens obscuration dropped to 4%. Nominal vision restored.');
      this.notify();
    }, 1400);
    this.notify();
  }

  public setFailsafeLevel(level: FailsafeLevel) {
    this.failsafe.currentMode = level;
    if (level === 0) {
      this.failsafe.modeLabel = 'NOMINAL (Level 0)';
      this.failsafe.vMaxAllowed = 1.8;
      this.failsafe.cameraLensObscuration = Math.min(this.failsafe.cameraLensObscuration, 0.2);
    } else if (level === 1) {
      this.failsafe.modeLabel = 'VISION DEGRADED (Level 1)';
      this.failsafe.vMaxAllowed = 0.8;
      this.failsafe.cameraLensObscuration = 0.55;
      this.addLog('WARN', 'FAILSAFE', 'Sun glare / dust washout detected. Max speed clamped to 0.8 m/s.');
    } else if (level === 2) {
      this.failsafe.modeLabel = 'VISION CRITICAL (Level 2)';
      this.failsafe.vMaxAllowed = 0.3;
      this.failsafe.cameraLensObscuration = 0.85;
      playEmergencyAlertSound();
      this.addLog('DANGER', 'FAILSAFE', 'Severe lens obscuration / smoke! Entering Inertial Limp-to-Halt.');
    } else if (level === 3) {
      this.failsafe.modeLabel = 'SECURITY TAMPER (Level 3)';
      this.failsafe.vMaxAllowed = 0.0;
      this.failsafe.zeroizationEngaged = true;
      playEmergencyAlertSound();
      this.addLog('DANGER', 'SECURITY', 'CRITICAL TAMPER BREACH! Hardware crowbar fired. S-ROS2 crypto zeroized.');
    }
    this.notify();
  }

  public triggerZeroization() {
    this.failsafe.zeroizationEngaged = true;
    this.setFailsafeLevel(3);
    this.mode = 'HOLD';
    this.pose.linearVelocity = 0;
    this.pose.angularVelocity = 0;
    playEmergencyAlertSound();
    this.addLog('DANGER', 'SECOC', 'FIPS 140-3 Cryptographic Zeroization Executed: Ephemeral & Flash Keys Erased');
    this.notify();
  }

  public resetZeroization() {
    this.failsafe.zeroizationEngaged = false;
    this.setFailsafeLevel(0);
    this.addLog('INFO', 'SECOC', 'Keys reprovisioned via authenticated military key escrow. System nominal.');
    this.notify();
  }

  // Demo Scenarios Handler
  public setDemoScenario(scenario: string) {
    this.demoScenario = scenario;
    if (scenario === 'PATROL_BORDER') {
      this.waypoints = [
        { id: 'wp-p1', index: 1, x: 25, y: 15, status: 'pending', speedLimit: 1.5, label: 'P-1 OUTPOST' },
        { id: 'wp-p2', index: 2, x: 45, y: -10, status: 'pending', speedLimit: 1.4, label: 'P-2 RIDGE' },
        { id: 'wp-p3', index: 3, x: 20, y: -40, status: 'pending', speedLimit: 1.0, label: 'P-3 PERIMETER' },
        { id: 'wp-p4', index: 4, x: -25, y: -25, status: 'pending', speedLimit: 1.5, label: 'P-4 VALLEY' },
        { id: 'wp-p5', index: 5, x: 0, y: 0, status: 'pending', speedLimit: 1.0, label: 'BASE CP' },
      ];
      this.setMode('WAYPOINT_AUTO');
      this.startWaypointMission();
      this.addLog('INFO', 'DEMO', 'Demo Scenario: 5-Point Autonomous Perimeter Patrol loaded & running');
    } else if (scenario === 'NEGATIVE_OBSTACLE') {
      this.waypoints = [
        { id: 'wp-no1', index: 1, x: 30, y: 5, status: 'pending', speedLimit: 1.2, label: 'TRENCH SURV' },
        { id: 'wp-no2', index: 2, x: 40, y: -25, status: 'pending', speedLimit: 0.9, label: 'VOID BYPASS' },
      ];
      this.setMode('WAYPOINT_AUTO');
      this.startWaypointMission();
      this.addLog('WARN', 'DEMO', 'Demo Scenario: Negative Obstacle Void Avoidance initiated');
    } else if (scenario === 'LENS_WASHOUT') {
      this.setFailsafeLevel(2);
      this.addLog('WARN', 'DEMO', 'Demo Scenario: Camera Mud/Dust Washout. Trigger Air-Purge to resolve!');
    } else if (scenario === 'OFF') {
      this.addLog('INFO', 'DEMO', 'Demo mode switched to manual idle');
    }
    this.notify();
  }

  // Telemetry Step / Kinematic Physics
  private step(dt: number) {
    if (this.failsafe.zeroizationEngaged) {
      this.pose.linearVelocity = 0;
      this.pose.angularVelocity = 0;
      return;
    }

    // Monotonic Freshness counter & SecOC
    this.health.freshnessCounter += 1;

    // Jitter / battery drain
    if (Math.abs(this.pose.linearVelocity) > 0.05) {
      this.health.batteryPct = Math.max(5, this.health.batteryPct - 0.0008);
      this.health.batteryVoltage = 24.0 + (this.health.batteryPct / 100) * 1.6;
      this.health.currentAmps = 5.2 + Math.abs(this.pose.linearVelocity) * 3.4;
      this.health.motorTempL = Math.min(65, this.health.motorTempL + 0.005);
      this.health.motorTempR = Math.min(65, this.health.motorTempR + 0.004);
    } else {
      this.health.currentAmps = 1.2;
      this.health.motorTempL = Math.max(38, this.health.motorTempL - 0.005);
      this.health.motorTempR = Math.max(38, this.health.motorTempR - 0.005);
    }

    // Dynamic RF and Latency fluctuation
    const distFromOrigin = Math.hypot(this.pose.x, this.pose.y);
    this.health.rfSignalDbm = Math.round(-62 - (distFromOrigin * 0.25) + (Math.sin(Date.now() / 1500) * 3));
    this.health.latencyMs = Math.round(12 + (distFromOrigin * 0.1) + Math.random() * 3);

    // Waypoint Autonomous Guidance
    if (this.mode === 'WAYPOINT_AUTO') {
      const activeWp = this.waypoints.find(w => w.status === 'active') || this.waypoints.find(w => w.status === 'pending');

      if (activeWp) {
        if (activeWp.status === 'pending') {
          activeWp.status = 'active';
        }

        const dx = activeWp.x - this.pose.x;
        const dy = activeWp.y - this.pose.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 1.2) {
          // Waypoint reached!
          activeWp.status = 'reached';
          playWaypointPlacedSound();
          this.addLog('INFO', 'PLANNER', `Reached waypoint: ${activeWp.label} (wp-${activeWp.index})`);

          // Find next pending
          const nextWp = this.waypoints.find(w => w.status === 'pending');
          if (nextWp) {
            nextWp.status = 'active';
            this.addLog('INFO', 'PLANNER', `Routing to next waypoint: ${nextWp.label}`);
          } else {
            // All reached!
            this.addLog('INFO', 'MISSION', 'All waypoints completed! Holding position.');
            if (this.demoScenario === 'PATROL_BORDER') {
              // Loop patrol
              this.resetMissionProgress();
              this.startWaypointMission();
            } else {
              this.mode = 'HOLD';
              this.pose.linearVelocity = 0;
              this.pose.angularVelocity = 0;
            }
          }
        } else {
          // Steer towards target waypoint (Navigation convention: 0° = North, 90° = East)
          const targetHeadingRad = Math.atan2(dx, dy);
          let targetHeadingDeg = (targetHeadingRad * 180) / Math.PI;
          if (targetHeadingDeg < 0) targetHeadingDeg += 360;

          // Shortest angle difference
          let angleDiff = targetHeadingDeg - this.pose.heading;
          while (angleDiff > 180) angleDiff -= 360;
          while (angleDiff < -180) angleDiff += 360;

          // Pure pursuit angular velocity
          const pGain = 0.035;
          let desiredAngVel = angleDiff * pGain;
          desiredAngVel = Math.max(-1.8, Math.min(1.8, desiredAngVel));

          // Linear velocity based on alignment
          const alignmentFactor = Math.max(0.2, Math.cos((angleDiff * Math.PI) / 180));
          const targetSpeed = (activeWp.speedLimit || 1.5) * alignmentFactor;
          const maxSpeed = this.failsafe.vMaxAllowed;
          const desiredLinVel = Math.min(targetSpeed, maxSpeed);

          // Smooth acceleration
          this.pose.linearVelocity += (desiredLinVel - this.pose.linearVelocity) * 0.15;
          this.pose.angularVelocity += (desiredAngVel - this.pose.angularVelocity) * 0.2;
        }
      } else {
        // No waypoints
        this.pose.linearVelocity *= 0.8;
        this.pose.angularVelocity *= 0.8;
      }
    } else if (this.mode === 'MANUAL') {
      if (this.teleopCmd.brake) {
        this.pose.linearVelocity *= 0.7;
        this.pose.angularVelocity *= 0.7;
      } else {
        const targetLin = this.teleopCmd.linear * this.failsafe.vMaxAllowed;
        const targetAng = this.teleopCmd.angular * 1.8;
        this.pose.linearVelocity += (targetLin - this.pose.linearVelocity) * 0.25;
        this.pose.angularVelocity += (targetAng - this.pose.angularVelocity) * 0.3;
      }
    } else if (this.mode === 'LIMP_HOME') {
      const crawlSpeed = Math.min(0.4, this.failsafe.vMaxAllowed);
      this.pose.linearVelocity += (crawlSpeed - this.pose.linearVelocity) * 0.1;
      this.pose.angularVelocity *= 0.9;
    } else if (this.mode === 'RTL') {
      // Return to launch (0, 0)
      const dist = Math.hypot(this.pose.x, this.pose.y);
      if (dist < 1.0) {
        this.mode = 'HOLD';
        this.pose.linearVelocity = 0;
        this.pose.angularVelocity = 0;
        this.addLog('INFO', 'RTL', 'Successfully returned to Base coordinates.');
      } else {
        const targetHeadingRad = Math.atan2(-this.pose.x, -this.pose.y);
        let targetHeadingDeg = (targetHeadingRad * 180) / Math.PI;
        if (targetHeadingDeg < 0) targetHeadingDeg += 360;

        let angleDiff = targetHeadingDeg - this.pose.heading;
        while (angleDiff > 180) angleDiff -= 360;
        while (angleDiff < -180) angleDiff += 360;

        this.pose.angularVelocity = Math.max(-1.5, Math.min(1.5, angleDiff * 0.03));
        this.pose.linearVelocity = Math.min(1.2, this.failsafe.vMaxAllowed);
      }
    } else {
      // HOLD / STOP
      this.pose.linearVelocity *= 0.85;
      this.pose.angularVelocity *= 0.85;
      if (Math.abs(this.pose.linearVelocity) < 0.01) this.pose.linearVelocity = 0;
      if (Math.abs(this.pose.angularVelocity) < 0.01) this.pose.angularVelocity = 0;
    }

    // Kinematic Integration (Standard navigation: 0° = North/+Y, 90° = East/+X)
    this.pose.heading += (this.pose.angularVelocity * 180 / Math.PI) * dt;
    this.pose.heading = (this.pose.heading + 360) % 360;

    const headingRad = (this.pose.heading * Math.PI) / 180;
    const dx = this.pose.linearVelocity * Math.sin(headingRad) * dt;
    const dy = this.pose.linearVelocity * Math.cos(headingRad) * dt;

    this.pose.x += dx;
    this.pose.y += dy;
    this.pose.odometryDistance += Math.hypot(dx, dy);

    // Roll and pitch dynamic simulation
    this.pose.roll = -this.pose.angularVelocity * 4.2 + (Math.sin(this.pose.odometryDistance * 0.8) * 2.5);
    this.pose.pitch = (this.pose.linearVelocity * 2.1) + (Math.cos(this.pose.odometryDistance * 0.6) * 3.0);
    this.health.tipOverRisk = Math.min(1.0, (Math.abs(this.pose.roll) + Math.abs(this.pose.pitch)) / 45.0);

    // Record breadcrumb trail (every 0.5m)
    const lastTrail = this.trailHistory[this.trailHistory.length - 1];
    if (!lastTrail || Math.hypot(this.pose.x - lastTrail[0], this.pose.y - lastTrail[1]) > 0.4) {
      this.trailHistory.push([this.pose.x, this.pose.y]);
      if (this.trailHistory.length > 250) {
        this.trailHistory.shift();
      }
    }

    // Update dynamic obstacle distances
    this.obstacles = this.obstacles.map(obs => {
      const odx = obs.x - this.pose.x;
      const ody = obs.y - this.pose.y;
      return {
        ...obs,
        distance: Number(Math.hypot(odx, ody).toFixed(1))
      };
    });
  }

  private addLog(level: LogEntry['level'], source: string, message: string) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString().split('T')[1].substring(0, 8),
      level,
      source,
      message,
    };
    this.logs = [entry, ...this.logs.slice(0, 99)];
  }
}

// Global Singleton Instance
export const ugvEngine = new NetraSimulationService();
ugvEngine.start();
