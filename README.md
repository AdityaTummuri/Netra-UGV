# 🛡️ NETRA-UGV
### *Next-generation Edge-Tactical Robust Autonomy for Unmanned Ground Vehicles*

> **"NETRA" (नेत्र)** — Sanskrit for *Eyes*. An edge-native, zero-emission vision navigation brain for tactical UGVs.

[![SIH 2025 — PS 26126](https://img.shields.io/badge/SIH%202025-PS%2026126-0D47A1?style=for-the-badge)](https://sih.gov.in)
[![BEL — Ministry of Defence](https://img.shields.io/badge/BEL%20%7C%20Ministry%20of%20Defence-Navratna%20PSU-B71C1C?style=for-the-badge)](https://bel-india.in)
[![ROS 2 Humble](https://img.shields.io/badge/ROS%202-Humble-22314E?style=for-the-badge&logo=ros)](https://docs.ros.org/en/humble/)
[![Jetson Orin Nano / Hailo-8](https://img.shields.io/badge/Compute-Orin%20Nano%20%7C%20Hailo--8-76B900?style=for-the-badge&logo=nvidia)](https://developer.nvidia.com/embedded/jetson-orin)
[![Category: Software](https://img.shields.io/badge/Category-Software-2E7D32?style=for-the-badge)]()
[![Theme: Smart Automation](https://img.shields.io/badge/Theme-Smart%20Automation-6A1B9A?style=for-the-badge)]()

---

## 📌 Problem Statement

| Field | Details |
| :--- | :--- |
| **Problem Statement ID** | 26126 |
| **Title** | Vision Based Autonomous Navigation for Unmanned Ground Vehicle for Outdoor Environment |
| **Organization** | Bharat Electronics Limited (BEL) — Navratna Defence PSU |
| **Ministry** | Ministry of Defence, Government of India |
| **Category / Theme** | Software / Smart Automation (Defence Robotics) |

---

## 🎯 The Operational Crisis NETRA-UGV Solves

BEL's tactical UGVs operate in **four hostile battlefield conditions** that break conventional navigation systems:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PROBLEM 1: GNSS BLACKOUT         │  PROBLEM 2: LIDAR VULNERABILITY     │
│  Enemy EW systems (Krasukha-class │  Active LiDAR pulses detectable by  │
│  jammers) eliminate all GPS/NavIC │  enemy NVDs & LWRs. Draws 25–40W.   │
│  signals in < 2 seconds.          │  Blinded by dust and smoke screens. │
├───────────────────────────────────┼─────────────────────────────────────┤
│  PROBLEM 3: NEGATIVE OBSTACLES    │  PROBLEM 4: ILLUMINATION & BRUSH    │
│  2D YOLO/bounding-box AI is BLIND │  Canopy-to-sunlight transitions     │
│  to trenches, ditches & craters.  │  drop >60% of features. Binary      │
│  Rover drives off cliff edge.     │  costmaps halt on 50cm tall grass.  │
└───────────────────────────────────┴─────────────────────────────────────┘
```

---

## 💡 The NETRA-UGV Solution — 4 Technical Innovations

### Innovation 1: Cascaded Knowledge Distillation Traversability Engine
* **Offline Teacher (DINOv2-Large, 300M):** Extracts high-dimensional semantic surface embeddings across RELLIS-3D & RUGD datasets.
* **Online Student (BiSeNetV2-Lite, 3.4M INT8):** Deployed via TensorRT on edge compute, executing in **$4.2\text{ ms}$** at **$> 40\text{ FPS}$** (< 3.5W GPU draw).
* **4-Class Tactical Terrain Taxonomy:** Solid Ground ($C=0.0$), Pliant Vegetation ($C=0.35$ with automatic speed governing), Mud/Marsh ($C=0.75$), and Rigid Obstacles ($C=\infty$).

### Innovation 2: Disparity Void & Shadow Negative Obstacle Raycaster
* **Geometric Void Detection:** Fits a tangent ground plane via RANSAC and detects missing disparity returns / shadow voids caused by ditch front rims.
* **Step-Drop Verification:** Triggers an emergency virtual barrier when $\Delta Z = Z_{\text{actual}} - Z_{\text{expected}} > 25\text{ cm}$.
* **Defensible Detection Range:** Reliable detection at **$2.8\text{--}3.2\text{ m}$** forward range, providing **$> 2.3\text{ seconds}$** braking and evasion window at tactical patrol speeds.

### Innovation 3: Dual-Rate Asynchronous Visual-Inertial Odometry
* **High-Frequency Control Loop (30–50 Hz, 3.8 ms CPU):** FAST corner detection + Kanade-Lucas-Tomasi (KLT) sparse optical flow running via OpenCV ARM NEON SIMD optimizations, updating OpenVINS EKF-MSCKF fused with $500\text{ Hz}$ IMU pre-integration.
* **Low-Frequency Relocalization Thread (1–2 Hz Async):** LightGlue sparse transformer matcher matches keyframes in the background to eliminate cumulative drift.
* **Covert Night Vision:** Dual-mode passive NIR + covert 940nm VCSEL structured IR enables uninterrupted tracking in 0-lux darkness without visible light signature.
* **Drift Metric:** Benchmarked at **$< 1.2\%$ drift** over $500\text{ m}$ under total GPS blackout.

### Innovation 4: 2.5D Risk-Traversability Kinodynamic Planning
* Multi-factor cost: $C(x,y) = w_1\text{Slope} + w_2\text{Roughness} + w_3\text{Semantic} + w_4\text{Void}$.
* Non-holonomic skid-steer trajectory optimization via TEB Local Planner.
* Integrated vehicle tip-over guard (rejects paths with pitch $> 22^\circ$ or roll $> 18^\circ$) and suspension shock monitoring in tall grass.

---

## ⚡ Split-Compute Hardware Strategy & Trade-Off Spectrum

To avoid GPU bottlenecks and deliver a cost-effective, defensible system, NETRA offloads dense stereo disparity to an onboard hardware vision processor:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        HARDWARE DEPLOYMENT TRADE-OFF SPECTRUM                          │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ Specification            │ Tier 1: Tactical Primary    │ Tier 2: Ultra-Low-Cost Swarm  │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Target Compute           │ NVIDIA Jetson Orin Nano 8GB │ Raspberry Pi 5 + Hailo-8 NPU  │
│ AI Inference Engine      │ TensorRT INT8 (40 TOPS)     │ HailoRT INT8 (26 TOPS)        │
│ Stereo Depth Engine      │ Luxonis OAK-D Pro (ASIC)    │ Luxonis OAK-D Lite (ASIC)     │
│ Night / Zero-Lux Vision  │ Covert 940nm VCSEL IR       │ Low-light NIR                 │
│ IMU                      │ ICM-42688-P (500 Hz SPI)    │ BMI088 (400 Hz SPI)           │
│ Motor Interface          │ SocketCAN (ODrive/VESC)     │ Isolated CAN Hat (MCP2515)    │
│ Total System Power       │ < 13.5 W                    │ < 9.2 W                       │
│ Total System Cost        │ ₹70,500 (~$848)             │ ₹30,000 (~$360)               │
│ Primary Application      │ High-Value Patrol / Recon   │ Expendable Scout / Swarm UGV  │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

### Deterministic Latency Budget Breakdown
$$\text{Sensor DMA} \xrightarrow{3.5\text{ ms}} \begin{pmatrix}\text{BiSeNetV2: } 4.2\text{ ms}\\\text{VIO State: } 3.8\text{ ms}\end{pmatrix} \xrightarrow{3.0\text{ ms}} \text{Costmap} \xrightarrow{7.5\text{ ms}} \text{TEB Spline} \xrightarrow{1.0\text{ ms}} \text{CAN Bus}$$

* **Total Closed-Loop Latency:** **$22.0\text{ ms} \text{ (Nominal)} \text{ to } 26.5\text{ ms} \text{ (Peak)}$**
* **Control Rate:** **$\ge 40\text{ Hz}$** closed-loop perception to motor actuation.

---

## 📈 Quantified KPI Benchmarks

| Metric | Our Target | BEL Requirement | Validation Method |
| :--- | :---: | :---: | :--- |
| **Localization Drift (GPS-Denied)** | **< 1.2%** / 500m | < 2.0% | ATE vs. simulated RTK-GPS ground truth in Gazebo |
| **End-to-End Latency** | **22.0 – 26.5 ms** | < 35 ms | ROS 2 timestamp delta: image capture $\to$ `cmd_vel` |
| **Edge Power Budget** | **< 13.5 W (Tier 1) / < 9.2 W (Tier 2)** | < 15 W | Continuous `tegrastats` logging on edge compute |
| **Hazard Reaction Time** | **< 40 ms** | < 50 ms | Dynamic obstacle trigger to new evasive spline publish |
| **False Positive Stops (Tall Grass)** | **< 12%** | — | 50 automated traversals through 0.6m grass patch |
| **Negative Obstacle Detection Range** | **2.8 – 3.2 m** | — | 20 approach trials towards 0.5m ditch at 1.2 m/s |
| **Traversability mIoU** | **> 62.4%** | — | RELLIS-3D held-out test split |

---

## 📂 Repository Structure & Project Documentation

All complete engineering reports, slide decks, and research feeders have been consolidated into [`docs/`](./docs/):

```
SIH-2/
├── README.md                         # This file — project overview & architecture
├── docs/                             # Complete project technical documentation
│   ├── MASTER_PROJECT_REPORT.md      # Comprehensive technical master report
│   ├── PPT_SLIDES_DECK.md            # Official 5-slide SIH submission deck & speaker notes
│   ├── RESEARCH_FEEDER_BEL_UGV.md    # Deep domain research, competitive analysis & math
│   └── architecture_diagram.pdf      # High-resolution system architecture diagram
├── src/                              # ROS 2 Humble packages
│   ├── netra_perception/             # BiSeNetV2 TensorRT inference + CLAHE preprocessor
│   ├── netra_localization/           # OpenVINS EKF-MSCKF + LightGlue feature matcher
│   ├── netra_mapping/                # 2.5D risk costmap + RANSAC negative obstacle raycaster
│   └── netra_planning/               # Kinodynamic TEB local planner + tip-over safety guards
├── weights/                          # TensorRT INT8 engines & ONNX models
└── sim/                              # Gazebo Garden tactical world & UGV URDF models
```

### 📖 Direct Links to Documentation
* 👉 **[Comprehensive Technical Master Report](./docs/MASTER_PROJECT_REPORT.md)** — In-depth technical synthesis, math formulations, hardware analysis, and compliance.
* 👉 **[Official 5-Slide Presentation Deck & Notes](./docs/PPT_SLIDES_DECK.md)** — Verbatim slide copy, visual layouts, and 30-to-60 second presenter speaking scripts.
* 👉 **[Research Feeder & Domain Analysis](./docs/RESEARCH_FEEDER_BEL_UGV.md)** — Battlefield failure modes, academic landscape, datasets, and rubric alignment.
