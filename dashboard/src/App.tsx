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

  // Panel Resizing & Collapsible State
  const [leftWidth, setLeftWidth] = useState<number>(320);
  const [leftOpen, setLeftOpen] = useState<boolean>(true);
  const [rightWidth, setRightWidth] = useState<number>(340);
  const [rightOpen, setRightOpen] = useState<boolean>(true);

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

  // Left panel resize drag
  const handleLeftResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = leftOpen ? leftWidth : 0;

    const onMouseMove = (moveEvt: MouseEvent) => {
      const newW = Math.max(220, Math.min(500, startW + (moveEvt.clientX - startX)));
      setLeftWidth(newW);
      if (!leftOpen) setLeftOpen(true);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Right panel resize drag
  const handleRightResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = rightOpen ? rightWidth : 0;

    const onMouseMove = (moveEvt: MouseEvent) => {
      const newW = Math.max(240, Math.min(540, startW - (moveEvt.clientX - startX)));
      setRightWidth(newW);
      if (!rightOpen) setRightOpen(true);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-tactical-950 font-sans text-slate-100 overflow-hidden select-none">
      {/* Top Tactical Mission Bar */}
      <HeaderBar
        mode={mode}
        failsafeMode={failsafe.currentMode}
        onEmergencyStop={() => ugvEngine.triggerEmergencyStop()}
      />

      {/* Main Workspace: Left Controls + Central Live View + Right Telemetry */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden select-none">
        {/* Left Teleoperation & Mission Panel */}
        <div
          style={{ width: leftOpen ? `${leftWidth}px` : '0px' }}
          className="h-full flex-shrink-0 transition-all duration-75 overflow-hidden flex flex-col"
        >
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
        </div>

        {/* Left Resizing Splitter Bar */}
        <div
          onMouseDown={handleLeftResizeStart}
          onDoubleClick={() => { setLeftWidth(320); setLeftOpen(!leftOpen); playTacticalBlip(600); }}
          className="relative group w-2 bg-tactical-950 hover:bg-cyan-500/20 active:bg-cyan-500/40 cursor-col-resize transition-colors flex items-center justify-center shrink-0 z-20 border-r border-tactical-800"
          title="Drag to slide and resize Drive Controls / Double click to reset or toggle"
        >
          {/* Vertical Grip Handle */}
          <div className="w-0.5 h-12 bg-tactical-700 group-hover:bg-cyan-400 group-hover:h-20 rounded-full transition-all duration-150" />

          {/* Clean Toggle Chevron at the top of the rail */}
          <button
            onClick={(e) => { e.stopPropagation(); setLeftOpen(!leftOpen); playTacticalBlip(600); }}
            className="absolute top-2.5 -right-3 z-30 p-1 rounded bg-tactical-900/95 border border-tactical-700/80 text-slate-400 hover:text-white hover:border-cyan-500 shadow-md transition-all cursor-pointer"
            title={leftOpen ? "Collapse Drive Controls" : "Expand Drive Controls"}
          >
            {leftOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        </div>

        {/* Central Live View Dashboard */}
        <div className="flex-1 min-w-0 h-full overflow-hidden relative flex flex-col">
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
        </div>

        {/* Right Resizing Splitter Bar */}
        <div
          onMouseDown={handleRightResizeStart}
          onDoubleClick={() => { setRightWidth(340); setRightOpen(!rightOpen); playTacticalBlip(600); }}
          className="relative group w-2 bg-tactical-950 hover:bg-cyan-500/20 active:bg-cyan-500/40 cursor-col-resize transition-colors flex items-center justify-center shrink-0 z-20 border-l border-tactical-800"
          title="Drag to slide and resize Telemetry Panel / Double click to reset or toggle"
        >
          {/* Vertical Grip Handle */}
          <div className="w-0.5 h-12 bg-tactical-700 group-hover:bg-cyan-400 group-hover:h-20 rounded-full transition-all duration-150" />

          {/* Clean Toggle Chevron at the top of the rail */}
          <button
            onClick={(e) => { e.stopPropagation(); setRightOpen(!rightOpen); playTacticalBlip(600); }}
            className="absolute top-2.5 -left-3 z-30 p-1 rounded bg-tactical-900/95 border border-tactical-700/80 text-slate-400 hover:text-white hover:border-cyan-500 shadow-md transition-all cursor-pointer"
            title={rightOpen ? "Collapse Telemetry Panel" : "Expand Telemetry Panel"}
          >
            {rightOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </div>

        {/* Right Failsafe & System Health Panel */}
        <div
          style={{ width: rightOpen ? `${rightWidth}px` : '0px' }}
          className="h-full flex-shrink-0 transition-all duration-75 overflow-hidden flex flex-col"
        >
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
    </div>
  );
};

export default App;
