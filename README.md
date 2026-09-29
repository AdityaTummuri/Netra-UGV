The **NETRA-UGV** (Networked Tactical Reconnaissance & Autonomous Ground Vehicle) is a sovereign, defence-oriented unmanned vehicle stack designed to operate reliably where consumer autonomy fails:
* **GPS-Denied Operation:** 500 Hz Visual-Inertial Odometry (`OpenVINS` MSCKF) fused with wheel encoders and optical flow without external satellite reliance.
* **Negative Obstacle Mitigation:** Real-time $v$-disparity polar raycasting detecting trenches, ditches, and drop-offs that conventional 2D planar LiDARs miss.
* **Semantic Terrain Classification:** Custom **BiSeNetV2** deep neural network trained on **RELLIS-3D** off-road benchmark, quantized to INT8 TensorRT ($2.6\text{ ms}$ on Jetson Orin Nano, with dual OpenCV DNN/CPU fallback).
* **Cyber-Physical Protection:** FIPS 140-3 hardware zeroization crowbar, S-ROS 2 enclave isolation, and SecOC CAN-FD 64-bit truncated CMAC authentication against bus injection.
* **Tactical Web GCS:** High-performance Ground Control Station with click-and-control waypoints, Forward Camera HUD (FLIR/Night Vision), and dynamic air-purge lens clearing simulation.

🌐 **Live Ground Control Station:** **[https://netraugv.vercel.app](https://netraugv.vercel.app)**

---

## 🏗️ System Architecture & Block Diagram

![NETRA-UGV System Architecture](./docs/diagrams/Netra-UGV-block_diagram.png)

📄 **[Download High-Resolution System Architecture (PDF)](./docs/architecture_diagram.pdf)**

---

## ⚡ Quickstart Guide for Evaluators & Reviewers

### 1. 🎛️ Live Web Dashboard (Ground Control Station)
* 🌐 **Production Deployment**: **[https://netraugv.vercel.app](https://netraugv.vercel.app)**
* The interactive GCS includes real-time telemetry, 2D tactical waypoint planning, AI target HUD, sensor view-switching, and multi-scenario autonomous simulation.

Or run locally:
```bash
# Navigate to the dashboard directory
cd dashboard

# Install dependencies and launch
pnpm install
pnpm dev
```
