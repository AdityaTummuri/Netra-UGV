# NETRA UGV Tactical Mission & Ground Control Station (GCS)

A military-grade Ground Control Station web dashboard for the **NETRA UGV** (Unmanned Ground Vehicle).

🌐 **Live Deployment**: **[https://netraugv.vercel.app](https://netraugv.vercel.app)**

---

## ⚡ Features

1. **Central Live View Dashboard**:
   - **Tactical 2D Map & Waypoint Planner**:
     - Real-time kinematic tracking of the UGV, bearing cone, heading vector, and breadcrumb trajectory.
     - **Interactive Click-and-Control Waypoints**: Click anywhere on the tactical map grid to immediately drop waypoints (`WP-01`, `WP-02`...), drag or select waypoints, and execute autonomous missions.
     - Visual kinodynamic TEB planned path lines and obstacle clearance zones.
   - **Forward Sensor / Optical HUD**:
     - 3D perspective artificial horizon ladder, roll indicator, top compass heading tape.
     - Real-time BiSeNetV2 / TensorRT AI target detection boxes (`BUNKER`, `NEGATIVE VOID`, `PERSONNEL`).
     - Vision modes: **RGB Optical**, **FLIR Thermal IR**, and **NVG Night Vision**.
     - Dynamic lens mud/dust obscuration simulator with an interactive **Air-Purge High-Pressure CO₂ Nozzle** trigger.
   - **360° LiDAR & Risk Costmap Scanner**:
     - Real-time polar raycaster displaying negative obstacle voids and point cloud returns.
   - **Picture-in-Picture (PIP) & Split Screen**:
     - Seamless PIP switching and one-click view swapping between the Tactical Map and Forward Camera.

2. **Control Panel**:
   - **Drive Controls & Teleoperation**:
     - Virtual touch/mouse flightstick joystick with normalized deflection vectors.
     - Keyboard teleop support (`W`/`A`/`S`/`D` or arrow keys, `Space` for brake).
     - Drive Modes: `MANUAL TELEOP`, `AUTO WAYPOINT`, `RETURN TO BASE (RTL)`, `LIMP-TO-HALT`.
     - Real-time **SecOC CAN-FD Authenticated Frame** monitor displaying anti-replay freshness counter and 64-bit truncated AES-128 CMAC.
   - **Failsafe & Threat Hierarchy**:
     - Multi-level failsafe selector: `Nominal (L0)`, `Vision Degraded (L1)`, `Vision Critical (L2)`, `Security Tamper (L3)`.
     - FIPS 140-3 Hardware Zeroization Crowbar trigger with safety flip guard.
   - **Vital Telemetry & Diagnostics**:
     - LiFePO4 battery pack SOC %, voltage, and dynamic current draw.
     - 6-DoF Attitude (Pitch, Roll, Yaw) and TEB tip-over safety risk gauge.
     - Live S-ROS2 Security & System Event Audit stream.

3. **Interactive Demo Mode**:
   - Built-in autonomous physics and sensor simulation engine running at 20 Hz.
   - Preloaded Demo Scenarios:
     - **Scenario 1**: 5-Point Perimeter Border Patrol (`P-1 Outpost` to `Base CP`).
     - **Scenario 2**: Negative Obstacle Void Avoidance (trench detection & reroute).
     - **Scenario 3**: Mud Splatter & Air-Purge Nozzle Blast Sequence.
   - Synthesized Web Audio API sound effects for tactical feedback (blips, chimes, CO₂ blasts, alarms).

---

## 🚀 Quickstart with pnpm

```bash
# Navigate to the dashboard directory
cd dashboard

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

Open your browser at `http://localhost:5173` or access the live deployment at `https://netraugv.vercel.app`.
