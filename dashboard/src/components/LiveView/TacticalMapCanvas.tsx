import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Trash2, 
  Play, 
  Crosshair, 
  ZoomIn, 
  ZoomOut, 
  Layers,
  Compass,
  Shield
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

type MapLayer = 'TOPOGRAPHIC' | 'AI_COSTMAP' | 'SATELLITE_RECON';

// Procedural battlefield features matching Webots 50x36m tactical world
const HILLS = [
  { cx: -5, cy: 2, r: 3.5, a: 1.1 },
  { cx: 8, cy: -6, r: 4.0, a: 1.4 },
  { cx: 14, cy: 10, r: 3.0, a: 1.0 },
  { cx: -14, cy: -8, r: 4.0, a: 0.9 },
  { cx: 0, cy: 12, r: 3.5, a: 1.2 },
  { cx: 20, cy: -2, r: 3.0, a: 1.0 },
];

const TRENCHES = [
  { cx: -8, cy: -4, w: 1.3, h: 8.0, name: 'TRENCH-ALPHA' },
  { cx: 4, cy: 3, w: 10.0, h: 1.3, name: 'TRENCH-BRAVO' },
  { cx: 15, cy: -12, w: 1.3, h: 7.0, name: 'TRENCH-CHARLIE' },
  { cx: -2, cy: -13, w: 8.0, h: 1.3, name: 'TRENCH-DELTA' },
];

