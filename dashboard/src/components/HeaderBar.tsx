import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  AlertTriangle,
  PlayCircle
} from 'lucide-react';
import { ugvEngine } from '../services/simulationEngine';
import { isSoundEnabled, setSoundEnabled, playTacticalBlip } from '../utils/audio';
import type { NavigationMode } from '../types/telemetry';

interface HeaderBarProps {
  mode: NavigationMode;
  failsafeMode: number;
  onEmergencyStop: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ mode, failsafeMode, onEmergencyStop }) => {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [scenario, setScenario] = useState<string>('OFF');
  const [missionTime, setMissionTime] = useState(0);
  const [clock, setClock] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setMissionTime(t => t + 1);
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour12: false }) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `T+${m}:${s}`;
  };

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setScenario(val);
    ugvEngine.setDemoScenario(val);
    playTacticalBlip(980);
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playTacticalBlip(1200);
  };

  return (
    <header className="h-16 bg-tactical-900 border-b border-tactical-700/80 px-4 flex items-center justify-between z-30 select-none shadow-lg">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded bg-emerald-950/60 border border-emerald-500/50 glow-emerald">
          <span className="font-mono font-black text-emerald-400 text-lg tracking-tighter">N-2</span>
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider text-base text-slate-100 flex items-center gap-1.5">
              NETRA UGV <span className="text-xs px-1.5 py-0.5 rounded bg-tactical-700 text-cyan-400 font-mono font-semibold">GCS-v2.5</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 font-mono">
              BEL DEFENCE
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span>S-ROS2 SECURE NODE</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400">CAN-FD AUTH: AES-128</span>
          </div>
        </div>
      </div>

      {/* Center Mission & Demo Mode Bar */}
      <div className="flex items-center gap-3">
        {/* Navigation Mode Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-tactical-850 border border-tactical-700">
          <span className="text-[11px] text-slate-400 font-mono uppercase">MODE:</span>
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
            mode === 'WAYPOINT_AUTO' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
            mode === 'MANUAL' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
            mode === 'LIMP_HOME' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' :
            'bg-slate-700/40 text-slate-300'
          }`}>
            {mode}
          </span>
        </div>

        {/* DEMO MODE SELECTOR */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-tactical-800 border border-emerald-500/40 shadow-inner">
          <div className="flex items-center gap-1.5">
            <PlayCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-emerald-300">DEMO MODE:</span>
          </div>
          <select
            value={scenario}
            onChange={handleScenarioChange}
            className="bg-tactical-900 text-xs font-mono text-slate-200 border border-tactical-600 rounded px-2.5 py-1 focus:outline-none focus:border-emerald-400 cursor-pointer"
          >
            <option value="OFF">MANUAL / IDLE</option>
            <option value="PATROL_BORDER">▶ SCENARIO 1: Perimeter Patrol (5 WPs)</option>
            <option value="NEGATIVE_OBSTACLE">▶ SCENARIO 2: Negative Trench Void Avoidance</option>
            <option value="LENS_WASHOUT">▶ SCENARIO 3: Mud Splatter & Air-Purge</option>
          </select>
        </div>

        {/* Failsafe Level Badge */}
        {failsafeMode > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-950/80 border border-rose-500 text-rose-300 text-xs font-mono animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>LEVEL {failsafeMode} DEGRADED</span>
          </div>
        )}
      </div>

      {/* Right Controls: Telemetry Clock, Audio, E-STOP */}
      <div className="flex items-center gap-3">
        <div className="text-right font-mono hidden md:block">
          <div className="text-xs text-slate-200 font-semibold">{clock}</div>
          <div className="text-[11px] text-emerald-400">{formatTimer(missionTime)}</div>
        </div>

        <button
          onClick={toggleSound}
          title={soundOn ? "Disable Tactical Audio" : "Enable Tactical Audio"}
          className={`p-2 rounded border transition-colors ${
            soundOn 
              ? 'bg-tactical-800 text-cyan-400 border-tactical-600 hover:bg-tactical-750' 
              : 'bg-tactical-900 text-slate-500 border-tactical-800 hover:text-slate-300'
          }`}
        >
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* EMERGENCY STOP BUTTON */}
        <button
          onClick={onEmergencyStop}
          className="flex items-center gap-2 px-4 py-2 rounded font-mono font-bold text-xs bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40 border border-red-400 active:scale-95 transition-all glow-danger"
        >
          <ShieldAlert className="w-4 h-4 animate-bounce" />
          <span>E-STOP</span>
        </button>
      </div>
    </header>
  );
};
