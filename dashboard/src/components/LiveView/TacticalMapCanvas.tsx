import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Trash2, 
  Play, 
  Crosshair, 
  ZoomIn, 
  ZoomOut, 
  MapPin
} from 'lucide-react';
import type { UGVPose, Waypoint, PerceptionObstacle } from '../../types/telemetry';
import { playTacticalBlip } from '../../utils/audio';

interface TacticalMapCanvasProps {
  pose: UGVPose;
  waypoints: Waypoint[];
  obstacles: PerceptionObstacle[];
  trail: [number, number][];
  onAddWaypoint: (x: number, y: number) => void;
  onRemoveWaypoint: (id: string) => void;
  onClearWaypoints: () => void;
  onStartMission: () => void;
}

export const TacticalMapCanvas: React.FC<TacticalMapCanvasProps> = ({
  pose,
  waypoints,
  obstacles,
  trail,
  onAddWaypoint,
  onRemoveWaypoint,
  onClearWaypoints,
  onStartMission,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Viewport transformation: scale (pixels per meter), offset in meters
  const [scale, setScale] = useState<number>(7); // 7 pixels = 1 meter
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number } | null>(null);
  const [autoCenter, setAutoCenter] = useState<boolean>(true);
  const [selectedWpId, setSelectedWpId] = useState<string | null>(null);

  // Auto-center on UGV if active
  useEffect(() => {
    if (autoCenter) {
      setOffset({ x: -pose.x, y: -pose.y });
    }
  }, [pose.x, pose.y, autoCenter]);

  // Convert canvas pixel coordinates to world meters
  const screenToWorld = useCallback((screenX: number, screenY: number, width: number, height: number) => {
    const originX = width / 2;
    const originY = height / 2;
    const worldX = (screenX - originX) / scale - offset.x;
    const worldY = -(screenY - originY) / scale - offset.y; // Invert Y so up is positive
    return { x: worldX, y: worldY };
  }, [scale, offset]);

  // Convert world meters to canvas pixel coordinates
  const worldToScreen = useCallback((worldX: number, worldY: number, width: number, height: number) => {
    const originX = width / 2;
    const originY = height / 2;
    const screenX = originX + (worldX + offset.x) * scale;
    const screenY = originY - (worldY + offset.y) * scale;
    return { x: screenX, y: screenY };
  }, [scale, offset]);

  // Handle canvas mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (isDragging) {
      setAutoCenter(false);
      const dx = (sx - dragStart.x) / scale;
      const dy = -(sy - dragStart.y) / scale;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: sx, y: sy });
    } else {
      const world = screenToWorld(sx, sy, canvas.width, canvas.height);
      setMouseCoords({ x: Number(world.x.toFixed(1)), y: Number(world.y.toFixed(1)) });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.button === 2 || e.shiftKey) { // Middle click or shift drag to pan
      setIsDragging(true);
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Click on canvas to place waypoint!
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If middle click or shift pan, don't place waypoint
    if (e.button !== 0 || e.shiftKey) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // Check if clicked close to an existing waypoint to select/inspect
    const clickedExisting = waypoints.find(w => {
      const sp = worldToScreen(w.x, w.y, canvas.width, canvas.height);
      const dist = Math.hypot(sp.x - sx, sp.y - sy);
      return dist < 14;
    });

    if (clickedExisting) {
      setSelectedWpId(clickedExisting.id);
      playTacticalBlip(1100);
      return;
    }

    // Otherwise place new waypoint!
    const world = screenToWorld(sx, sy, canvas.width, canvas.height);
    onAddWaypoint(world.x, world.y);
  };

  // Zoom handlers
  const handleZoom = (factor: number) => {
    setScale(s => Math.min(22, Math.max(3, s * factor)));
    playTacticalBlip(750);
  };

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handling
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    const width = displayWidth;
    const height = displayHeight;

    // 1. Clear background
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Tactical Grid
    const origin = worldToScreen(0, 0, width, height);
    const gridSizeMeters = scale > 10 ? 5 : 10;
    const gridPixelStep = gridSizeMeters * scale;

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(30, 45, 70, 0.4)';
    ctx.fillStyle = 'rgba(100, 130, 170, 0.4)';
    ctx.font = '10px "JetBrains Mono", monospace';

    // Vertical grid lines
    const startX = (origin.x % gridPixelStep) - gridPixelStep;
    for (let x = startX; x < width + gridPixelStep; x += gridPixelStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      const worldX = Math.round(screenToWorld(x, 0, width, height).x);
      if (worldX % 10 === 0) {
        ctx.fillText(`${worldX}m`, x + 3, height - 8);
      }
    }

    // Horizontal grid lines
    const startY = (origin.y % gridPixelStep) - gridPixelStep;
    for (let y = startY; y < height + gridPixelStep; y += gridPixelStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      const worldY = Math.round(screenToWorld(0, y, width, height).y);
      if (worldY % 10 === 0 && worldY !== 0) {
        ctx.fillText(`${worldY}m`, 6, y - 3);
      }
    }

    // Concentric Range Rings from Base (0, 0)
    [25, 50, 75, 100].forEach(r => {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, r * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.fillText(`${r}M RANGE`, origin.x + 4, origin.y - r * scale + 12);
    });

    // 3. Draw Base / Home Station (0, 0)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('BASE CP (0,0)', origin.x + 12, origin.y + 3);

    // 4. Draw Detected Obstacles / Negative Voids (from netra_mapping)
    obstacles.forEach(obs => {
      const sp = worldToScreen(obs.x, obs.y, width, height);
      if (obs.type === 'NEGATIVE_VOID' || obs.type === 'TRENCH') {
        // Red hazard zone for negative obstacle void
        ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cross pattern inside
        ctx.beginPath();
        ctx.moveTo(sp.x - 10, sp.y - 10);
        ctx.lineTo(sp.x + 10, sp.y + 10);
        ctx.moveTo(sp.x + 10, sp.y - 10);
        ctx.lineTo(sp.x - 10, sp.y + 10);
        ctx.stroke();

        ctx.fillStyle = '#f87171';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(`! ${obs.type} [${obs.distance}m]`, sp.x + 18, sp.y + 3);
      } else {
        // Bunker / Vehicle
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sp.x - 10, sp.y - 10, 20, 20);
        ctx.fillStyle = '#fbbf24';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(`${obs.type} [${obs.distance}m]`, sp.x + 14, sp.y + 3);
      }
    });

    // 5. Draw Breadcrumb Trail (Past path)
    if (trail.length > 1) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const first = worldToScreen(trail[0][0], trail[0][1], width, height);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < trail.length; i++) {
        const pt = worldToScreen(trail[i][0], trail[i][1], width, height);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }

    // 6. Draw Waypoint Route Lines (Kinodynamic Planned Path)
    if (waypoints.length > 0) {
      // Connect UGV to first active waypoint
      const activeWp = waypoints.find(w => w.status === 'active') || waypoints.find(w => w.status === 'pending');
      const ugvScreen = worldToScreen(pose.x, pose.y, width, height);

      if (activeWp) {
        const activeScreen = worldToScreen(activeWp.x, activeWp.y, width, height);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(ugvScreen.x, ugvScreen.y);
        ctx.lineTo(activeScreen.x, activeScreen.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Connect waypoints sequentially
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < waypoints.length - 1; i++) {
        const p1 = worldToScreen(waypoints[i].x, waypoints[i].y, width, height);
        const p2 = worldToScreen(waypoints[i + 1].x, waypoints[i + 1].y, width, height);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Draw Waypoint Markers
      waypoints.forEach((wp) => {
        const wpScreen = worldToScreen(wp.x, wp.y, width, height);
        const isSelected = selectedWpId === wp.id;
        const isActive = wp.status === 'active';
        const isReached = wp.status === 'reached';

        // Outer pulsing ring for active waypoint
        if (isActive) {
          const pulse = (Date.now() / 300) % (Math.PI * 2);
          const pulseRadius = 14 + Math.sin(pulse) * 4;
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(wpScreen.x, wpScreen.y, pulseRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Marker circle
        ctx.fillStyle = isReached 
          ? '#064e3b' 
          : isActive 
          ? '#059669' 
          : isSelected 
          ? '#0284c7' 
          : '#1e293b';
        ctx.strokeStyle = isReached 
          ? '#10b981' 
          : isActive 
          ? '#34d399' 
          : isSelected 
          ? '#38bdf8' 
          : '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(wpScreen.x, wpScreen.y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Waypoint number text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(wp.index), wpScreen.x, wpScreen.y);

        // Label Tag
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = isActive ? '#34d399' : '#94a3b8';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(`${wp.label || `WP-${wp.index}`} (${wp.x}m, ${wp.y}m)`, wpScreen.x + 14, wpScreen.y + 4);
      });
    }

    // 7. Draw Live UGV Vehicle
    const ugvPos = worldToScreen(pose.x, pose.y, width, height);
    ctx.save();
    ctx.translate(ugvPos.x, ugvPos.y);
    const headingAngleRad = -((pose.heading * Math.PI) / 180);
    ctx.rotate(headingAngleRad);

    // Sensor Field of View (FOV) Perception Cone (BiSeNetV2 + Stereo Camera)
    const fovAngle = (75 * Math.PI) / 180;
    const fovRange = 35 * scale;
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, fovRange);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
    grad.addColorStop(0.8, 'rgba(6, 182, 212, 0.08)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, fovRange, -fovAngle / 2, fovAngle / 2);
    ctx.closePath();
    ctx.fill();

    // FOV border rays
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(-fovAngle / 2) * fovRange, Math.sin(-fovAngle / 2) * fovRange);
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(fovAngle / 2) * fovRange, Math.sin(fovAngle / 2) * fovRange);
    ctx.stroke();
    ctx.setLineDash([]);

    // UGV Chassis (Military 6-wheel / tracked vehicle)
    const bodyL = 22;
    const bodyW = 14;

    // Track treads
    ctx.fillStyle = '#334155';
    ctx.fillRect(-bodyL / 2 - 2, -bodyW / 2 - 3, bodyL + 4, 3);
    ctx.fillRect(-bodyL / 2 - 2, bodyW / 2, bodyL + 4, 3);

    // Main Chassis
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-bodyL / 2, -bodyW / 2, bodyL, bodyW, 3);
    ctx.fill();
    ctx.stroke();

    // Direction Nose / Front Indicator
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(bodyL / 2, 0);
    ctx.lineTo(bodyL / 2 - 5, -4);
    ctx.lineTo(bodyL / 2 - 5, 4);
    ctx.closePath();
    ctx.fill();

    // Sensor Turret Dome
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // UGV Telemetry Label floating next to vehicle
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillText(`UGV [${pose.x.toFixed(1)}m, ${pose.y.toFixed(1)}m]`, ugvPos.x + 16, ugvPos.y - 10);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText(`${pose.linearVelocity.toFixed(2)} m/s | ${pose.heading.toFixed(0)}°`, ugvPos.x + 16, ugvPos.y + 3);

    ctx.restore();
  }, [pose, waypoints, obstacles, trail, scale, offset, selectedWpId, screenToWorld, worldToScreen]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col bg-tactical-950 overflow-hidden select-none">
      {/* Top Map HUD Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 pointer-events-auto bg-tactical-900/90 backdrop-blur border border-tactical-700/80 px-3 py-1.5 rounded-lg shadow-lg">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold text-slate-200">TACTICAL 2D PATH PLANNER</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            CLICK ANYWHERE TO PLACE WAYPOINT
          </span>
        </div>

        {/* Live Cursor Coordinates Readout */}
        <div className="flex items-center gap-2 pointer-events-auto bg-tactical-900/90 backdrop-blur border border-tactical-700/80 px-3 py-1.5 rounded-lg shadow-lg text-xs font-mono">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">CURSOR:</span>
          <span className="text-cyan-300 font-semibold">
            {mouseCoords ? `X: ${mouseCoords.x}m  Y: ${mouseCoords.y}m` : '--'}
          </span>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
      />

      {/* Floating Bottom Action Toolbar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        {/* Left: Waypoint Actions */}
        <div className="flex items-center gap-2 pointer-events-auto bg-tactical-900/90 backdrop-blur border border-tactical-700/80 p-1.5 rounded-lg shadow-xl">
          <button
            onClick={onStartMission}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs transition-colors glow-emerald"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>EXECUTE MISSION ({waypoints.filter(w => w.status !== 'reached').length} WP)</span>
          </button>

          <button
            onClick={onClearWaypoints}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-tactical-800 hover:bg-red-950/60 hover:text-red-400 border border-tactical-700 text-slate-300 font-mono text-xs transition-colors"
            title="Clear all waypoints"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR</span>
          </button>

          {selectedWpId && (
            <button
              onClick={() => {
                onRemoveWaypoint(selectedWpId);
                setSelectedWpId(null);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-red-900/40 border border-red-500/50 text-red-300 font-mono text-xs hover:bg-red-900/60"
            >
              <span>DELETE SELECTED WP</span>
            </button>
          )}
        </div>

        {/* Right: Map Nav Controls (Zoom, Re-center) */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-tactical-900/90 backdrop-blur border border-tactical-700/80 p-1.5 rounded-lg shadow-xl">
          <button
            onClick={() => setAutoCenter(!autoCenter)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded font-mono text-xs transition-colors ${
              autoCenter 
                ? 'bg-cyan-600/30 border border-cyan-500 text-cyan-300' 
                : 'bg-tactical-800 border border-tactical-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Keep vehicle centered in view"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>TRACK UGV</span>
          </button>

          <button
            onClick={() => handleZoom(1.25)}
            className="p-1.5 rounded bg-tactical-800 border border-tactical-700 text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleZoom(0.8)}
            className="p-1.5 rounded bg-tactical-800 border border-tactical-700 text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