// Fixed seed boulder coordinates
const BOULDERS = [
  { x: 3.5, y: 0.8, r: 0.6 },
  { x: -10.2, y: 5.4, r: 0.5 },
  { x: -15.5, y: 8.2, r: 0.7 },
  { x: -3.8, y: -8.1, r: 0.6 },
  { x: 11.2, y: -4.3, r: 0.8 },
  { x: 18.5, y: 4.2, r: 0.6 },
  { x: -6.4, y: 14.1, r: 0.7 },
  { x: 8.1, y: 15.2, r: 0.5 },
  { x: 16.4, y: -8.5, r: 0.7 },
  { x: 2.3, y: -16.4, r: 0.6 },
  { x: -18.2, y: -3.4, r: 0.8 },
  { x: 14.2, y: 3.1, r: 0.6 },
];

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
  const [scale, setScale] = useState<number>(8.5); // 8.5 pixels = 1 meter
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: -pose.x, y: -pose.y });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number } | null>(null);
  const [autoCenter, setAutoCenter] = useState<boolean>(true);
  const [selectedWpId, setSelectedWpId] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<MapLayer>('AI_COSTMAP');
  const [radarSweepAngle, setRadarSweepAngle] = useState<number>(0);

  // Animate radar sweep
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarSweepAngle(prev => (prev + 4) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Auto-center on UGV if active
  useEffect(() => {
    if (autoCenter) {
      setOffset({ x: -pose.x, y: -pose.y });
    }
  }, [pose.x, pose.y, autoCenter]);

  // Screen to World coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number, width: number, height: number) => {
    const originX = width / 2;
    const originY = height / 2;
    const worldX = (screenX - originX) / scale - offset.x;
    const worldY = -(screenY - originY) / scale - offset.y;
    return { x: worldX, y: worldY };
  }, [scale, offset]);

  // World to Screen coordinates
  const worldToScreen = useCallback((worldX: number, worldY: number, width: number, height: number) => {
    const originX = width / 2;
    const originY = height / 2;
    const screenX = originX + (worldX + offset.x) * scale;
    const screenY = originY - (worldY + offset.y) * scale;
    return { x: screenX, y: screenY };
  }, [scale, offset]);

  // Mouse handlers
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
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
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

  // Canvas click to select or place waypoint
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 || e.shiftKey) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const clickedExisting = waypoints.find(w => {
      const sp = worldToScreen(w.x, w.y, canvas.width, canvas.height);
      const dist = Math.hypot(sp.x - sx, sp.y - sy);
      return dist < 16;
    });

    if (clickedExisting) {
      setSelectedWpId(clickedExisting.id);
      playTacticalBlip(1100);
      return;
    }

    const world = screenToWorld(sx, sy, canvas.width, canvas.height);
    onAddWaypoint(world.x, world.y);
  };

  const handleZoom = (factor: number) => {
    setScale(s => Math.min(26, Math.max(3.5, s * factor)));
    playTacticalBlip(750);
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    // 1. Dark Base Map Canvas
    ctx.fillStyle = mapLayer === 'AI_COSTMAP' ? '#070b12' : mapLayer === 'TOPOGRAPHIC' ? '#090d16' : '#05080f';
    ctx.fillRect(0, 0, width, height);

    // 2. Operational Battlefield Boundary (50m x 36m)
    const boundsTL = worldToScreen(-25, 18, width, height);
    const boundsBR = worldToScreen(25, -18, width, height);
    const boundsW = boundsBR.x - boundsTL.x;
    const boundsH = boundsBR.y - boundsTL.y;

    // Tactical boundary fill
    ctx.fillStyle = mapLayer === 'AI_COSTMAP' ? 'rgba(16, 28, 48, 0.4)' : 'rgba(20, 30, 45, 0.3)';
    ctx.fillRect(boundsTL.x, boundsTL.y, boundsW, boundsH);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(boundsTL.x, boundsTL.y, boundsW, boundsH);
    ctx.setLineDash([]);

    // 3. Topographic Elevation Contours / Hills
    if (mapLayer === 'TOPOGRAPHIC' || mapLayer === 'AI_COSTMAP') {
      HILLS.forEach(h => {
        const hp = worldToScreen(h.cx, h.cy, width, height);
        const hr = h.r * scale;

        // Concentric contour rings
        for (let ring = 1; ring <= 4; ring++) {
          const rFrac = (ring / 4) * hr;
          ctx.beginPath();
          ctx.arc(hp.x, hp.y, rFrac, 0, Math.PI * 2);
          ctx.strokeStyle = mapLayer === 'AI_COSTMAP' 
            ? `rgba(34, 197, 94, ${0.12 * ring})` 
            : `rgba(234, 179, 8, ${0.15 * ring})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Contour elevation label
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`+${h.a.toFixed(1)}m`, hp.x, hp.y - hr - 3);
      });
    }

    // 4. Negative Obstacles (Trenches & Ditches with Warning Stripes)
    TRENCHES.forEach(t => {
      const tp = worldToScreen(t.cx - t.w / 2, t.cy + t.h / 2, width, height);
      const tw = t.w * scale;
      const th = t.h * scale;

      // Dark ditch interior
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.fillRect(tp.x, tp.y, tw, th);

      // Hazard border
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(tp.x, tp.y, tw, th);

      // Warning text
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`⚠️ ${t.name}`, tp.x + tw / 2, tp.y - 4);
    });

    // 5. Boulders / Rigid Obstacles
    BOULDERS.forEach(b => {
      const bp = worldToScreen(b.x, b.y, width, height);
      const br = b.r * scale;

      // Clearance safety zone
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, br * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
      ctx.fill();

      // Boulder body
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, br, 0, Math.PI * 2);
      ctx.fillStyle = '#64748b';
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 6. Tactical Grid & Range Coordinate Markers
    const origin = worldToScreen(0, 0, width, height);
    const gridStepMeters = scale > 12 ? 5 : 10;
    const gridStepPx = gridStepMeters * scale;

    ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(100, 116, 139, 0.5)';
    ctx.font = '9px "JetBrains Mono", monospace';

    // Vertical grid
    const startX = (origin.x % gridStepPx) - gridStepPx;
    for (let x = startX; x < width + gridStepPx; x += gridStepPx) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      const wx = Math.round(screenToWorld(x, 0, width, height).x);
      if (wx % 10 === 0) {
        ctx.fillText(`${wx}m`, x + 3, height - 8);
      }
    }

    // Horizontal grid
    const startY = (origin.y % gridStepPx) - gridStepPx;
    for (let y = startY; y < height + gridStepPx; y += gridStepPx) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      const wy = Math.round(screenToWorld(0, y, width, height).y);
      if (wy % 10 === 0 && wy !== 0) {
        ctx.fillText(`${wy}m`, 6, y - 3);
      }
    }

    // Range rings around Origin / Base CP
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.setLineDash([3, 3]);
    for (let r of [15, 30, 45]) {
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, r * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText(`${r}m`, origin.x + r * scale + 4, origin.y - 4);
    }
    ctx.setLineDash([]);

    // Base CP Marker at origin
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillText('BASE CP (0,0)', origin.x + 10, origin.y + 3);

    // Goal Marker (at +21, +13 matching Webots mission)
    const goalPos = worldToScreen(21, 13, width, height);
    ctx.beginPath();
    ctx.arc(goalPos.x, goalPos.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#eab308';
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#eab308';
    ctx.fillText('MISSION GOAL (+21,+13)', goalPos.x + 12, goalPos.y + 3);

    // 7. Dynamic Kinematic Breadcrumb Trail
    if (trail.length > 1) {
      ctx.lineWidth = 2.5;
      for (let i = 0; i < trail.length - 1; i++) {
        const p1 = worldToScreen(trail[i][0], trail[i][1], width, height);
        const p2 = worldToScreen(trail[i + 1][0], trail[i + 1][1], width, height);
        
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.7)';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // 8. Planned Autonomous Waypoint Lines
    if (waypoints.length > 0) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);

      const ugvSc = worldToScreen(pose.x, pose.y, width, height);
      const firstWpSc = worldToScreen(waypoints[0].x, waypoints[0].y, width, height);

      ctx.beginPath();
      ctx.moveTo(ugvSc.x, ugvSc.y);
      ctx.lineTo(firstWpSc.x, firstWpSc.y);
      for (let i = 0; i < waypoints.length - 1; i++) {
        const wp2 = worldToScreen(waypoints[i + 1].x, waypoints[i + 1].y, width, height);
        ctx.lineTo(wp2.x, wp2.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Waypoint Nodes
      waypoints.forEach((wp, idx) => {
        const sp = worldToScreen(wp.x, wp.y, width, height);
        const isSelected = wp.id === selectedWpId;

        // Selection ring
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 16, 0, Math.PI * 2);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Waypoint pin body
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = wp.status === 'active' ? '#10b981' : wp.status === 'reached' ? '#38bdf8' : '#06b6d4';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`WP-${String(idx + 1).padStart(2, '0')}`, sp.x, sp.y - 12);
      });
    }

    // 9. UGV Vehicle Position & Sensor Heading Cone
    const ugvPos = worldToScreen(pose.x, pose.y, width, height);
    const headingRad = ((pose.heading - 90) * Math.PI) / 180;

    // Sensor Field of View (FOV) Perception Cone (73° Luxonis OAK-D)
    const fovHalfRad = (73 / 2) * (Math.PI / 180);
    const fovRange = 24 * scale;

    ctx.save();
    ctx.translate(ugvPos.x, ugvPos.y);

    const fovGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, fovRange);
    fovGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    fovGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.12)');
    fovGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
    ctx.fillStyle = fovGrad;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, fovRange, headingRad - fovHalfRad, headingRad + fovHalfRad);
    ctx.closePath();
    ctx.fill();

    // Radar scanline sweep effect
    const sweepRad = (radarSweepAngle * Math.PI) / 180;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(sweepRad) * fovRange * 0.85, Math.sin(sweepRad) * fovRange * 0.85);
    ctx.stroke();

    // UGV Chassis (Skid-steer 4-wheel representation)
    ctx.rotate(headingRad);

    const chassisL = 1.2 * scale;
    const chassisW = 0.9 * scale;

    // Wheels
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-chassisL / 2 - 2, -chassisW / 2 - 3, chassisL / 2.5, 4);
    ctx.fillRect(chassisL / 6, -chassisW / 2 - 3, chassisL / 2.5, 4);
    ctx.fillRect(-chassisL / 2 - 2, chassisW / 2 - 1, chassisL / 2.5, 4);
    ctx.fillRect(chassisL / 6, chassisW / 2 - 1, chassisL / 2.5, 4);

    // Body
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-chassisL / 2, -chassisW / 2, chassisL, chassisW);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-chassisL / 2, -chassisW / 2, chassisL, chassisW);

    // Forward Direction Arrow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(chassisL / 2 + 3, 0);
    ctx.lineTo(chassisL / 6, -chassisW / 3);
    ctx.lineTo(chassisL / 6, chassisW / 3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    ctx.restore();
  }, [pose, waypoints, obstacles, trail, scale, offset, worldToScreen, screenToWorld, selectedWpId, mapLayer, radarSweepAngle]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col bg-tactical-950 overflow-hidden select-none">
      {/* Top Map Layer & Action Toolbar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        {/* Layer Selector */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-tactical-900/90 backdrop-blur-md border border-tactical-700/80 p-1 rounded-lg shadow-xl">
          <button
            onClick={() => { setMapLayer('AI_COSTMAP'); playTacticalBlip(850); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-xs transition-all ${
              mapLayer === 'AI_COSTMAP' ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>AI COSTMAP</span>
          </button>

          <button
            onClick={() => { setMapLayer('TOPOGRAPHIC'); playTacticalBlip(850); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-xs transition-all ${
              mapLayer === 'TOPOGRAPHIC' ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-900/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>CONTOURS</span>
          </button>
        </div>

        {/* Mission Quick Execution Controls */}
        <div className="flex items-center gap-2 pointer-events-auto bg-tactical-900/90 backdrop-blur-md border border-tactical-700/80 px-2 py-1 rounded-lg shadow-xl">
          <button
            onClick={onStartMission}
            disabled={waypoints.length === 0}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-mono text-xs font-bold transition-all shadow-md shadow-emerald-900/40"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>EXECUTE MISSION ({waypoints.length})</span>
          </button>

          <button
            onClick={onClearWaypoints}
            disabled={waypoints.length === 0}
            className="p-1.5 rounded hover:bg-tactical-800 text-slate-400 hover:text-red-400 disabled:opacity-30 transition-colors"
            title="Clear All Waypoints"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-tactical-700" />

          {/* Auto-Center Toggle */}
          <button
            onClick={() => { setAutoCenter(!autoCenter); playTacticalBlip(650); }}
            className={`p-1.5 rounded transition-colors ${
              autoCenter ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Auto-Center on UGV"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Zoom In / Out */}
          <button
            onClick={() => handleZoom(1.2)}
            className="p-1.5 rounded hover:bg-tactical-800 text-slate-400 hover:text-slate-200"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            className="p-1.5 rounded hover:bg-tactical-800 text-slate-400 hover:text-slate-200"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Selected Waypoint Card */}
      {selectedWpId && (() => {
        const selWp = waypoints.find(w => w.id === selectedWpId);
        if (!selWp) return null;
        const distFromUgv = Math.hypot(selWp.x - pose.x, selWp.y - pose.y);
        return (
          <div className="absolute top-16 right-4 z-20 bg-tactical-900/90 backdrop-blur-md border border-tactical-700/80 p-2.5 rounded-lg text-xs font-mono shadow-2xl flex items-center gap-3 animate-fade-in">
            <div>
              <div className="text-amber-400 font-bold">SELECTED: WP-{waypoints.findIndex(w => w.id === selectedWpId) + 1}</div>
              <div className="text-slate-400 text-[11px]">COORDS: ({selWp.x.toFixed(1)}m, {selWp.y.toFixed(1)}m) | RNG: {distFromUgv.toFixed(1)}m</div>
            </div>
            <button
              onClick={() => {
                onRemoveWaypoint(selWp.id);
                setSelectedWpId(null);
              }}
              className="px-2 py-1 rounded bg-red-600/30 text-red-300 hover:bg-red-600 hover:text-white transition-colors text-[11px] font-bold"
            >
              DELETE WP
            </button>
            <button
              onClick={() => setSelectedWpId(null)}
              className="px-1.5 py-1 rounded text-slate-500 hover:text-slate-300 text-[11px]"
            >
              ✕
            </button>
          </div>
        );
      })()}

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair"
      />

      {/* Bottom Coordinates & Field Status HUD */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-3 pointer-events-auto bg-tactical-900/90 backdrop-blur-md border border-tactical-700/80 px-3 py-1.5 rounded-lg text-xs font-mono shadow-xl">
          <div className="flex items-center gap-1 text-slate-400">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>MGRS:</span>
            <span className="text-white font-semibold">43R XN 7284 1942</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-slate-400">
            <span>GRID COORDS:</span>{' '}
            <span className="text-cyan-300 font-semibold">
              X: {mouseCoords ? mouseCoords.x : pose.x.toFixed(1)}m, Y: {mouseCoords ? mouseCoords.y : pose.y.toFixed(1)}m
            </span>
          </div>
        </div>

        {/* Tactical Legend overlay */}
        <div className="flex items-center gap-2.5 pointer-events-auto bg-tactical-900/90 backdrop-blur-md border border-tactical-700/80 px-3 py-1.5 rounded-lg text-[11px] font-mono shadow-xl text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>SOLID</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>MUD</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span>TRENCH VOID</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span>BOULDER</span>
          </div>
        </div>
      </div>
    </div>
  );
};
