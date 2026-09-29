import React, { useRef, useEffect, useState } from 'react';
import { 
  Eye, 
  Flame, 
  Moon, 
  Wind 
} from 'lucide-react';
import type { UGVPose, FailsafeState, PerceptionObstacle } from '../../types/telemetry';
import { playTacticalBlip } from '../../utils/audio';

interface CameraHUDProps {
  pose: UGVPose;
  failsafe: FailsafeState;
  obstacles: PerceptionObstacle[];
  onTriggerAirPurge: () => void;
}

type VisionMode = 'RGB' | 'THERMAL' | 'NVG';

export const CameraHUD: React.FC<CameraHUDProps> = ({
  pose,
  failsafe,
  obstacles,
  onTriggerAirPurge,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visionMode, setVisionMode] = useState<VisionMode>('RGB');

  const switchVisionMode = (mode: VisionMode) => {
    setVisionMode(mode);
    playTacticalBlip(900);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Draw 3D Ground & Sky Perspective View
      const pitchOffset = (pose.pitch / 25) * (height * 0.35);
      const horizonY = height / 2 + pitchOffset;
      const rollRad = (pose.roll * Math.PI) / 180;

      // Color scheme based on vision mode
      let skyColor = '#0f172a';
      let groundColor1 = '#1e293b';
      let groundColor2 = '#090d16';
      let hudColor = '#10b981';

      if (visionMode === 'THERMAL') {
        skyColor = '#120a1c';
        groundColor1 = '#281335';
        groundColor2 = '#08030c';
        hudColor = '#fbbf24';
      } else if (visionMode === 'NVG') {
        skyColor = '#021807';
        groundColor1 = '#063a12';
        groundColor2 = '#021205';
        hudColor = '#4ade80';
      }

      // Sky
      ctx.fillStyle = skyColor;
      ctx.fillRect(0, 0, width, height);

      // Rotated Ground Plane with Horizon
      ctx.save();
      ctx.translate(width / 2, horizonY);
      ctx.rotate(rollRad);

      // Ground Gradient
      const groundGrad = ctx.createLinearGradient(0, 0, 0, height);
      groundGrad.addColorStop(0, groundColor1);
      groundGrad.addColorStop(1, groundColor2);
      ctx.fillStyle = groundGrad;
      ctx.fillRect(-width, 0, width * 2, height * 2);

      // Ground Perspective Lines (Moving with linear velocity)
      const forwardMovement = (pose.odometryDistance * 30) % 50;
      ctx.strokeStyle = visionMode === 'THERMAL' 
        ? 'rgba(251, 191, 36, 0.15)' 
        : visionMode === 'NVG' 
        ? 'rgba(74, 222, 128, 0.2)' 
        : 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1.5;

      // Horizontal perspective grid steps
      for (let z = 10; z < height; z += 35) {
        const yPos = z + forwardMovement;
        if (yPos < height) {
          ctx.beginPath();
          ctx.moveTo(-width, yPos);
          ctx.lineTo(width, yPos);
          ctx.stroke();
        }
      }

      // Vanishing point perspective rays
      for (let x = -width; x <= width; x += 90) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(x * 2.5, height);
        ctx.stroke();
      }

      // Pitch Ladder (+10, 0, -10)
      ctx.strokeStyle = hudColor;
      ctx.fillStyle = hudColor;
      ctx.lineWidth = 1.5;
      ctx.font = '10px "JetBrains Mono", monospace';

      [-20, -10, 0, 10, 20].forEach(deg => {
        const ladderY = -deg * 5;
        const barWidth = deg === 0 ? 120 : 60;
        ctx.beginPath();
        ctx.moveTo(-barWidth / 2, ladderY);
        ctx.lineTo(barWidth / 2, ladderY);
        ctx.stroke();
        if (deg !== 0) {
          ctx.fillText(`${deg > 0 ? '+' : ''}${deg}`, barWidth / 2 + 6, ladderY + 3);
        }
      });

      ctx.restore();

      // 2. HUD Reticle & Crosshair (Center)
      const cx = width / 2;
      const cy = height / 2;
      ctx.strokeStyle = hudColor;
      ctx.lineWidth = 1.5;

      // Outer targeting brackets
      const bSize = 30;
      ctx.beginPath();
      // Top-left
      ctx.moveTo(cx - bSize, cy - bSize + 10);
      ctx.lineTo(cx - bSize, cy - bSize);
      ctx.lineTo(cx - bSize + 10, cy - bSize);
      // Top-right
      ctx.moveTo(cx + bSize - 10, cy - bSize);
      ctx.lineTo(cx + bSize, cy - bSize);
      ctx.lineTo(cx + bSize, cy - bSize + 10);
      // Bottom-left
      ctx.moveTo(cx - bSize, cy + bSize - 10);
      ctx.lineTo(cx - bSize, cy + bSize);
      ctx.lineTo(cx - bSize + 10, cy + bSize);
      // Bottom-right
      ctx.moveTo(cx + bSize - 10, cy + bSize);
      ctx.lineTo(cx + bSize, cy + bSize);
      ctx.lineTo(cx + bSize, cy + bSize - 10);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = hudColor;
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();

      // 3. Compass Heading Tape (Top HUD)
      const tapeY = 30;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 180, tapeY);
      ctx.lineTo(cx + 180, tapeY);
      ctx.stroke();

      // Marker notch
      ctx.fillStyle = hudColor;
      ctx.beginPath();
      ctx.moveTo(cx, tapeY);
      ctx.lineTo(cx - 5, tapeY - 8);
      ctx.lineTo(cx + 5, tapeY - 8);
      ctx.closePath();
      ctx.fill();

      // Degree labels
      const heading = pose.heading;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';

      for (let deg = -60; deg <= 60; deg += 15) {
        const markHeading = ((Math.round(heading) + deg + 360) % 360);
        const xPos = cx + (deg * 3);
        ctx.strokeStyle = hudColor;
        ctx.beginPath();
        ctx.moveTo(xPos, tapeY);
        ctx.lineTo(xPos, tapeY + (deg % 30 === 0 ? 8 : 4));
        ctx.stroke();

        if (deg % 30 === 0) {
          let card = `${markHeading}°`;
          if (markHeading === 0) card = 'N';
          if (markHeading === 90) card = 'E';
          if (markHeading === 180) card = 'S';
          if (markHeading === 270) card = 'W';
          ctx.fillStyle = hudColor;
          ctx.fillText(card, xPos, tapeY + 20);
        }
      }

      // 4. BiSeNetV2 / TensorRT AI Vision Detections (Overlay Bounding Boxes)
      const closestObstacle = [...obstacles].sort((a, b) => a.distance - b.distance)[0];
      if (closestObstacle && closestObstacle.distance < 45) {
        // Project obstacle box into camera FOV
        const distRatio = Math.max(0.2, 1.0 - closestObstacle.distance / 50);
        const boxW = 120 * distRatio;
        const boxH = 80 * distRatio;
        const targetX = cx + (closestObstacle.y * 3.5) - boxW / 2;
        const targetY = cy + 40 - (boxH / 2);

        ctx.strokeStyle = closestObstacle.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(targetX, targetY, boxW, boxH);

        // Target Tag
        ctx.fillStyle = closestObstacle.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.85)' : 'rgba(245, 158, 11, 0.85)';
        ctx.fillRect(targetX, targetY - 18, boxW, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${closestObstacle.type} ${closestObstacle.distance}m [${closestObstacle.confidence}]`, targetX + 4, targetY - 5);
      }

      // Traversable Corridor ROI (Green ground zone)
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.beginPath();
      ctx.moveTo(cx - 80, height);
      ctx.lineTo(cx - 30, cy + 30);
      ctx.lineTo(cx + 30, cy + 30);
      ctx.lineTo(cx + 80, height);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 5. Camera Lens Obscuration Filter (Mud / Dust Splatter)
      if (failsafe.cameraLensObscuration > 0.08) {
        const obscuration = failsafe.cameraLensObscuration;
        ctx.fillStyle = `rgba(120, 80, 40, ${Math.min(0.85, obscuration * 0.9)})`;
        ctx.fillRect(0, 0, width, height);

        // Dirt speckles
        ctx.fillStyle = 'rgba(50, 30, 10, 0.7)';
        for (let i = 0; i < Math.floor(obscuration * 80); i++) {
          const sx = (Math.sin(i * 997) * 0.5 + 0.5) * width;
          const sy = (Math.cos(i * 443) * 0.5 + 0.5) * height;
          const sr = 3 + (i % 8);
          ctx.beginPath();
          ctx.arc(sx, sy, sr, 0, Math.PI * 2);
          ctx.fill();
        }

        // Warning banner
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.fillRect(cx - 160, cy - 60, 320, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`! LENS OBSCURATION: ${(obscuration * 100).toFixed(0)}% (VISION DEGRADED)`, cx, cy - 42);
      }

      // 6. Air-Purge Active Blast FX
      if (failsafe.airPurgeFiring) {
        ctx.fillStyle = 'rgba(220, 245, 255, 0.7)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('>> AIR-PURGE HIGH PRESSURE CO2 DISCHARGE ACTIVE <<', cx, cy);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [pose, failsafe, obstacles, visionMode]);

  return (
    <div className="relative w-full h-full flex flex-col bg-tactical-950 overflow-hidden select-none">
      {/* Top Vision Mode Toolbar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-1.5 pointer-events-auto bg-tactical-900/90 backdrop-blur border border-tactical-700/80 p-1 rounded-lg shadow-lg">
          <button
            onClick={() => switchVisionMode('RGB')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-mono text-xs transition-colors ${
              visionMode === 'RGB' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>RGB OPTICAL</span>
          </button>
          <button
            onClick={() => switchVisionMode('THERMAL')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-mono text-xs transition-colors ${
              visionMode === 'THERMAL' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>FLIR THERMAL</span>
          </button>
          <button
            onClick={() => switchVisionMode('NVG')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-mono text-xs transition-colors ${
              visionMode === 'NVG' ? 'bg-green-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>NVG IR</span>
          </button>
        </div>

        {/* Vision Status Badge */}
        <div className="flex items-center gap-2 pointer-events-auto bg-tactical-900/90 backdrop-blur border border-tactical-700/80 px-3 py-1 rounded-lg text-xs font-mono">
          <span className="text-slate-400">TENSORRT INT8:</span>
          <span className="text-emerald-400 font-semibold">28.4 FPS [35.2ms]</span>
        </div>
      </div>

      {/* Main Canvas Feed */}
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Bottom Camera Action Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 pointer-events-auto bg-tactical-900/90 backdrop-blur border border-tactical-700/80 px-3 py-1.5 rounded-lg text-xs font-mono">
          <span className="text-slate-400">PITCH:</span>
          <span className="text-cyan-300 font-semibold">{pose.pitch.toFixed(1)}°</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">ROLL:</span>
          <span className="text-cyan-300 font-semibold">{pose.roll.toFixed(1)}°</span>
        </div>

        {/* Air-Purge Nozzle Button */}
        <div className="pointer-events-auto">
          <button
            onClick={onTriggerAirPurge}
            disabled={failsafe.airPurgeFiring}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all shadow-lg ${
              failsafe.cameraLensObscuration > 0.3
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white glow-cyan animate-pulse'
                : 'bg-tactical-800 hover:bg-tactical-700 text-cyan-300 border border-tactical-600'
            }`}
          >
            <Wind className={`w-4 h-4 ${failsafe.airPurgeFiring ? 'animate-spin' : ''}`} />
            <span>{failsafe.airPurgeFiring ? 'FIRING CO2 NOZZLE...' : 'TRIGGER AIR-PURGE'}</span>
            <span className="px-1.5 py-0.5 rounded bg-tactical-950 text-[10px] text-slate-300">
              {(failsafe.cameraLensObscuration * 100).toFixed(0)}% DUST
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
