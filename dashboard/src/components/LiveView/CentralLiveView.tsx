import React, { useState } from 'react';
import { 
  Map, 
  Video, 
  Radio, 
  Columns, 
  ArrowLeftRight
} from 'lucide-react';
import { TacticalMapCanvas } from './TacticalMapCanvas';
import { CameraHUD } from './CameraHUD';
import { LidarView } from './LidarView';
import type { UGVPose, Waypoint, PerceptionObstacle, FailsafeState } from '../../types/telemetry';
import { playTacticalBlip } from '../../utils/audio';

interface CentralLiveViewProps {
  pose: UGVPose;
  waypoints: Waypoint[];
  obstacles: PerceptionObstacle[];
  failsafe: FailsafeState;
  trail: [number, number][];
  onAddWaypoint: (x: number, y: number) => void;
  onRemoveWaypoint: (id: string) => void;
  onClearWaypoints: () => void;
  onStartMission: () => void;
  onTriggerAirPurge: () => void;
}

type CentralViewMode = 'MAP_PRIMARY' | 'CAMERA_PRIMARY' | 'SPLIT' | 'LIDAR';

export const CentralLiveView: React.FC<CentralLiveViewProps> = ({
  pose,
  waypoints,
  obstacles,
  failsafe,
  trail,
  onAddWaypoint,
  onRemoveWaypoint,
  onClearWaypoints,
  onStartMission,
  onTriggerAirPurge,
}) => {
  const [viewMode, setViewMode] = useState<CentralViewMode>('MAP_PRIMARY');
  const [pipVisible, setPipVisible] = useState<boolean>(true);

  const handleTabChange = (mode: CentralViewMode) => {
    setViewMode(mode);
    playTacticalBlip(850);
  };

  const swapViews = () => {
    setViewMode(prev => prev === 'MAP_PRIMARY' ? 'CAMERA_PRIMARY' : 'MAP_PRIMARY');
    playTacticalBlip(950);
  };

  return (
    <div className="relative flex-1 flex flex-col min-h-0 bg-tactical-950 border-x border-tactical-800 overflow-hidden">
      {/* View Switcher Top Bar */}
      <div className="h-10 bg-tactical-900 border-b border-tactical-800 px-3 flex items-center justify-between z-20 select-none">
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleTabChange('MAP_PRIMARY')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-colors ${
              viewMode === 'MAP_PRIMARY' 
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 font-bold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-tactical-800'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>2D TACTICAL MAP & WAYPOINTS</span>
          </button>

          <button
            onClick={() => handleTabChange('CAMERA_PRIMARY')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-colors ${
              viewMode === 'CAMERA_PRIMARY' 
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 font-bold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-tactical-800'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>FORWARD SENSOR HUD</span>
          </button>

          <button
            onClick={() => handleTabChange('SPLIT')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-colors ${
              viewMode === 'SPLIT' 
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 font-bold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-tactical-800'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>SPLIT VIEW</span>
          </button>

          <button
            onClick={() => handleTabChange('LIDAR')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-colors ${
              viewMode === 'LIDAR' 
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 font-bold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-tactical-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>360° LIDAR RAYCASTER</span>
          </button>
        </div>

        {/* Quick PIP Toggle / Swap */}
        {(viewMode === 'MAP_PRIMARY' || viewMode === 'CAMERA_PRIMARY') && (
          <div className="flex items-center gap-2">
            <button
              onClick={swapViews}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-tactical-800 hover:bg-tactical-750 text-slate-300 text-xs font-mono border border-tactical-700"
              title="Swap main view and PIP"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>SWAP</span>
            </button>
            <button
              onClick={() => setPipVisible(!pipVisible)}
              className="px-2 py-1 rounded bg-tactical-800 hover:bg-tactical-750 text-slate-400 hover:text-slate-200 text-xs font-mono border border-tactical-700"
            >
              {pipVisible ? 'HIDE PIP' : 'SHOW PIP'}
            </button>
          </div>
        )}
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 min-h-0 w-full h-full">
        {/* Single Full View Modes */}
        {viewMode === 'MAP_PRIMARY' && (
          <TacticalMapCanvas
            pose={pose}
            waypoints={waypoints}
            obstacles={obstacles}
            trail={trail}
            onAddWaypoint={onAddWaypoint}
            onRemoveWaypoint={onRemoveWaypoint}
            onClearWaypoints={onClearWaypoints}
            onStartMission={onStartMission}
          />
        )}

        {viewMode === 'CAMERA_PRIMARY' && (
          <CameraHUD
            pose={pose}
            failsafe={failsafe}
            obstacles={obstacles}
            onTriggerAirPurge={onTriggerAirPurge}
          />
        )}

        {viewMode === 'LIDAR' && (
          <LidarView
            pose={pose}
            obstacles={obstacles}
          />
        )}

        {/* Split Screen Mode */}
        {viewMode === 'SPLIT' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 w-full h-full divide-y lg:divide-y-0 lg:divide-x divide-tactical-800">
            <div className="w-full h-full relative">
              <TacticalMapCanvas
                pose={pose}
                waypoints={waypoints}
                obstacles={obstacles}
                trail={trail}
                onAddWaypoint={onAddWaypoint}
                onRemoveWaypoint={onRemoveWaypoint}
                onClearWaypoints={onClearWaypoints}
                onStartMission={onStartMission}
              />
            </div>
            <div className="w-full h-full relative">
              <CameraHUD
                pose={pose}
                failsafe={failsafe}
                obstacles={obstacles}
                onTriggerAirPurge={onTriggerAirPurge}
              />
            </div>
          </div>
        )}

        {/* Floating Picture-in-Picture (PIP) Window */}
        {pipVisible && viewMode === 'MAP_PRIMARY' && (
          <div className="absolute bottom-16 right-4 w-72 h-48 rounded-lg overflow-hidden border-2 border-emerald-500/50 shadow-2xl z-20 bg-tactical-950/90 group">
            <div className="absolute top-1 left-2 z-30 flex items-center gap-1.5 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-slate-200">LIVE FORWARD CAM</span>
            </div>
            <CameraHUD
              pose={pose}
              failsafe={failsafe}
              obstacles={obstacles}
              onTriggerAirPurge={onTriggerAirPurge}
            />
          </div>
        )}

        {pipVisible && viewMode === 'CAMERA_PRIMARY' && (
          <div className="absolute bottom-16 right-4 w-72 h-48 rounded-lg overflow-hidden border-2 border-cyan-500/50 shadow-2xl z-20 bg-tactical-950/90 group">
            <div className="absolute top-1 left-2 z-30 flex items-center gap-1.5 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[10px] font-mono font-bold text-slate-200">TACTICAL MAP PIP</span>
            </div>
            <TacticalMapCanvas
              pose={pose}
              waypoints={waypoints}
              obstacles={obstacles}
              trail={trail}
              onAddWaypoint={onAddWaypoint}
              onRemoveWaypoint={onRemoveWaypoint}
              onClearWaypoints={onClearWaypoints}
              onStartMission={onStartMission}
            />
          </div>
        )}
      </div>
    </div>
  );
};
