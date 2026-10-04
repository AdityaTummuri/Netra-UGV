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
  { id: 'wp-1', index: 1, x: 16, y: 10, status: 'pending', speedLimit: 1.5, label: 'ALPHA RECON' },
  { id: 'wp-2', index: 2, x: 18, y: -7, status: 'pending', speedLimit: 1.3, label: 'BRAVO OBSERVATION' },
  { id: 'wp-3', index: 3, x: 5, y: -13, status: 'pending', speedLimit: 1.0, label: 'DITCH-02 SCAN' },
  { id: 'wp-4', index: 4, x: -16, y: -9, status: 'pending', speedLimit: 1.4, label: 'DELTA PERIMETER' },
  { id: 'wp-5', index: 5, x: 0, y: 0, status: 'pending', speedLimit: 0.8, label: 'BASE HOME' },
];

export const SIMULATED_OBSTACLES: PerceptionObstacle[] = [
  { id: 'obs-1', type: 'NEGATIVE_VOID', x: 4.0, y: 3.0, distance: 5.0, confidence: 0.96, severity: 'MEDIUM' },   // Trench-Bravo
  { id: 'obs-2', type: 'NEGATIVE_VOID', x: -8.0, y: -4.0, distance: 8.9, confidence: 0.94, severity: 'MEDIUM' }, // Trench-Alpha
  { id: 'obs-3', type: 'NEGATIVE_VOID', x: 15.0, y: -12.0, distance: 19.2, confidence: 0.88, severity: 'LOW' }, // Trench-Charlie
  { id: 'obs-4', type: 'NEGATIVE_VOID', x: -2.0, y: -13.0, distance: 13.1, confidence: 0.91, severity: 'LOW' }, // Trench-Delta
  { id: 'obs-5', type: 'DEBRIS', x: 3.5, y: 0.8, distance: 3.6, confidence: 0.98, severity: 'MEDIUM' },
  { id: 'obs-6', type: 'DEBRIS', x: 11.2, y: -4.3, distance: 12.0, confidence: 0.85, severity: 'LOW' },
  { id: 'obs-7', type: 'DEBRIS', x: -10.2, y: 5.4, distance: 11.5, confidence: 0.87, severity: 'LOW' },
  { id: 'obs-8', type: 'DEBRIS', x: 18.5, y: 4.2, distance: 18.9, confidence: 0.82, severity: 'LOW' },
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
  private lastEvadeLogTime: number = 0;

  constructor() {
    this.addLog('INFO', 'NETRA_CORE', 'Netra UGV Ground Control Station initialized');
    this.addLog('INFO', 'CAN_BUS', 'CAN-FD motor control bus initialized. cmd_vel dispatch active.');
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
    // Clamp coordinates strictly within the 50m x 36m battlefield perimeter
    const clampedX = Math.max(-23, Math.min(23, Number(x.toFixed(1))));
    const clampedY = Math.max(-15, Math.min(15, Number(y.toFixed(1))));
    const newWp: Waypoint = {
      id: `wp-${Date.now().toString(36)}-${nextIndex}`,
      index: nextIndex,
      x: clampedX,
      y: clampedY,
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
      this.failsafe.modeLabel = 'CRITICAL SENSOR BLACKOUT (Level 3)';
      this.failsafe.vMaxAllowed = 0.0;
      this.failsafe.zeroizationEngaged = true;
      playEmergencyAlertSound();
      this.addLog('DANGER', 'SENSOR', 'CRITICAL: Complete sensor blackout detected. Initiating safe halt procedure.');
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
    this.addLog('WARN', 'SENSOR', 'Optical sensor arrays offline. Switching to IMU dead-reckoning limp mode.');
    this.notify();
  }

  public resetZeroization() {
    this.failsafe.zeroizationEngaged = false;
    this.setFailsafeLevel(0);
    this.addLog('INFO', 'SENSOR', 'Optical sensor arrays recovered. Resuming visual odometry and perception pipeline.');
    this.notify();
  }

  // Demo Scenarios Handler
  public setDemoScenario(scenario: string) {
    this.demoScenario = scenario;
    if (scenario === 'SAR_ROUTE') {
      this.waypoints = [
        { id: 'wp-sar1', index: 1, x: -10, y: -8, status: 'pending', speedLimit: 1.0, label: 'RUBBLE ENTRY' },
        { id: 'wp-sar2', index: 2, x: -5,  y: 2,  status: 'pending', speedLimit: 0.8, label: 'CLEARING A' },
        { id: 'wp-sar3', index: 3, x: 5,   y: -3, status: 'pending', speedLimit: 1.0, label: 'SEARCH ZONE 1' },
        { id: 'wp-sar4', index: 4, x: 12,  y: 5,  status: 'pending', speedLimit: 1.2, label: 'CLEARING B' },
        { id: 'wp-sar5', index: 5, x: 18,  y: 10, status: 'pending', speedLimit: 1.0, label: 'EXTRACTION POINT' },
      ];
      this.setMode('WAYPOINT_AUTO');
      this.startWaypointMission();
      this.addLog('INFO', 'DEMO', 'Demo Scenario: Search & Rescue Route (5 WPs) loaded & running');
    } else if (scenario === 'NEGATIVE_OBSTACLE') {
      this.waypoints = [
        { id: 'wp-no1', index: 1, x: 5, y: 5, status: 'pending', speedLimit: 1.2, label: 'DITCH-01 APPROACH' },
        { id: 'wp-no2', index: 2, x: 14, y: -6, status: 'pending', speedLimit: 1.0, label: 'VOID BYPASS' },
        { id: 'wp-no3', index: 3, x: 0, y: 0, status: 'pending', speedLimit: 0.9, label: 'BASE CP' },
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

    // Motor command freshness counter & CAN-FD dispatch
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
            if (this.demoScenario === 'SAR_ROUTE') {
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

          // --- Dynamic Obstacle Perception & TEB Evasive Avoidance ---
          let evadeSteerBias = 0;
          let obstacleSpeedFactor = 1.0;
          let activeEvadeObs: PerceptionObstacle | null = null;

          this.obstacles.forEach(obs => {
            const oDx = obs.x - this.pose.x;
            const oDy = obs.y - this.pose.y;
            const oDist = Math.hypot(oDx, oDy);
            obs.distance = Number(oDist.toFixed(1));

            // Bearing from UGV to obstacle
            const bearingToObs = ((Math.atan2(oDx, oDy) * 180) / Math.PI + 360) % 360;
            let relBearing = bearingToObs - this.pose.heading;
            while (relBearing > 180) relBearing -= 360;
            while (relBearing < -180) relBearing += 360;

            // Update severity based on proximity
            if (oDist < 3.5) obs.severity = 'CRITICAL';
            else if (oDist < 7.0) obs.severity = 'MEDIUM';
            else obs.severity = 'LOW';

            // Obstacle in path: within 6.0m and inside forward cone (+-65 deg)
            if (oDist < 6.0 && Math.abs(relBearing) < 65) {
              const steerDir = relBearing >= 0 ? -1 : 1;
              const proximityWeight = (6.0 - oDist) / 6.0;
              evadeSteerBias += steerDir * proximityWeight * 42;
              obstacleSpeedFactor = Math.min(obstacleSpeedFactor, Math.max(0.35, (oDist - 0.8) / 5.2));
              activeEvadeObs = obs;
            }
          });

          // Apply evasive steering if obstacle blocks current trajectory
          if (activeEvadeObs && Math.abs(evadeSteerBias) > 4) {
            targetHeadingDeg = (targetHeadingDeg + evadeSteerBias + 360) % 360;
            if (Date.now() - this.lastEvadeLogTime > 4000) {
              const targetObs = activeEvadeObs as PerceptionObstacle;
            this.addLog('WARN', 'PLANNER', `TEB Planner: Executing active detour around ${targetObs.type} at ${targetObs.distance}m`);
              this.lastEvadeLogTime = Date.now();
            }
          }

          // Shortest angle difference
          let angleDiff = targetHeadingDeg - this.pose.heading;
          while (angleDiff > 180) angleDiff -= 360;
          while (angleDiff < -180) angleDiff += 360;

          // Pure pursuit angular velocity
          const pGain = 0.035;
          let desiredAngVel = angleDiff * pGain;
          desiredAngVel = Math.max(-1.8, Math.min(1.8, desiredAngVel));

          // Linear velocity based on alignment and obstacle proximity
          const alignmentFactor = Math.max(0.2, Math.cos((angleDiff * Math.PI) / 180));
          const targetSpeed = (activeWp.speedLimit || 1.5) * alignmentFactor * obstacleSpeedFactor;
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

    // Enforce 50m x 36m Battlefield Boundary (-23.5m to +23.5m X, -16.0m to +16.0m Y)
    const MAX_X = 23.5;
    const MAX_Y = 16.0;

    if (this.pose.x > MAX_X) {
      this.pose.x = MAX_X;
      this.pose.linearVelocity *= 0.5;
    } else if (this.pose.x < -MAX_X) {
      this.pose.x = -MAX_X;
      this.pose.linearVelocity *= 0.5;
    }

    if (this.pose.y > MAX_Y) {
      this.pose.y = MAX_Y;
      this.pose.linearVelocity *= 0.5;
    } else if (this.pose.y < -MAX_Y) {
      this.pose.y = -MAX_Y;
      this.pose.linearVelocity *= 0.5;
    }

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
