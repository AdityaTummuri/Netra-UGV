# 🎬 NETRA-UGV: Official 5-Minute Technical Video Script
### *Defence-Grade Autonomous Navigation Brain for Tactical Military UGVs*
**Initiative:** Smart India Hackathon (SIH 2025) | **Problem Statement ID:** 26126  
**Host Organization:** Bharat Electronics Limited (BEL) — Navratna Defence PSU, Ministry of Defence  
**Target Duration:** Exactly 5 Minutes (300 Seconds) | **Target Speaking Pace:** 130–140 words/min (~680 words total)  
**Primary Reference Files:** [README.md](../README.md) · [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) · [MASTER_PROJECT_REPORT.md](./MASTER_PROJECT_REPORT.md)

---

## ⏱️ Video Structure & Timeline Overview

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        5-MINUTE VIDEO MASTER TIMELINE                                  │
├─────────┬───────────────────────────────┬──────────────────────────────────────────────┤
│ Time    │ Chapter / Segment             │ Key Visual & Core Focus                      │
├─────────┼───────────────────────────────┼──────────────────────────────────────────────┤
│ 00:00 - │ Chapter 1: The Tactical Crisis│ Combat Threat Map (LoC/LAC), EW Jamming,     │
│ 01:00   │ & Battlefield Failure Modes   │ Why LiDAR & 2D YOLO Collapse in Combat       │
├─────────┼───────────────────────────────┼──────────────────────────────────────────────┤
│ 01:00 - │ Chapter 2: Security-First,    │ CAD Cutaway of Shielded Billet Enclosure,    │
│ 02:00   │ Encryption & Shielding        │ LUKS2 AES-256, S-ROS 2 & <85ms Zeroization   │
├─────────┼───────────────────────────────┼──────────────────────────────────────────────┤
│ 02:00 - │ Chapter 3: Deterministic Core │ RViz2 Overlay: Dynamic Horizon ROI,          │
│ 03:00   │ Perception & Ditch Detection  │ v-Disparity Raycasting & OpenVINS 50Hz MSCKF │
├─────────┼───────────────────────────────┼──────────────────────────────────────────────┤
│ 03:00 - │ Chapter 4: Split-Compute BOM  │ Hardware Block Diagram, OAK-D ASIC Depth,    │
│ 04:00   │ & Deterministic Latency       │ 18.5ms RT-PREEMPT Budget, Tier 1 vs Tier 2   │
├─────────┼───────────────────────────────┼──────────────────────────────────────────────┤
│ 04:00 - │ Chapter 5: Failsafe Hierarchy,│ 4-Level Limp-Home State Machine,             │
│ 05:00   │ Quantified KPIs & Outro       │ Gazebo Simulation Run, Verified KPI Summary  │
└─────────┴───────────────────────────────┴──────────────────────────────────────────────┘
```

---

## 📽️ Detailed Segment-by-Segment Production Script

---

### ⏱️ MINUTE 00:00 – 01:00 | CHAPTER 1: The Tactical Crisis & Battlefield Failures

#### 📺 Visual Cues & Screen Directions:
* **00:00 – 00:15:** Full-screen title card with NETRA-UGV emblem and Sanskrit motto: *"NETRA (नेत्र) — Eyes of the Tactical Battlefield"*. Cut to presenter in front of a high-contrast satellite map showing high-altitude Ladakh and mountainous LoC border defiles.
* **00:15 – 00:35:** Split-screen animation showing an enemy electronic warfare jammer broadcasting a jamming cloud, with commercial GPS coordinates scrambling to `NaN`.
* **00:35 – 01:00:** B-roll / simulated footage showing:
  1. A spinning LiDAR sensor emitting bright beams picked up on night vision.
  2. A standard rover running 2D YOLO driving directly off a hidden trench lip into a rollover.
  3. A rover freezing in $50\text{ cm}$ tall grass due to a binary 2D costmap halt.

#### 🎙️ Presenter Delivery Guide:
* **Tone:** Urgent, authoritative, clear military cadence.
* **Pacing:** Steady, commanding attention immediately.

#### 🗣️ Spoken Script (138 Words):
> *"In a forward tactical combat zone, autonomy without military-grade security is an immediate liability. Along the Line of Control and high-altitude Ladakh, our Armed Forces face extreme operational realities: Russian and Chinese-class electronic warfare jammers neutralize satellite GPS in under two seconds. Meanwhile, spinning active LiDAR sensors betray a rover’s position to enemy Laser Warning Receivers while draining thirty Watts of battery.*
>
> *Worse still, commercial robotics software collapses off-road. Standard object detectors like YOLO see trees and boulders, but are completely blind to negative obstacles—driving rovers straight into anti-tank ditches and shell craters. And traditional navigation grids treat tall grass like solid concrete walls, causing endless false stops.*
>
> *For Bharat Electronics Limited, our team developed **NETRA-UGV**: a hardware-shielded, encrypted, and emission-free vision navigation brain engineered for 100% mission survival."*

---

### ⏱️ MINUTE 01:00 – 02:00 | CHAPTER 2: Security-First, Cryptography & Hardware Shielding

#### 📺 Visual Cues & Screen Directions:
* **01:00 – 01:25:** 3D CAD explosion view of the milled 6061-T6 aluminum avionics enclosure, highlighting:
  - Double-lip silver-filled conductive EMI gaskets.
  - Optical sapphire glass windows ($2200\text{ HV}$) with pulsed air-purge nozzles.
  - Amphenol MIL-DTL-38999 circular connectors.
* **01:25 – 01:45:** Diagram of the Cryptographic Architecture:
  - TPM 2.0 Secure Boot PKI verification flow.
  - LUKS2 AES-XTS-256 encrypted storage with encrypted RAMDisk for model weights.
  - S-ROS 2 (DDS Security v1.1) with X.509 certificates and AES-GCM-256 topic encryption.
* **01:45 – 02:00:** Animated graphic of an electronic crowbar circuit: Active tamper grid detects chassis breach, triggering complete cryptographic key zeroization in $< 85\text{ ms}$.

#### 🎙️ Presenter Delivery Guide:
* **Tone:** Firm, confident, emphasizing non-negotiable security standards.

#### 🗣️ Spoken Script (135 Words):
> *"Unlike academic prototypes, NETRA is designed defence-first. If a rover is captured, unencrypted software leaks tactical maps and proprietary neural weights. NETRA eliminates this risk completely.*
>
> *At the hardware level, we enforce a TPM 2.0 Secure Boot chain, authenticating the signed real-time kernel before motor controllers ever initialize. All storage is locked under LUKS2 AES-256 full-disk encryption, and our neural model weights exist exclusively inside cryptographically locked RAM. Across the vehicle, our S-ROS 2 architecture encrypts inter-node topics using AES-GCM-256, while motor actuation commands are authenticated using automotive SecOC with AES-128 Message Authentication Codes.*
>
> *Encased in a MIL-STD-461G billet aluminum chassis providing over eighty-five decibels of EMI and EMP attenuation, NETRA features active hull tamper circuits. If captured, hardware crowbar circuits zeroize all cryptographic keys in under eighty-five milliseconds."*

---

### ⏱️ MINUTE 02:00 – 03:00 | CHAPTER 3: Deterministic Core Perception & Negative Obstacle Detection

#### 📺 Visual Cues & Screen Directions:
* **02:00 – 02:20:** Live RViz2 perception capture:
  - Display the raw camera feed.
  - Show the **Dynamic Ground-Horizon ROI** bounding box dynamically tracking the IMU pitch angle, cropping out the sky and vehicle hood.
  - Overlay the 4-class semantic color mask (Solid Ground = Green, Pliant Brush = Yellow, Mud = Orange, Rigid Obstacle = Red).
* **02:20 – 02:40:** Animated graphic of the **$v$-Disparity Space Transformation**:
  - Show the straight ground diagonal line.
  - Show a ditch producing an instant downward discontinuity and disparity void gap.
  - Show the Bayesian confirmation counter ticking $1 \to 2 \to 3$ frames before committing an instant virtual barrier to the 2.5D costmap.
* **02:40 – 03:00:** Display OpenVINS feature tracking: Green KLT optical flow vectors tracking FAST corners at $50\text{ Hz}$, with the 6-DoF odometry trajectory tracking smoothly.

#### 🎙️ Presenter Delivery Guide:
* **Tone:** Technical, precise, demonstrative.

#### 🗣️ Spoken Script (140 Words):
> *"To guarantee absolute dependability, we eliminated fragile, non-deterministic research models from the critical control path. Every algorithm in NETRA is mathematically bounded and provable.*
>
> *First: our Horizon-Aware Dynamic ROI uses tactical IMU pitch data to crop out the sky and chassis, slashing TensorRT INT8 inference of our BiSeNetV2 network to just 2.6 milliseconds. In tall grass, an adaptive speed governor throttles velocity to 0.5 meters per second while monitoring suspension shocks.*
>
> *Second: to solve negative obstacles, we bypass heavy, noisy 3D point cloud RANSAC. Instead, we compute the ground plane directly in 2D v-disparity space in under 0.6 milliseconds. Hidden trenches and shell craters appear as geometric disparity voids. Our Bayesian temporal accumulator verifies the hazard over three consecutive frames, giving over 2.3 seconds of braking margin while eliminating false stops on gravel.*
>
> *Third: OpenVINS executes deterministic KLT optical flow at 50 Hertz on CPU, maintaining localization drift under 1.2% across 500 meters of total GPS denial."*

---

### ⏱️ MINUTE 03:00 – 04:00 | CHAPTER 4: Split-Compute Topology & Deterministic Latency

#### 📺 Visual Cues & Screen Directions:
* **03:00 – 03:25:** System Architecture Block Diagram:
  - Highlight the Luxonis OAK-D Pro Stereo Vision Engine offloading disparity on its onboard ASIC.
  - Arrow showing $0\text{ ms}$ host GPU load for stereo depth.
  - Highlight the Jetson Orin Nano CPU core affinity map: Cores 2 & 3 shielded with `isolcpus` for the VIO real-time thread.
* **03:25 – 03:45:** Latency Waterfall Chart:
  - Sensor DMA: $3.5\text{ ms}$ $\to$ Perception/VIO: $3.8\text{ ms}$ $\to$ 2.5D Costmap: $2.0\text{ ms}$ $\to$ TEB Spline: $7.5\text{ ms}$ $\to$ SecOC CAN: $1.0\text{ ms}$.
  - Total latency bar highlighting **$18.5\text{ ms}$ ($> 45\text{ Hz}$)**.
* **03:45 – 04:00:** Side-by-side BOM Comparison Card:
  - **Tier 1 (Tactical Primary):** Jetson Orin Nano + OAK-D Pro ($<13.5\text{W}$, ₹70,500).
  - **Tier 2 (Ultra-Low-Cost Swarm):** Raspberry Pi 5 + Hailo-8 NPU ($<9.2\text{W}$, ₹30,000 — 58% savings).

#### 🎙️ Presenter Delivery Guide:
* **Tone:** Pragmatic, engineering-focused, emphasizing cost-effectiveness and real-time execution.

#### 🗣️ Spoken Script (134 Words):
> *"A primary reason vision systems fail in real-world deployment is computational contention. Computing stereo disparity on an embedded GPU burns up to 25 milliseconds, choking neural networks and crashing frame rates.*
>
> *NETRA solves this through a Split-Compute Architecture. We offload stereo rectification and disparity entirely to an onboard vision processor, streaming rectified depth with zero host GPU overhead. This reserves 100% of the Jetson’s Ampere GPU for neural inference. Running on an RT-PREEMPT real-time Linux kernel with CPU core shielding, our entire perception-to-actuation pipeline executes in a deterministic 18.5 milliseconds—guaranteeing an agile, closed-loop control rate exceeding 45 Hertz.*
>
> *Furthermore, for expendable scout rovers, we developed an ultra-low-cost swarm tier pairing a Raspberry Pi 5 with a 26-TOPS Hailo-8 NPU for under thirty thousand rupees, delivering 58% cost savings at sub-10-Watt power."*

---

### ⏱️ MINUTE 04:00 – 05:00 | CHAPTER 5: Failsafe State Machine, Quantified KPIs & Outro

#### 📺 Visual Cues & Screen Directions:
* **04:00 – 04:25:** Gazebo Simulation Demonstration:
  - The tactical skid-steer UGV navigates an off-road obstacle world.
  - Shows vehicle accelerating on solid ground, smoothly traversing tall grass at $0.5\text{ m/s}$.
  - Camera approaches an anti-tank ditch: a virtual barrier appears $3\text{ meters}$ ahead, and the TEB local planner smoothly executes a clean evasive turn.
  - Artificial smoke screen appears: show on-screen telemetry switching to **Level 2 Failsafe: Dead-Reckoning Limp Mode**, bringing the UGV to a controlled halt.
* **04:25 – 04:45:** Full-screen KPI Benchmark Table:
  - Drift: $< 1.2\%$ over $500\text{ m}$ (vs. BEL $< 2.0\%$).
  - Latency: $18.5\text{ ms}$ ($> 45\text{ Hz}$).
  - Negative Obstacle Range: $3.0\text{ m}$ forward.
  - Zeroization: $< 85\text{ ms}$.
  - Power: $< 13.5\text{ W}$.
* **04:45 – 05:00:** Presenter on camera with UGV rendering in background. Closing statement and official sign-off with BEL and SIH 2025 logos.

#### 🎙️ Presenter Delivery Guide:
* **Tone:** Inspiring, decisive, leaving a powerful impression of readiness and national sovereignty.

#### 🗣️ Spoken Script (133 Words):
> *"A battle-ready system must have deterministic recovery. NETRA implements a multi-tier failsafe state machine: sudden sun glare is resolved by ground-weighted auto-exposure in under 35 milliseconds. If heavy smoke screens blind the optical sensors, pulsed air nozzles purge the sapphire lenses, while the system seamlessly falls back to inertial dead-reckoning and wheel slip compensation to execute a controlled tactical stop.*
>
> *Our validated metrics speak for themselves: localization drift under 1.2% in total GPS blackout, 18.5-millisecond closed-loop latency, reliable ditch detection at three meters, and complete cryptographic zeroization in under 85 milliseconds—all under 13.5 Watts.*
>
> *NETRA-UGV provides Bharat Electronics Limited and India’s Armed Forces with a sovereign, unbreachable, and battle-hardened autonomous navigation brain. Built for the border. Engineered to survive. Thank you."*

---

## 📋 Production Checklist for Recording

| Item | Requirement | Verified |
| :--- | :--- | :---: |
| **Microphone** | Crisp lapel / condenser mic, zero ambient echo, clean vocal presence | [ ] |
| **Visual Resolution** | 1080p @ 60 FPS or 4K @ 30 FPS screen recording of RViz2 / Gazebo | [ ] |
| **Terminal Visuals** | Large monospace font ($>16\text{pt}$), dark theme with clear colored status output | [ ] |
| **B-Roll Overlays** | Synchronized with speech timestamps (no lingering dead slides) | [ ] |
| **Total Audio Duration** | Checked against stopwatch: must land between **04:50 and 05:00** | [ ] |

---
*Document Version: 3.1 | Formatted for SIH 2025 Official Video Submission*
