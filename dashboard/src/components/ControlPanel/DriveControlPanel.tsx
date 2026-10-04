import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Gamepad2, 
  Navigation, 
  RotateCcw, 
  MapPin, 
  Play, 
  Trash2,
  Lock,
  Home
} from 'lucide-react';
import type { NavigationMode, UGVPose, Waypoint, FailsafeState } from '../../types/telemetry';
import { ugvEngine } from '../../services/simulationEngine';
import { playTacticalBlip } from '../../utils/audio';

interface DriveControlPanelProps {
  mode: NavigationMode;
  pose: UGVPose;
  waypoints: Waypoint[];
  failsafe: FailsafeState;
  onSetMode: (m: NavigationMode) => void;
  onStartMission: () => void;
  onClearWaypoints: () => void;
  onRemoveWaypoint: (id: string) => void;
}

export const DriveControlPanel: React.FC<DriveControlPanelProps> = ({
  mode,
  pose,
  waypoints,
  failsafe,
  onSetMode,
  onStartMission,
  onClearWaypoints,
  onRemoveWaypoint,
}) => {
  const [activeTab, setActiveTab] = useState<'TELEOP' | 'WAYPOINTS'>('TELEOP');
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingJoy, setIsDraggingJoy] = useState<boolean>(false);
  const [freshness, setFreshness] = useState<number>(14280);

  useEffect(() => {
    const timer = setInterval(() => {
      setFreshness(f => (f + 1) % 1000000);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Keyboard Teleop listener (WASD / Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') return;

      let lin = 0;
      let ang = 0;
      let keyMatched = false;

      if (e.key === 'w' || e.key === 'ArrowUp') { lin = 1.0; keyMatched = true; }
      if (e.key === 's' || e.key === 'ArrowDown') { lin = -0.7; keyMatched = true; }
      if (e.key === 'a' || e.key === 'ArrowLeft') { ang = 1.0; keyMatched = true; }
      if (e.key === 'd' || e.key === 'ArrowRight') { ang = -1.0; keyMatched = true; }
      if (e.key === ' ') { // Space = Brake
        ugvEngine.setTeleopCommand({ linear: 0, angular: 0, brake: true });
        return;
      }

      if (keyMatched) {
        if (mode !== 'MANUAL') ugvEngine.setMode('MANUAL');
        ugvEngine.setTeleopCommand({ linear: lin, angular: ang, brake: false });
        setJoystickPos({ x: -ang * 35, y: -lin * 35 });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['w', 's', 'a', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        ugvEngine.setTeleopCommand({ linear: 0, angular: 0, brake: false });
        setJoystickPos({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode]);

  // Virtual Joystick Pointer Handlers
  const handleJoystickMove = useCallback((clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2 - 15;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setJoystickPos({ x: dx, y: dy });

    // Normalize: Y inverted (-1 is backward, +1 is forward), X (-1 is right, +1 is left)
    const normLinear = -dy / maxRadius;
    const normAngular = -dx / maxRadius;

    if (mode !== 'MANUAL') {
      ugvEngine.setMode('MANUAL');
    }
    ugvEngine.setTeleopCommand({
      linear: normLinear,
      angular: normAngular,
      brake: false,
    });
  }, [mode]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDraggingJoy(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleJoystickMove(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingJoy) {
      handleJoystickMove(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = () => {
    setIsDraggingJoy(false);
    setJoystickPos({ x: 0, y: 0 });
    ugvEngine.setTeleopCommand({ linear: 0, angular: 0, brake: false });
  };

  // Generate pseudo SecOC CMAC hex
  const cmacHex = ((Math.abs(Math.sin(pose.linearVelocity * 100)) * 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0').toUpperCase();

  return (
    <div className="w-full h-full flex flex-col bg-tactical-900 border-r border-tactical-800 select-none overflow-hidden text-slate-200">
      {/* Tab Switcher */}
      <div className="h-10 bg-tactical-950 border-b border-tactical-800 flex items-center px-2 gap-1">
        <button
          onClick={() => { setActiveTab('TELEOP'); playTacticalBlip(700); }}
          className={`flex-1 py-1 px-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'TELEOP' ? 'bg-tactical-800 text-cyan-400 border border-tactical-700' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>DRIVE CONTROL</span>
        </button>

        <button
          onClick={() => { setActiveTab('WAYPOINTS'); playTacticalBlip(700); }}
          className={`flex-1 py-1 px-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'WAYPOINTS' ? 'bg-tactical-800 text-emerald-400 border border-tactical-700' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>MISSION ({waypoints.length})</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Navigation Mode Buttons */}
        <div>
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
            NAVIGATION ENGAGEMENT
          </label>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
            <button
              onClick={() => { onSetMode('MANUAL'); playTacticalBlip(800); }}
              className={`p-2 rounded border flex flex-col items-center gap-1 transition-all ${
                mode === 'MANUAL' 
                  ? 'bg-amber-600/30 border-amber-500 text-amber-300 font-bold glow-amber' 
                  : 'bg-tactical-850 border-tactical-750 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>MANUAL TELEOP</span>
            </button>

            <button
              onClick={() => { onStartMission(); playTacticalBlip(800); }}
              className={`p-2 rounded border flex flex-col items-center gap-1 transition-all ${
                mode === 'WAYPOINT_AUTO' 
                  ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300 font-bold glow-cyan' 
                  : 'bg-tactical-850 border-tactical-750 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>AUTO WAYPOINT</span>
            </button>

            <button
              onClick={() => { onSetMode('RTL'); playTacticalBlip(800); }}
              className={`p-2 rounded border flex flex-col items-center gap-1 transition-all ${
                mode === 'RTL' 
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold glow-emerald' 
                  : 'bg-tactical-850 border-tactical-750 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>RETURN TO BASE</span>
            </button>

            <button
              onClick={() => { onSetMode('LIMP_HOME'); playTacticalBlip(800); }}
              className={`p-2 rounded border flex flex-col items-center gap-1 transition-all ${
                mode === 'LIMP_HOME' 
                  ? 'bg-rose-600/30 border-rose-500 text-rose-300 font-bold glow-danger' 
                  : 'bg-tactical-850 border-tactical-750 text-slate-400 hover:text-slate-200'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>LIMP-TO-HALT</span>
            </button>
          </div>
        </div>

        {activeTab === 'TELEOP' ? (
          <>
            {/* Interactive Virtual Joystick */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-tactical-950 border border-tactical-800">
              <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between w-full">
                <span>VIRTUAL FLIGHTSTICK</span>
                <span className="text-cyan-400">WASD ENABLED</span>
              </div>

              <div
                ref={joystickRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative w-40 h-40 rounded-full bg-tactical-900 border-2 border-tactical-700 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing shadow-inner"
              >
                {/* Crosshair guide lines */}
                <div className="absolute w-full h-[1px] bg-tactical-800" />
                <div className="absolute h-full w-[1px] bg-tactical-800" />
                <div className="absolute w-24 h-24 rounded-full border border-tactical-800/80 pointer-events-none" />

                {/* Joystick Knob */}
                <div
                  style={{
                    transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
                    transition: isDraggingJoy ? 'none' : 'transform 0.15s ease-out',
                  }}
                  className="w-14 h-14 rounded-full bg-cyan-600/80 border-2 border-cyan-400 shadow-lg glow-cyan flex items-center justify-center pointer-events-none"
                >
                  <div className="w-4 h-4 rounded-full bg-cyan-200" />
                </div>
              </div>

              {/* Real-time Velocity Readout */}
              <div className="grid grid-cols-2 gap-2 w-full mt-3 font-mono text-xs">
                <div className="p-2 rounded bg-tactical-900 border border-tactical-800">
                  <div className="text-[10px] text-slate-400">LINEAR VEL</div>
                  <div className="text-cyan-300 font-bold">{pose.linearVelocity.toFixed(2)} m/s</div>
                </div>
                <div className="p-2 rounded bg-tactical-900 border border-tactical-800">
                  <div className="text-[10px] text-slate-400">ANGULAR YAW</div>
                  <div className="text-cyan-300 font-bold">{pose.angularVelocity.toFixed(2)} rad/s</div>
                </div>
              </div>
            </div>

            {/* SecOC Authenticated CAN Message Details */}
            <div className="p-3 rounded-lg bg-tactical-950 border border-tactical-800 font-mono text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-tactical-800">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  SecOC CAN-FD FRAME
                </span>
                <span className="text-[10px] text-slate-500">20 Hz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Topic:</span>
                <span className="text-slate-200">/netra/cmd_vel_secured</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Freshness:</span>
                <span className="text-cyan-300">#{freshness}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">AES-128 CMAC:</span>
                <span className="text-emerald-400 font-mono">0x{cmacHex}F8A1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Max Allowed:</span>
                <span className="text-amber-400">{failsafe.vMaxAllowed.toFixed(1)} m/s</span>
              </div>
            </div>
          </>
        ) : (
          /* Waypoints Tab */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={onStartMission}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>START MISSION</span>
              </button>
              <button
                onClick={onClearWaypoints}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-tactical-800 text-slate-300 hover:text-red-400 font-mono text-xs border border-tactical-755 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>CLEAR</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              💡 Tip: Click anywhere directly on the Central 2D Map to insert waypoints!
            </div>

            {/* Waypoints List */}
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {waypoints.length === 0 ? (
                <div className="text-center py-8 text-xs font-mono text-slate-500 border border-dashed border-tactical-800 rounded">
                  No mission waypoints placed.<br />Click map or pick a demo scenario.
                </div>
              ) : (
                waypoints.map(wp => {
                  const dist = Math.hypot(wp.x - pose.x, wp.y - pose.y).toFixed(1);
                  return (
                    <div
                      key={wp.id}
                      className={`p-2 rounded border font-mono text-xs flex items-center justify-between transition-colors ${
                        wp.status === 'active' 
                          ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-200' 
                          : wp.status === 'reached' 
                          ? 'bg-tactical-950 border-tactical-800 text-slate-500 line-through' 
                          : 'bg-tactical-850 border-tactical-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-tactical-900 border border-tactical-700 flex items-center justify-center text-[10px] font-bold">
                          {wp.index}
                        </span>
                        <div>
                          <div className="font-bold">{wp.label || `WP-${wp.index}`}</div>
                          <div className="text-[10px] text-slate-400">
                            ({wp.x}m, {wp.y}m) • {dist}m away
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                          wp.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 animate-pulse' :
                          wp.status === 'reached' ? 'bg-slate-800 text-slate-400' : 'bg-tactical-800 text-cyan-300'
                        }`}>
                          {wp.status}
                        </span>
                        <button
                          onClick={() => onRemoveWaypoint(wp.id)}
                          className="p-1 hover:text-red-400 text-slate-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
