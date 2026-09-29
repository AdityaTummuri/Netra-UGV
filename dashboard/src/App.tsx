import React, { useState, useEffect } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { CentralLiveView } from './components/LiveView/CentralLiveView';
import { DriveControlPanel } from './components/ControlPanel/DriveControlPanel';
import { TelemetryHealthPanel } from './components/ControlPanel/TelemetryHealthPanel';
import { ugvEngine } from './services/simulationEngine';
import type { UGVPose, Waypoint, FailsafeState, SystemHealth, PerceptionObstacle, LogEntry, NavigationMode, FailsafeLevel } from './types/telemetry';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { playTacticalBlip } from './utils/audio';

export const App: React.FC = () => {
  // Real-time state from simulation engine
  const [pose, setPose] = useState<UGVPose>(ugvEngine.getPose());
  const [failsafe, setFailsafe] = useState<FailsafeState>(ugvEngine.getFailsafe());
  const [health, setHealth] = useState<SystemHealth>(ugvEngine.getHealth());
  const [waypoints, setWaypoints] = useState<Waypoint[]>(ugvEngine.getWaypoints());
  const [obstacles, setObstacles] = useState<PerceptionObstacle[]>(ugvEngine.getObstacles());
  const [mode, setMode] = useState<NavigationMode>(ugvEngine.getMode());
  const [trail, setTrail] = useState<[number, number][]>(ugvEngine.getTrail());
  const [logs, setLogs] = useState<LogEntry[]>(ugvEngine.getLogs());

  // Panel Collapsible Toggles
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // Subscribe to engine tick (20 Hz)
  useEffect(() => {
    const unsubscribe = ugvEngine.subscribe(() => {
      setPose(ugvEngine.getPose());
      setFailsafe(ugvEngine.getFailsafe());
      setHealth(ugvEngine.getHealth());
      setWaypoints(ugvEngine.getWaypoints());
      setObstacles(ugvEngine.getObstacles());
      setMode(ugvEngine.getMode());
      setTrail(ugvEngine.getTrail());
      setLogs(ugvEngine.getLogs());
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-tactical-950 font-sans text-slate-100 overflow-hidden select-none">
      {/* Top Tactical Mission Bar */}
      <HeaderBar
        mode={mode}
        failsafeMode={failsafe.currentMode}
        onEmergencyStop={() => ugvEngine.triggerEmergencyStop()}
      />

      {/* Main Workspace: Left Controls + Central Live View + Right Telemetry */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Teleoperation & Mission Panel */}
        {leftOpen && (
          <DriveControlPanel
            mode={mode}
            pose={pose}
            waypoints={waypoints}
            failsafe={failsafe}
            onSetMode={(m) => ugvEngine.setMode(m)}
            onStartMission={() => ugvEngine.startWaypointMission()}
            onClearWaypoints={() => ugvEngine.clearWaypoints()}
            onRemoveWaypoint={(id) => ugvEngine.removeWaypoint(id)}
          />
        )}

        {/* Toggle Left Button */}
        <button
          onClick={() => { setLeftOpen(!leftOpen); playTacticalBlip(600); }}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 p-1 rounded-r bg-tactical-800/90 hover:bg-tactical-700 text-slate-400 hover:text-white border-y border-r border-tactical-700 transition-all"
          style={{ left: leftOpen ? '320px' : '0px' }}
          title={leftOpen ? "Collapse Drive Controls" : "Expand Drive Controls"}
        >
          {leftOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* Central Live View Dashboard */}
        <CentralLiveView
          pose={pose}
          waypoints={waypoints}
          obstacles={obstacles}
          failsafe={failsafe}
          trail={trail}
          onAddWaypoint={(x, y) => ugvEngine.addWaypoint(x, y)}
          onRemoveWaypoint={(id) => ugvEngine.removeWaypoint(id)}
          onClearWaypoints={() => ugvEngine.clearWaypoints()}
          onStartMission={() => ugvEngine.startWaypointMission()}
          onTriggerAirPurge={() => ugvEngine.triggerAirPurge()}
        />

        {/* Toggle Right Button */}
        <button
          onClick={() => { setRightOpen(!rightOpen); playTacticalBlip(600); }}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 p-1 rounded-l bg-tactical-800/90 hover:bg-tactical-700 text-slate-400 hover:text-white border-y border-l border-tactical-700 transition-all"
          style={{ right: rightOpen ? '336px' : '0px' }}
          title={rightOpen ? "Collapse Telemetry Panel" : "Expand Telemetry Panel"}
        >
          {rightOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Right Failsafe & System Health Panel */}
        {rightOpen && (
          <TelemetryHealthPanel
            health={health}
            failsafe={failsafe}
            logs={logs}
            onTriggerAirPurge={() => ugvEngine.triggerAirPurge()}
            onSetFailsafeLevel={(lvl: FailsafeLevel) => ugvEngine.setFailsafeLevel(lvl)}
            onZeroize={() => ugvEngine.triggerZeroization()}
            onResetZeroize={() => ugvEngine.resetZeroization()}
          />
        )}
      </div>
    </div>
  );
};

export default App;
