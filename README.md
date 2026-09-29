# 🛡️ NETRA-UGV
### *Next-generation Edge-Tactical Robust Autonomy for Unmanned Ground Vehicles*

> **"NETRA" (नेत्र)** — Sanskrit for *Eyes*. A hardware-shielded, encrypted, zero-emission vision navigation brain for tactical military UGVs.

[![SIH 2025 — PS 26126](https://img.shields.io/badge/SIH%202025-PS%2026126-0D47A1?style=for-the-badge)](https://sih.gov.in)
[![BEL — Ministry of Defence](https://img.shields.io/badge/BEL%20%7C%20Ministry%20of%20Defence-Navratna%20PSU-B71C1C?style=for-the-badge)](https://bel-india.in)
[![Security: FIPS 140-3](https://img.shields.io/badge/Security-FIPS%20140--3%20%7C%20LUKS2%20AES--256-darkred?style=for-the-badge)]()
[![Shielding: MIL-STD-461G](https://img.shields.io/badge/Shielding-MIL--STD--461G%20%7C%20810H-green?style=for-the-badge)]()
[![ROS 2 Humble / S-ROS 2](https://img.shields.io/badge/ROS%202-Humble%20%7C%20S--ROS%202-22314E?style=for-the-badge&logo=ros)](https://docs.ros.org/en/humble/)
[![Compute: Orin Nano / Hailo-8](https://img.shields.io/badge/Compute-Orin%20Nano%20%7C%20Hailo--8-76B900?style=for-the-badge&logo=nvidia)](https://developer.nvidia.com/embedded/jetson-orin)

---

## 📌 Problem Statement Details

| Field | Details |
| :--- | :--- |
| **Problem Statement ID** | 26126 |
| **Title** | Vision Based Autonomous Navigation for Unmanned Ground Vehicle for Outdoor Environment |
| **Organization** | Bharat Electronics Limited (BEL) — Navratna Defence PSU |
| **Ministry** | Ministry of Defence, Government of India |
| **Category / Theme** | Software / Smart Automation (Defence Robotics) |

---

## 🔒 Security, Shielding & Cryptographic Architecture (Defence-First)

In a tactical combat environment, autonomy without security is a liability. **NETRA-UGV treats hardware encryption, anti-tamper zeroization, and physical EMI shielding as core architecture:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│              NETRA-UGV DEFENCE SECURITY & SHIELDING PILLARS             │
├──────────────────────────┬────────────────────────┬─────────────────────┤
│ 1. CRYPTOGRAPHIC ROOT    │ 2. PHYSICAL SHIELDING  │ 3. ANTI-TAMPER      │
│ • TPM 2.0 Secure Boot    │ • MIL-STD-461G Billet  │ • Active chassis    │
│ • LUKS2 AES-XTS-256 Full │   6061-T6 Aluminum     │   breach detection  │
│   Disk Encryption        │ • Double-lip silver    │ • Hardware crowbar  │
│ • Encrypted ramdisk for  │   conductive gaskets   │   key zeroization   │
│   AI model weights       │   (>85dB attenuation)  │   in < 85 ms        │
│ • S-ROS 2 (DDS-Security) │ • MIL-STD-810H IP67    │ • Mechanical brake  │
│   AES-GCM-256 Transport  │   fanless conduction   │   lock on capture   │
│ • SecOC CAN-FD anti-     │ • Optical sapphire     │ • Air-gapped: zero  │
│   spoofing (AES-128 CMAC)│   glass + air-purge    │   RF emissions      │
└──────────────────────────┴────────────────────────┴─────────────────────┘
```

---

## 🎯 The Operational Crisis NETRA-UGV Solves

BEL's tactical UGVs operate across hostile border environments (LoC, Eastern Ladakh, Thar Desert) where conventional commercial systems collapse:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FAILURE 1: GNSS BLACKOUT (EW)    │  FAILURE 2: LIDAR SIGNATURE         │
│  Enemy jammers (Krasukha-class)   │  Active 905/1550nm pulses trigger   │
│  kill GPS/NavIC in < 2 seconds.   │  enemy Laser Warning Receivers.     │
│  Classic waypoint rovers freeze.  │  30W drain; blinded in smoke/dust.  │
├───────────────────────────────────┼─────────────────────────────────────┤
│  FAILURE 3: NEGATIVE OBSTACLES    │  FAILURE 4: CYBER & PLATFORM BREACH │
│  2D YOLO/bounding-box AI is BLIND │  Unencrypted ROS 2 and CAN packets  │
│  to trenches, ditches & craters.  │  allow command injection; captured  │
│  Rover drives off cliff edge.     │  units leak proprietary IP & logs.  │
└───────────────────────────────────┴─────────────────────────────────────┘
```

---

## 💡 Robust, Non-Experimental Algorithmic Architecture

NETRA-UGV excludes fragile research gimmicks in favor of **proven, deterministic, low-latency algorithms**:

1. **Horizon-Aware Ground ROI Semantic Engine:**
   * Dynamic horizon cropping via IMU pitch cuts TensorRT INT8 inference of **BiSeNetV2-Lite** ($3.4\text{M}$ params) to **$2.6\text{ ms}$** on the Jetson Orin Nano.
   * Four functional classes: Solid Ground ($C=0.0$), Pliant Brush ($C=0.35$ with automatic velocity governor $v \le 0.5\text{ m/s}$ and suspension shock monitoring), Mud ($C=0.75$), and Rigid Obstacle ($C=\infty$).
2. **$v$-Disparity Negative Obstacle Raycaster:**
   * Direct line-fitting in disparity space detects ditches and craters in **$< 0.6\text{ ms}$** without heavy 3D RANSAC point cloud jitter.
   * **Bayesian Anti-Jitter Filter:** Requires $\ge 3$ consecutive frames to commit a ditch barrier, eliminating gravel chatter while maintaining a reliable **$2.8\text{--}3.2\text{ m}$ detection range** ($> 2.3\text{ seconds}$ stopping margin at patrol speed).
3. **Deterministic OpenVINS Visual-Inertial Odometry:**
   * Proven **FAST corner detection + KLT sparse optical flow** on CPU ARM NEON ($3.8\text{ ms}$) fused with $500\text{ Hz}$ IMU pre-integration.
   * Long-term drift bounded by an asynchronous $1\text{ Hz}$ keyframe relocalization thread: **$< 1.2\%$ drift over $500\text{ m}$** in continuous GPS blackout.
4. **2.5D Risk-Traversability Kinodynamic Planning:**
   * Nav2 TEB Local Planner enforcing non-holonomic skid-steer dynamics and rollover guards (rejects trajectories with pitch $> 22^\circ$ or roll $> 18^\circ$).

---

## ⚡ Split-Compute Hardware Strategy & Trade-Off Spectrum

Dense stereo disparity is offloaded to an onboard hardware vision processor (ASIC), achieving **$0\text{ ms}$ host GPU load** and freeing 100% of GPU compute for neural inference:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        HARDWARE DEPLOYMENT TRADE-OFF SPECTRUM                          │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ Specification            │ Tier 1: Tactical Primary    │ Tier 2: Ultra-Low-Cost Swarm  │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Target Compute           │ NVIDIA Jetson Orin Nano 8GB │ Raspberry Pi 5 + Hailo-8 NPU  │
│ AI Inference Engine      │ TensorRT INT8 (40 TOPS)     │ HailoRT INT8 (26 TOPS)        │
│ Stereo Depth Engine      │ Luxonis OAK-D Pro (ASIC)    │ Luxonis OAK-D Lite (ASIC)     │
│ Night / Zero-Lux Vision  │ Covert 940nm VCSEL IR       │ High-Sensitivity NIR          │
│ IMU                      │ ICM-42688-P (500 Hz SPI)    │ BMI088 (400 Hz SPI)           │
│ Shielding Standards      │ MIL-STD-461G / MIL-STD-810H │ Commercial IP65 Enclosure     │
│ Bus Interface            │ SecOC CAN-FD (Isolated)     │ Isolated CAN Hat (MCP2515)    │
│ Total System Power       │ < 13.5 W                    │ < 9.2 W                       │
│ Total Hardware BOM Cost  │ ₹70,500 (~$848)             │ ₹30,000 (~$360)               │
│ Primary Application      │ High-Value Patrol / Recon   │ Expendable Scout / Swarm UGV  │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

### Deterministic Latency Budget (RT-PREEMPT Kernel)
$$\text{Sensor DMA} \xrightarrow{3.5\text{ ms}} \begin{pmatrix}\text{BiSeNetV2: } 2.6\text{ ms}\\\text{VIO State: } 3.8\text{ ms}\end{pmatrix} \xrightarrow{2.0\text{ ms}} \text{Costmap} \xrightarrow{7.5\text{ ms}} \text{TEB Spline} \xrightarrow{1.0\text{ ms}} \text{CAN SecOC}$$

* **Nominal Closed-Loop Latency:** **$18.5\text{ ms}$** | **Peak:** **$22.0\text{ ms}$**
* **Guaranteed Deterministic Rate:** **$\ge 45\text{ Hz}$** closed-loop perception to motor actuation.

---

## 📈 Quantified Defence Key Performance Indicators (KPIs)

| Metric | Our Target | BEL Requirement | Validation Method |
| :--- | :---: | :---: | :--- |
| **Localization Drift (GPS-Denied)** | **< 1.2%** / 500m | < 2.0% | ATE vs. simulated RTK-GPS ground truth in Gazebo |
| **End-to-End Latency** | **18.5 – 22.0 ms** | < 35 ms | Deterministic hardware timestamp trace |
| **Edge Power Budget** | **< 13.5 W (Tier 1) / < 9.2 W (Tier 2)** | < 15 W | Continuous current shunt logging during execution |
| **Negative Obstacle Detection Range** | **2.8 – 3.2 m** | — | 20 approach trials towards 0.5m ditch at 1.2 m/s |
| **False Positive Stops (Tall Grass)** | **< 5%** | — | 50 automated traversals with adaptive speed governor |
| **EMI / EMP Shielding** | **> 85 dB attenuation** | MIL-STD-461G | Radiated susceptibility test (10 kHz to 18 GHz) |
| **Cryptographic Zeroization Time** | **< 85 ms** | Non-negotiable | Crowbar SRAM key wipe & NVMe sanitize |

---

## 📂 Repository Structure & Project Documentation

All complete engineering reports, slide decks, and research feeders have been consolidated into [`docs/`](./docs/):

```
SIH-2/
├── README.md                         # Main repository overview, specs & direct links
├── docs/                             # Complete project technical documentation
│   ├── MASTER_PROJECT_REPORT.md      # Comprehensive defence master engineering report
│   ├── PPT_SLIDES_DECK.md            # Official 5-slide SIH submission deck & presenter notes
│   ├── RESEARCH_FEEDER_BEL_UGV.md    # Domain research, threat modeling & rubric alignment
│   └── architecture_diagram.pdf      # High-resolution system architecture diagram
├── src/                              # Clean ROS 2 Humble packages
│   ├── netra_security/               # S-ROS 2 policies, SecOC CAN authentication & zeroization
│   ├── netra_perception/             # BiSeNetV2 TensorRT INT8 inference + Ground-ROI crop
│   ├── netra_localization/           # OpenVINS EKF-MSCKF + KLT tracker + 500 Hz IMU fusion
│   ├── netra_mapping/                # 2.5D risk costmap + v-Disparity negative obstacle raycaster
│   └── netra_planning/               # Kinodynamic TEB local planner + tip-over & shock safety guards
├── weights/                          # TensorRT INT8 engines & encrypted model binaries
└── sim/                              # Gazebo Garden tactical world & UGV URDF models
```

### 📖 Direct Links to Documentation
* 👉 **[Defence Master Engineering Report](./docs/MASTER_PROJECT_REPORT.md)** — In-depth technical synthesis, FIPS 140-3 cryptography, MIL-STD shielding, deterministic math, and failsafe hierarchy.
* 👉 **[Official 5-Slide Presentation Deck & Notes](./docs/PPT_SLIDES_DECK.md)** — Verbatim slide copy, visual layouts, and 30-to-60 second presenter speaking scripts focusing on security and robustness.
* 👉 **[Research Feeder & Threat Modeling](./docs/RESEARCH_FEEDER_BEL_UGV.md)** — Deep battlefield threat analysis, cyber-physical attack vectors, hardware BOM spectrum, and SIH evaluation rubric alignment.
