import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Battery, 
  Cpu, 
  Wifi, 
  Thermometer, 
  AlertTriangle, 
  Terminal, 
  Wind, 
  KeyRound,
  RotateCcw
} from 'lucide-react';
import type { SystemHealth, FailsafeState, LogEntry, FailsafeLevel } from '../../types/telemetry';
import { playTacticalBlip } from '../../utils/audio';

interface TelemetryHealthPanelProps {
  health: SystemHealth;
  failsafe: FailsafeState;
  logs: LogEntry[];
  onTriggerAirPurge: () => void;
  onSetFailsafeLevel: (level: FailsafeLevel) => void;
  onZeroize: () => void;
  onResetZeroize: () => void;
}

export const TelemetryHealthPanel: React.FC<TelemetryHealthPanelProps> = ({
  health,
  failsafe,
  logs,
  onTriggerAirPurge,
  onSetFailsafeLevel,
  onZeroize,
  onResetZeroize,
}) => {
  const [zeroizeSafetyCover, setZeroizeSafetyCover] = useState<boolean>(false);
  const [logFilter, setLogFilter] = useState<'ALL' | 'DANGER' | 'SECOC'>('ALL');

  const filteredLogs = logs.filter(l => {
    if (logFilter === 'ALL') return true;
    if (logFilter === 'DANGER') return l.level === 'DANGER' || l.level === 'WARN';
    if (logFilter === 'SECOC') return l.level === 'SECOC';
    return true;
  });

  return (
    <div className="w-84 h-full flex flex-col bg-tactical-900 border-l border-tactical-800 select-none overflow-hidden text-slate-200">
      {/* Header */}
      <div className="h-10 bg-tactical-950 border-b border-tactical-800 px-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-slate-200">FAILSAFE & HEALTH</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>FUSION 500Hz</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Failsafe State Selector Hierarchy */}
        <div className="p-3 rounded-xl bg-tactical-950 border border-tactical-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 uppercase font-bold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              FAILSAFE LEVEL
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              failsafe.currentMode === 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
              failsafe.currentMode === 1 ? 'bg-amber-950 text-amber-400 border border-amber-500/40' :
              'bg-red-950 text-red-400 border border-red-500/40 animate-pulse'
            }`}>
              LVL {failsafe.currentMode}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
            <button
              onClick={() => { onSetFailsafeLevel(0); playTacticalBlip(800); }}
              className={`p-1.5 rounded border text-left transition-colors ${
                failsafe.currentMode === 0 
                  ? 'bg-emerald-900/40 border-emerald-500 text-emerald-200 font-bold' 
                  : 'bg-tactical-900 border-tactical-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-bold">L0: NOMINAL</div>
              <div className="text-[9px] text-slate-500">Full Autonomy</div>
            </button>

            <button
              onClick={() => { onSetFailsafeLevel(1); playTacticalBlip(800); }}
              className={`p-1.5 rounded border text-left transition-colors ${
                failsafe.currentMode === 1 
                  ? 'bg-amber-900/40 border-amber-500 text-amber-200 font-bold' 
                  : 'bg-tactical-900 border-tactical-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-bold">L1: DEGRADED</div>
              <div className="text-[9px] text-slate-500">Speed Capped 0.8</div>
            </button>

            <button
              onClick={() => { onSetFailsafeLevel(2); playTacticalBlip(800); }}
              className={`p-1.5 rounded border text-left transition-colors ${
                failsafe.currentMode === 2 
                  ? 'bg-red-900/40 border-red-500 text-red-200 font-bold' 
                  : 'bg-tactical-900 border-tactical-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-bold">L2: CRITICAL</div>
              <div className="text-[9px] text-slate-500">Limp-to-Halt 0.3</div>
            </button>

            <button
              onClick={() => { onSetFailsafeLevel(3); playTacticalBlip(800); }}
              className={`p-1.5 rounded border text-left transition-colors ${
                failsafe.currentMode === 3 
                  ? 'bg-red-950 border-red-600 text-red-300 font-bold glow-danger' 
                  : 'bg-tactical-900 border-tactical-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-bold">L3: TAMPER</div>
              <div className="text-[9px] text-slate-500">Zeroize Hardware</div>
            </button>
          </div>

          {/* Lens Obscuration & Air Purge Quick Button */}
          <div className="pt-2 border-t border-tactical-800 flex items-center justify-between text-xs font-mono">
            <div>
              <div className="text-[10px] text-slate-400">LENS OBSCURATION</div>
              <div className="font-bold text-amber-300">
                {(failsafe.cameraLensObscuration * 100).toFixed(0)}%
              </div>
            </div>
            <button
              onClick={onTriggerAirPurge}
              disabled={failsafe.airPurgeFiring}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-700/60 hover:bg-cyan-600 border border-cyan-500 text-white text-xs font-mono font-bold transition-all"
            >
              <Wind className="w-3.5 h-3.5" />
              <span>{failsafe.airPurgeFiring ? 'PURGING...' : 'FIRE AIR-PURGE'}</span>
            </button>
          </div>
        </div>

        {/* FIPS 140-3 Hardware Zeroization Crowbar Trigger */}
        <div className="p-3 rounded-xl bg-tactical-950 border border-red-900/60 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-red-400 font-bold">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              HARDWARE ZEROIZATION
            </span>
            <span className="text-[10px] text-slate-400">FIPS 140-3</span>
          </div>

          {failsafe.zeroizationEngaged ? (
            <div className="space-y-2">
              <div className="p-2 rounded bg-red-950/80 border border-red-600 text-red-300 text-center animate-pulse">
                KEYS ERASED • HARDWARE CROWBAR FIRED
              </div>
              <button
                onClick={onResetZeroize}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-tactical-800 hover:bg-tactical-750 text-emerald-400 border border-emerald-500/40 text-xs font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESTORE MILITARY ESCROW KEYS</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={zeroizeSafetyCover}
                  onChange={(e) => setZeroizeSafetyCover(e.target.checked)}
                  className="rounded bg-tactical-800 border-tactical-700 text-red-600 focus:ring-0"
                />
                <span>Flip Physical Safety Guard Cover</span>
              </label>

              <button
                onClick={onZeroize}
                disabled={!zeroizeSafetyCover}
                className={`w-full py-1.5 rounded font-bold text-xs uppercase transition-all ${
                  zeroizeSafetyCover 
                    ? 'bg-red-600 hover:bg-red-500 text-white glow-danger' 
                    : 'bg-tactical-850 text-slate-600 cursor-not-allowed border border-tactical-800'
                }`}
              >
                EXECUTE HARDWARE ZEROIZE
              </button>
            </div>
          )}
        </div>

        {/* Vital Telemetry Gauges: Battery, RF, Temps */}
        <div className="space-y-2 font-mono text-xs">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider">
            SYSTEM TELEMETRY
          </div>

          {/* Battery Status */}
          <div className="p-2.5 rounded-lg bg-tactical-950 border border-tactical-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
                24V LiFePO4 PACK
              </span>
              <span className="text-emerald-400 font-bold">{health.batteryPct.toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 rounded bg-tactical-800 overflow-hidden">
              <div 
                style={{ width: `${health.batteryPct}%` }}
                className={`h-full transition-all ${
                  health.batteryPct > 40 ? 'bg-emerald-500' : health.batteryPct > 20 ? 'bg-amber-500' : 'bg-red-500'
                }`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>{health.batteryVoltage.toFixed(1)} V</span>
              <span>{health.currentAmps.toFixed(1)} A Draw</span>
            </div>
          </div>

          {/* RF & SecOC Auth */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-tactical-950 border border-tactical-800">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Wifi className="w-3 h-3 text-cyan-400" />
                <span>RF LINK</span>
              </div>
              <div className="text-cyan-300 font-bold">{health.rfSignalDbm} dBm</div>
              <div className="text-[9px] text-slate-500">{health.latencyMs}ms ping</div>
            </div>

            <div className="p-2 rounded-lg bg-tactical-950 border border-tactical-800">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <ShieldAlert className="w-3 h-3 text-emerald-400" />
                <span>SECOC PASS</span>
              </div>
              <div className="text-emerald-300 font-bold">{health.secocAuthRate}%</div>
              <div className="text-[9px] text-slate-500">AES-128 Valid</div>
            </div>
          </div>

          {/* Motors & Tip-Over Risk */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-tactical-950 border border-tactical-800">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Thermometer className="w-3 h-3 text-amber-400" />
                <span>MOTOR TEMPS</span>
              </div>
              <div className="text-amber-300 font-bold">{health.motorTempL.toFixed(1)}°C</div>
              <div className="text-[9px] text-slate-500">R: {health.motorTempR.toFixed(1)}°C</div>
            </div>

            <div className="p-2 rounded-lg bg-tactical-950 border border-tactical-800">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>TIP-OVER RISK</span>
              </div>
              <div className={`font-bold ${health.tipOverRisk > 0.5 ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
                {(health.tipOverRisk * 100).toFixed(0)}%
              </div>
              <div className="text-[9px] text-slate-500">TEB Guard</div>
            </div>
          </div>
        </div>

        {/* Live Event Log */}
        <div className="p-2.5 rounded-lg bg-tactical-950 border border-tactical-800 font-mono text-[10px] space-y-2">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1 font-bold">
              <Terminal className="w-3 h-3 text-cyan-400" />
              S-ROS2 EVENT AUDIT
            </span>
            <div className="flex gap-1 text-[9px]">
              <button
                onClick={() => setLogFilter('ALL')}
                className={`px-1.5 py-0.5 rounded ${logFilter === 'ALL' ? 'bg-tactical-700 text-white' : 'text-slate-500'}`}
              >
                ALL
              </button>
              <button
                onClick={() => setLogFilter('DANGER')}
                className={`px-1.5 py-0.5 rounded ${logFilter === 'DANGER' ? 'bg-red-900/60 text-red-300' : 'text-slate-500'}`}
              >
                ALERT
              </button>
              <button
                onClick={() => setLogFilter('SECOC')}
                className={`px-1.5 py-0.5 rounded ${logFilter === 'SECOC' ? 'bg-emerald-900/60 text-emerald-300' : 'text-slate-500'}`}
              >
                SECOC
              </button>
            </div>
          </div>

          <div className="h-32 overflow-y-auto space-y-1 pr-1 font-mono text-[10px]">
            {filteredLogs.map(l => (
              <div key={l.id} className="flex gap-1.5 leading-tight">
                <span className="text-slate-500 shrink-0">{l.timestamp}</span>
                <span className={`shrink-0 font-bold ${
                  l.level === 'DANGER' ? 'text-red-400' :
                  l.level === 'WARN' ? 'text-amber-400' :
                  l.level === 'SECOC' ? 'text-emerald-400' :
                  'text-cyan-400'
                }`}>
                  [{l.source}]
                </span>
                <span className="text-slate-300 break-words">{l.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
