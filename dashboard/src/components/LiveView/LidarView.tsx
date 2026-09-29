import React, { useRef, useEffect } from 'react';
import { Radio } from 'lucide-react';
import type { UGVPose, PerceptionObstacle } from '../../types/telemetry';

interface LidarViewProps {
  pose: UGVPose;
  obstacles: PerceptionObstacle[];
}

export const LidarView: React.FC<LidarViewProps> = ({ pose, obstacles }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

      // Background
      ctx.fillStyle = '#060a10';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.min(cx, cy) - 25;

      // Concentric Range Rings (10m, 25m, 40m)
      [10, 25, 40].forEach((rangeMeters) => {
        const r = (rangeMeters / 50) * maxR;
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(`${rangeMeters}m`, cx + r - 20, cy - 4);
      });

      // Crosshairs
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - maxR, cy);
      ctx.lineTo(cx + maxR, cy);
      ctx.moveTo(cx, cy - maxR);
      ctx.lineTo(cx, cy + maxR);
      ctx.stroke();

      // Rotating Radar Sweep Line
      const sweepAngle = (Date.now() / 600) % (Math.PI * 2);
      const sweepGrad = ctx.createConicGradient(sweepAngle, cx, cy);
      sweepGrad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
      sweepGrad.addColorStop(0.12, 'rgba(16, 185, 129, 0.02)');
      sweepGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fill();

      // Sweep frontier line
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * maxR, cy + Math.sin(sweepAngle) * maxR);
      ctx.stroke();

      // Simulated Point Cloud Scatter Returns
      ctx.fillStyle = '#10b981';
      for (let i = 0; i < 90; i++) {
        const a = (i * 4 * Math.PI) / 180;
        const dist = 12 + Math.sin(i * 13) * 6 + (Math.cos(i * 7) * 4);
        const r = (dist / 50) * maxR;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;

        ctx.fillRect(px, py, 2, 2);
      }

      // Draw Obstacle Points
      obstacles.forEach(obs => {
        const angleRad = Math.atan2(obs.y - pose.y, obs.x - pose.x);
        const r = Math.min(maxR, (obs.distance / 50) * maxR);
        const ox = cx + Math.cos(angleRad) * r;
        const oy = cy + Math.sin(angleRad) * r;

        if (obs.type === 'NEGATIVE_VOID' || obs.type === 'TRENCH') {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(ox, oy, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(ox - 3, oy - 3, 6, 6);
        }
      });

      // UGV Center Symbol
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [pose, obstacles]);

  return (
    <div className="relative w-full h-full flex flex-col bg-tactical-950 overflow-hidden select-none">
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-tactical-900/90 backdrop-blur border border-tactical-700/80 px-3 py-1.5 rounded-lg shadow-lg">
        <Radio className="w-4 h-4 text-emerald-400 animate-spin" />
        <span className="text-xs font-mono font-bold text-slate-200">360° LIDAR & NEGATIVE VOID RAYCASTER</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
