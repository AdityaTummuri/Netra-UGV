# 🛡️ NETRA-UGV
### *Next-generation Edge-Tactical Robust Autonomy for Unmanned Ground Vehicles*

> **"NETRA" (नेत्र)** — Sanskrit for *Eyes*. A fully passive, zero-emission vision navigation brain for tactical UGVs.

[![SIH 2025 — PS 26126](https://img.shields.io/badge/SIH%202025-PS%2026126-0D47A1?style=for-the-badge)](https://sih.gov.in)
[![BEL — Ministry of Defence](https://img.shields.io/badge/BEL%20%7C%20Ministry%20of%20Defence-Navratna%20PSU-B71C1C?style=for-the-badge)](https://bel-india.in)
[![ROS 2 Humble](https://img.shields.io/badge/ROS%202-Humble-22314E?style=for-the-badge&logo=ros)](https://docs.ros.org/en/humble/)
[![Jetson Orin Nano](https://img.shields.io/badge/NVIDIA-Jetson%20Orin%20Nano-76B900?style=for-the-badge&logo=nvidia)](https://developer.nvidia.com/embedded/jetson-orin)
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
| **Category / Theme** | Software / Smart Automation |

---

## 🎯 The Operational Crisis NETRA-UGV Solves

BEL's tactical UGVs operate in **four hostile conditions** that break every conventional autonomous navigation system:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PROBLEM 1: GNSS BLACKOUT         │  PROBLEM 2: LIDAR VULNERABILITY    │
│  Enemy EW systems (Krasukha-class │  Active LiDAR pulses detectable by  │
│  jammers) eliminate all GPS/NavIC │  enemy NVDs & LWRs. Draws 25–40W.  │
│  signals in < 2 seconds.          │  Fails in rain, dust, smoke.        │
├───────────────────────────────────┼─────────────────────────────────────┤
│  PROBLEM 3: NEGATIVE OBSTACLES    │  PROBLEM 4: ILLUMINATION SHOCKS    │
│  YOLO/bounding-box detectors are  │  Forest canopy → open desert sun:   │
│  BLIND to trenches, ditches &     │  standard feature matchers lose     │
│  craters. Vehicle drives off      │  >60% of tracked points in a single │
│  edge — catastrophic rollover.    │  frame. Navigation failure.         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Why existing solutions ALL fail:**

| System | Used By | Fatal Failure Mode |
| :--- | :--- | :--- |
| RTK-GPS + Wheel Odometry | Most commercial UGVs | Trivially jammed by $<₹50,000$ portable jammer |
| LiDAR SLAM (Velodyne) | Boston Dynamics, research platforms | Emits detectable 905nm pulse; $>$25W drain; fails in countermeasure smoke |
| Standard YOLO + OpenCV | Majority of SIH submissions | Blind to negative obstacles. Vehicle will drive into unmarked ditches. |
| Binary Occupancy Grid | Generic Nav2 setup | Tall grass = rigid wall. $>$70% false-positive stops in vegetated terrain. |

---

## 💡 The NETRA-UGV Solution — 4 Breakthrough Innovations

### Innovation 1: Cascaded Knowledge Distillation Traversability Engine

```
  DINOv2-Large (Teacher, 300M)  ──offline training──►  BiSeNetV2-Lite (Student, 3.4M)
  Semantic Feature Extraction                          TensorRT INT8 on Jetson
  Over RELLIS-3D + RUGD Data                          > 40 FPS  |  < 4W GPU draw
                              ▼
         4-Class Tactical Terrain Classification
         ┌──────────────────────────────────────────────────────┐
         │  🟢 Solid Ground      → cost 0.0  (full speed)      │
         │  🟡 Pliant Vegetation → cost 0.15 (slow, safe)      │
         │  🔴 Rigid Obstacle    → cost ∞    (hard stop)       │
         │  🟣 Negative Hazard   → cost ∞    (trench/crater)   │
         └──────────────────────────────────────────────────────┘
```

### Innovation 2: Stereo Raycasting — Negative Obstacle Detection

No LiDAR. No radar. Using only the stereo disparity map:
1. RANSAC fits a ground plane $\Pi$ to all stereo points at $Z \in [0.3\text{m}, 6\text{m}]$
2. Scanline raycaster checks expected vs. actual surface return per column
3. **Condition:** $\Delta Z > 25\text{cm}$ across $\geq 3$ consecutive scanlines → infinite-cost barrier cell fires
4. Detection range: **5.5m at 1.5 m/s vehicle speed** → $>$3 seconds braking margin

### Innovation 3: Illumination-Invariant Visual-Inertial Odometry

```
  Stereo Cameras (30Hz)   →  CLAHE (per-frame, <1ms GPU)
       +                  →  FAST Corners + LightGlue Matcher
  IMU (500Hz)             →  OpenVINS EKF-MSCKF Factor Graph
                                    │
                                    ▼
                          6-DoF Pose @ 50Hz
                     Drift < 1.2% over 500m
                    (No GPS. No NavIC. No GLONASS.)
```

### Innovation 4: 2.5D Risk-Weighted Kinodynamic Planning

```
  C(x,y) = w₁·Slope + w₂·Roughness + w₃·SemanticClass + w₄·NegativeHazard
                  │
                  ▼
         TEB Local Planner (kinodynamic, skid-steer model)
         - Vehicle tip-over guard: pitch > 22°, roll > 18° → reject trajectory
         - Adaptive speed limit: v_max = f(slope, terrain roughness)
         - Collision-free replanning in < 45ms
                  │
                  ▼
         geometry_msgs/Twist → CAN Bus → Motor PWM
```

---

## 📊 System Architecture

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     FULL PIPELINE (per-frame, < 32ms total)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[SENSOR INPUT]
  Stereo Camera (MIPI-CSI2) + IMU (SPI @ 500Hz) + Wheel Encoders (CAN)

      │
      ▼
[PREPROCESSING — Tier 1]
  CLAHE Equalization + Stereo Rectification + SGM Disparity (CUDA)

      │                                    │
      ▼                                    ▼
[PERCEPTION — Tier 2A]            [LOCALIZATION — Tier 2B]
  BiSeNetV2 TRT INT8               OpenVINS EKF-MSCKF
  4-Class Semantic Mask             FAST + LightGlue Tracking
  + Negative Obstacle Raycast       6-DoF Pose @ 50Hz

      │                                    │
      └─────────────────┬──────────────────┘
                        ▼
           [MAPPING — Tier 3]
             2.5D Risk-Traversability Elevation Costmap
             C(x,y) = wSlope + wRoughness + wSemantic + wNegative

                        │
                        ▼
         [PLANNING & CONTROL — Tier 4]
           TEB Local Planner (Kinodynamic)
           → Skid-Steer Trajectory Spline
           → Roll/Pitch Safety Guard

                        │
                        ▼
           CAN Bus → ODrive/VESC → Motor PWM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📈 Quantified KPI Benchmarks

| Metric | Our Target | BEL Requirement | Method |
| :--- | :---: | :---: | :--- |
| **Localization Drift (GPS-Denied)** | **< 1.2%** / 500m | < 1.2% | ATE vs. simulated RTK GT on Gazebo course |
| **End-to-End Latency** | **< 32 ms** | < 35 ms | ROS 2 timestamp: camera → `cmd_vel` |
| **Edge Power Budget** | **< 13.5 W** | < 15 W | `tegrastats` full pipeline, Jetson Orin Nano |
| **Hazard Reaction Time** | **< 45 ms** | < 50 ms | Pop-up obstacle → new trajectory pub |
| **False Positive Stops (Tall Grass)** | **< 12%** | — | 50 traversal trials of 0.6m grass patch |
| **Negative Obstacle Detection Range** | **5.5 m** | — | 20 trials, 0.5m wide ditch, 1.5 m/s |
| **Traversability mIoU** | **> 62%** | — | RELLIS-3D held-out test split |

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| Robotics Middleware | ROS 2 Humble · CycloneDDS (local) · Micro-ROS |
| Computer Vision / AI | PyTorch (training) · TensorRT INT8 · ONNX Runtime · OpenCV CUDA |
| Traversability Model | BiSeNetV2-Lite (student) + DINOv2 (teacher, offline) — RELLIS-3D + RUGD |
| Visual Odometry | OpenVINS EKF-MSCKF + LightGlue + FAST corners |
| Motion Planning | Nav2 Costmap2D (2.5D) + TEB Local Planner |
| Simulation | Gazebo Garden · RViz2 · rclpy |
| Target Hardware | NVIDIA Jetson Orin Nano 8GB (JetPack 6.x) |
| Cameras | e-CAM Global Shutter Stereo (IMX296) / Intel RealSense D435i |
| IMU | TDK ICM-42688-P @ 500 Hz |
| Actuation | SocketCAN → ODrive v3.6 / VESC 6 → Motor PWM |

---

## 📂 Repository Structure

```
SIH-2/
├── README.md                         # This file — project overview & architecture
├── RESEARCH_FEED.md                  # SIH qualification feeder & rubric (updated with PS data)
├── RESEARCH_FEEDER_BEL_UGV.md        # Complete deep research, competitive analysis & pitch blueprint
│
├── docs/                             # [TO BE POPULATED]
│   ├── architecture_diagram.pdf      # High-resolution system architecture diagram
│   ├── slide_deck.pptx               # Official SIH 5+1 slide submission
│   └── one_pager.pdf                 # One-page project poster for jury
│
├── src/                              # [TO BE POPULATED] ROS 2 Humble packages
│   ├── netra_perception/             # BiSeNetV2 TRT inference + CLAHE pre-processing node
│   ├── netra_localization/           # OpenVINS VIO node + LightGlue feature matching
│   ├── netra_mapping/                # 2.5D elevation costmap + negative obstacle raycaster
│   └── netra_planning/               # TEB local planner + kinodynamic constraints
│
├── weights/                          # [TO BE POPULATED]
│   ├── bisenetv2_rellis_int8.trt     # TensorRT INT8 engine for Jetson
│   └── bisenetv2_rellis.onnx        # ONNX export for cross-platform inference
│
└── sim/                              # [TO BE POPULATED]
    ├── worlds/tactical_obstacle.world # Gazebo Garden tactical course
    ├── models/ugv_skidsteer.urdf      # UGV robot model
    └── launch/full_demo.launch.py     # Full pipeline launch file
```

---

## 📚 Key References & Research Basis

1. Jiang, P. et al., *"RELLIS-3D Dataset"*, ICRA 2021 — Primary training dataset
2. Wang, W. et al., *"TartanAir"*, IROS 2020 — Adverse-weather SLAM benchmark
3. Geneva, P. et al., *"OpenVINS"*, ICRA 2020 — Core VIO architecture
4. Leroy, V. et al., *"MASt3R"*, ECCV 2024 — State-of-art visual localization
5. Schmid, L. et al., *"STEPP"*, ICRA 2025 — DINOv2 traversability distillation
6. Yu, C. et al., *"BiSeNet V2"*, IJCV 2021 — Real-time segmentation backbone
7. Teed, Z. et al., *"DPVO"*, NeurIPS 2023 — Efficient deep visual odometry
8. BEL Unmanned Systems Division Brochure, 2024–2025

---

> **For the complete technical research, competitive analysis, mathematical formulations, and the verbatim 5-slide SIH submission blueprint, see:**
> ### 👉 [RESEARCH_FEEDER_BEL_UGV.md](./RESEARCH_FEEDER_BEL_UGV.md)
