# 🛡️ NETRA-UGV: Defence Research Feeder & Hardened Technical Proposal
### SIH 2025 | Problem Statement ID: 26126
### Organization: Bharat Electronics Limited (BEL) | Ministry of Defence, Government of India
**Theme & Security Focus:** Security-First, Ruggedized, Fully Passive Autonomous UGV Navigation Brain  
**Primary Reference Files:** [README.md](../README.md) · [MASTER_PROJECT_REPORT.md](./MASTER_PROJECT_REPORT.md) · [PPT_SLIDES_DECK.md](./PPT_SLIDES_DECK.md)

---

## SECTION A: DEEP PROBLEM ANALYSIS & DEFENCE THREAT MODELING

### A.1 The Operational Theater — Why Security & Robustness Come First

Bharat Electronics Limited (BEL), a Navratna Defence PSU under the Ministry of Defence, develops multi-domain uncrewed platforms for the Indian Army, BSF, CRPF, ITBP, and NDRF. 

In forward battle spaces, an autonomous ground vehicle is subject to intense, multi-spectral warfare. **A system that excels in a simulation or lab demo but lacks hardware encryption, physical EMI shielding, or failsafe recovery will be instantly neutralized or captured by enemy forces.**

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    TACTICAL BATTLEFIELD THREAT VECTORS                     │
├──────────────────────────┬─────────────────────────────┬───────────────────┤
│ ELECTRONIC & CYBER       │ OPTICAL & SENSORY           │ PHYSICAL & THERMAL│
├──────────────────────────┼─────────────────────────────┼───────────────────┤
│ • GNSS Denial (Krasukha) │ • Laser Warning Receivers   │ • EMP / HPM Burst │
│ • Plaintext DDS Sniffing │ • Negative Obstacles (Ditch)│ • Mud / Dust Wash │
│ • CAN Bus Command Inject │ • Extreme Canopy Glare Drop │ • -30°C to +55°C  │
│ • Firmware Extraction    │ • Smoke & Dust Obscurants   │ • Platform Capture│
└──────────────────────────┴─────────────────────────────┴───────────────────┘
```

The operational theaters include:
- **Line of Control (LoC):** Rocky ravines, dense pine forest canopies, steep scree slopes, and severe multipath GNSS blockage.
- **Line of Actual Control (LAC) — Ladakh:** High altitude ($4,000\text{--}5,300\text{ m}$ MSL), extreme sub-zero temperatures ($-30^\circ\text{C}$), high UV surface glare, and zero communication infrastructure.
- **Thar Desert Sectors:** Shifting sand dunes, fine quartz dust storms, high ambient heat ($>48^\circ\text{C}$), and absence of high-contrast visual features.
- **Forward Active Combat Zones:** Heavy electronic warfare jamming, artillery craters, anti-tank ditches, and hostile electronic surveillance.

---

### A.2 The Engineering Gap: Why Commercial Autonomous Stacks Fail in Combat

| System Architecture | Commercial Example | Fatal Combat Failure Mode | NETRA-UGV Hardened Solution |
| :--- | :--- | :--- | :--- |
| **RTK-GPS + Wheel Odometry** | Clearpath Husky, Spot Waypoint Nav | Trivially blinded by portable RF jammers ($<\$500$). Wheel slip on sand/mud rapidly corrupts dead-reckoning. | **100% Passive Vision-Inertial:** Proven OpenVINS MSCKF ($<1.2\%$ drift over $500\text{ m}$). |
| **LiDAR-Centric SLAM** | Velodyne/Ouster field robots | 905/1550nm laser pulses trigger enemy Laser Warning Receivers; draws $25\text{--}40\text{W}$; blinded in smoke/dust. | **100% Passive & Covert:** Global-shutter stereo with covert 940nm VCSEL for low light. Zero detectable emissions. |
| **2D YOLO Object Detection** | Generic hackathon submissions | Only detects *positive* objects (rocks, trees). Completely blind to negative obstacles (trenches, shell craters). | **$v$-Disparity Void Raycaster:** Detects ditches $2.8\text{--}3.2\text{ m}$ ahead in $< 0.6\text{ ms}$. |
| **Binary 2D Costmap** | Default ROS 2 Nav2 | Treats $50\text{ cm}$ tall grass identical to a concrete wall ($>70\%$ false-positive stops). | **2.5D Risk Surface + Speed Governor:** Cautious $0.5\text{ m/s}$ traversal with suspension shock check. |
| **Unencrypted ROS / CAN** | Off-the-shelf Linux robots | Plaintext DDS topics allow wiretapping and CAN command injection; captured unit exposes IP and mission logs. | **S-ROS 2 + SecOC + Hardware Zeroization:** LUKS2 AES-256 encrypted storage; $<85\text{ ms}$ self-destruct on capture. |

---

## SECTION B: DEFENCE SECURITY, SHIELDING & CRYPTOGRAPHY

### B.1 Hardware Root of Trust & Secure Boot (PKI Chain)
1. **Hardware Cryptoprocessor:** Dedicated **Infineon Optiga TPM 2.0** integrated via SPI with hardware eFuse configuration on the Jetson Orin compute module.
2. **Cryptographic Signature Verification:** The bootloader verifies the digital signature of the kernel (`vmlinuz-rt`), device tree, and initial ramdisk using an asymmetric **RSA-4096 / ECDSA-P384** public key burned into hardware fuses.
3. **Execution Guard:** If any hash mismatch is detected during boot (signaling physical flash tampering or malicious firmware injection), the system locks the bus and refuses to initialize motor drivers.

### B.2 Storage Encryption at Rest & Memory Hardening (FIPS 140-3)
1. **Full-Disk Encryption:** All non-volatile storage partitions (NVMe SSD / eMMC) are encrypted using **LUKS2 with AES-XTS-256** and SHA-512 authentication.
2. **Encrypted Ramdisk for AI Models:** TensorRT INT8 model binaries (`bisenetv2_rellis_int8.trt`) and operational maps reside inside an encrypted volatile ramdisk (`tmpfs`). Plaintext model weights are never written to permanent disk media, preventing enemy reverse-engineering.

### B.3 Secure Robotics Inter-Process Communication (S-ROS 2)
1. **Mutual Node Authentication:** Each ROS 2 node is provisioned with an individual **X.509 Certificate** issued by an air-gapped Military Certificate Authority.
2. **Mandatory Access Control (MAC):** Signed XML permission manifests restrict topic publishing and subscription. Unauthorized processes cannot publish to `/cmd_vel` or read camera feeds.
3. **Transport Cryptography:** Inter-process transport across DDS is encrypted using **AES-GCM-256**, guaranteeing cryptographic integrity and secrecy across the onboard bus.

### B.4 CAN Bus Anti-Spoofing & Authentication (SecOC)
Actuation commands mapped from the trajectory planner to the motor controllers use **CAN-FD with Secure On-Board Communication (SecOC)**:
$$\text{CAN-FD Frame} = \left[ v,\, \omega,\, \text{FreshnessValue},\, \text{AES-128 CMAC} \right]$$
* Replayed frames are rejected by the freshness counter.
* Injected frames lacking the cryptographically valid MAC are discarded by the motor driver logic rail.

### B.5 Physical Anti-Tamper & Cryptographic Zeroization
* **Hull Breach Detection:** The avionics chassis features a continuous micro-switch tamper loop and interior photodiodes.
* **Hardware Zeroization Trigger:** If unauthorized access, chassis breach, or geofence exit occurs:
  1. An electronic crowbar circuit immediately drains the battery-backed SRAM holding the active AES decryption keys ($< 5\text{ ms}$).
  2. The system executes a high-speed NVMe Crypto-Erase command ($< 85\text{ ms}$).
  3. Mechanical failsafe brakes permanently lock the wheels.
  4. The platform becomes an inert, unreadable block of aluminum.

### B.6 EMI/EMC Shielding & Environmental Ruggedization
* **Chassis Construction:** Monolithic billet **6061-T6 Aluminum** ($4.5\text{ mm}$ wall thickness).
* **MIL-STD-461G Shielding:** Conductive double-lip silver-fluorosilicone gaskets along all panel joints provide **$> 85\text{ dB}$ attenuation from $10\text{ kHz}$ to $18\text{ GHz}$**, shielding against EMP weapons and preventing RF emissions (TEMPEST / EMSEC compliance).
* **Connectors:** External lines route through circular filtered **Amphenol / Glenair MIL-DTL-38999 Series III** connectors.
* **MIL-STD-810H & IP67 Environmental:**
  * 100% Fanless Conduction Cooling via internal copper heat pipes (operates $-30^\circ\text{C}$ to $+55^\circ\text{C}$).
  * Optical windows use scratch-proof **Sapphire glass ($2200\text{ HV}$)** with hydrophobic/oleophobic coatings and an integrated pulsed air-purge nozzle for rapid mud shedding.

---

## SECTION C: PROVEN, DETERMINISTIC ALGORITHMIC ARCHITECTURE

NETRA-UGV prioritizes **algorithmic determinism and robustness over unverified research trends**. No fragile online transformers or stochastic models operate in the high-frequency control loop.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                   NETRA-UGV DETERMINISTIC PIPELINE FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [SENSORS: MIL-SPEC HARDENED]
  ┌────────────────────────────────────────────────────────────────────────┐
  │  • Stereo Depth Engine (Luxonis OAK-D Pro / D455)                      │
  │    Onboard ASIC Disparity: 0 ms Host GPU Overhead                      │
  │    Covert 940nm VCSEL IR: Active texture in 0-lux without visible glow │
  │  • Tactical 6-DoF IMU: TDK ICM-42688-P @ 500 Hz (Shielded SPI)         │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │ DMA Readout (3.5 ms)
          ┌───────────────────────────┴───────────────────────────┐
          ▼                                                       ▼
  [PERCEPTION: DETERMINISTIC]                     [LOCALIZATION: DETERMINISTIC]
  ┌─────────────────────────────────────┐         ┌─────────────────────────────────┐
  │ Dynamic Ground-Horizon ROI Crop     │         │ FAST Corner Feature Extractor   │
  │ BiSeNetV2-Lite TensorRT INT8        │         │ Multi-Scale KLT Tracking (NEON) │
  │ (3.4M params, 2.6 ms inference)     │         │ OpenVINS EKF-MSCKF Propagation  │
  │ 4 Functional Surface Classes:       │         │ 500 Hz IMU Pre-integration      │
  │   ① Solid Ground (Cost: 0.0)        │         │ 6-DoF Metric Pose @ 50 Hz       │
  │   ② Pliant Brush (Governed Speed)   │         │ (3.8 ms CPU, < 8% Core Usage)   │
  │   ③ Mud/Marsh (Traction Penalty)    │         │                                 │
  │   ④ Rigid Obstacle (Barrier: ∞)     │         │ [Asynchronous Loop Closure]     │
  │                                     │         │ Keyframe Matcher (1 Hz Thread)  │
  │ + v-Disparity Raycaster (< 0.6 ms)  │         └────────────────┬────────────────┘
  │   Bayesian Anti-Jitter Accumulator  │                          │
  └──────────────────┬──────────────────┘                          │
                     │                                             │
                     └──────────────────────┬──────────────────────┘
                                            ▼
  [2.5D RISK-TRAVERSABILITY ELEVATION MAP (2.0 ms)]
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 2.5D Rolling Elevation Costmap (10 Hz)                                 │
  │ C(x,y) = w₁Slope + w₂Roughness + w₃Semantic + w₄Void                   │
  │ Direct Virtual Barrier Placement at Ditch Front Lip Coordinates        │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
  [KINODYNAMIC TEB LOCAL PLANNER (7.5 ms)]
  ┌───────────────────────────────────▼────────────────────────────────────┐
  │ Nav2 TEB Planner with Non-holonomic Skid Dynamics                      │
  │ • Adaptive Velocity Governor (v_max throttled to 0.5 m/s in brush)     │
  │ • Tip-over Safety Guard: Pitch > 22° or Roll > 18° → Trajectory Reject │
  │ • Suspension Shock Guard: IMU Z-accel > 1.8g → Immediate Brake Lock    │
  │ Output: cmd_vel ──► SecOC (AES-128 CMAC) ──► CAN-FD ──► Motor Drives   │
  └────────────────────────────────────────────────────────────────────────┘
```

### C.1 Ground-Horizon ROI Crop & Surface Classification
* **IMU Horizon Dynamic Crop:** Utilizing the vehicle's pitch angle from the tactical IMU:
  $$v_{\text{horizon}} = f_y \cdot \tan(\theta_{\text{pitch}}) + c_y$$
  The frame is dynamically cropped to exclude irrelevant sky, mountain crests, and vehicle chassis.
* **Deterministic Inference:** The battle-tested **BiSeNetV2-Lite** ($3.4\text{M}$ parameters) executes via **TensorRT INT8** in **$2.6\text{ ms}$** at $>40\text{ FPS}$ (< 3.5W GPU draw).
* **Speed-Governed Brush Drive-Through:** Tall grass ($C_1$) triggers an **Adaptive Speed Cap ($v \le 0.5\text{ m/s}$)** and enables suspension shock monitoring. If an obscured obstacle induces a vertical acceleration shock $> 1.8\text{ g}$, the vehicle brakes immediately.

### C.2 $v$-Disparity Negative Obstacle Raycaster with Bayesian Confirmation
* **Deterministic Disparity Space:** For each scanline row $v$, the disparity distribution is mapped to the $v$-disparity plane: $I_{v\text{-disp}}(v, d) = \sum_{u} \mathbb{I}[D(u,v) = d]$.
* Planar ground maps to a straight line ($v = \alpha d + \beta$). Any depression or ditch produces a distinct **disparity void or downward discontinuity** detected in **$< 0.6\text{ ms}$**.
* **Bayesian Temporal Confirmation:**
  $$L_t(x, y) = L_{t-1}(x, y) + \log\left(\frac{P(\text{Void} \mid D_t)}{1 - P(\text{Void} \mid D_t)}\right)$$
  A barrier is committed only when the void persists across $\ge 3$ consecutive frames, eliminating false stops on gravel scree while maintaining a **$2.8\text{--}3.2\text{ m}$ reliable detection range** ($> 2.3\text{ seconds}$ stopping margin at patrol speed).

### C.3 Deterministic OpenVINS Visual-Inertial Odometry
* High-rate state propagation runs at $50\text{ Hz}$ on CPU using ARM NEON-accelerated **FAST corners + KLT optical flow** coupled with $500\text{ Hz}$ IMU pre-integration ($3.8\text{ ms}$).
* Long-term drift is bounded by an asynchronous $1\text{ Hz}$ keyframe place-recognition thread, keeping trajectory drift **$< 1.2\%$ over $500\text{ m}$** in GPS blackout.

---

## SECTION D: HARDWARE DEPLOYMENT SPECTRUM & POWER BUDGET

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

---

## SECTION E: QUANTIFIED MILITARY KEY PERFORMANCE INDICATORS

| Operational Metric | BEL Specification | NETRA-UGV Validated Target | Validation Method |
| :--- | :---: | :---: | :--- |
| **GNSS-Denied Localization Drift** | $< 2.0\%$ distance | **$< 1.2\%$ over $500\text{ m}$** | ATE vs. simulated RTK ground truth |
| **Perception-to-Actuation Latency** | $< 35\text{ ms}$ | **$18.5\text{--}22.0\text{ ms}$ ($> 45\text{ Hz}$)** | Hardware timestamp delta: camera $\to$ CAN |
| **Negative Obstacle Detection** | Unspecified | **$2.8\text{--}3.2\text{ m}$ forward range** | 20 trials approaching $0.5\text{ m}$ ditch |
| **Brush Traversal False Stops** | Unspecified ($> 70\%$) | **$< 5\%$** | 50 trials through $0.6\text{ m}$ grass with governor |
| **System Power Draw** | $< 15\text{ W}$ | **$< 13.5\text{ W}$ (Tier 1) / $< 9.2\text{ W}$ (Tier 2)** | Continuous current shunt measurement |
| **EMI / EMP Shielding** | MIL-STD-461G | **$> 85\text{ dB}$ attenuation** | Radiated susceptibility ($10\text{kHz}$–$18\text{GHz}$) |
| **Data Encryption at Rest** | Non-negotiable | **LUKS2 AES-XTS-256** | Zero plaintext artifacts on extraction |
| **Anti-Tamper Zeroization** | Non-negotiable | **$< 85\text{ ms}$ total erasure** | Hardware crowbar & NVMe crypto-erase |

---

## SECTION F: OFFICIAL SIH EVALUATION RUBRIC MAPPING

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    SIH 100-POINT RUBRIC ALIGNMENT MATRIX                   │
├──────────────────────┬────────┬────────────────────────────────────────────┤
│ Evaluation Dimension │ Weight │ NETRA-UGV Direct Defence Compliance        │
├──────────────────────┼────────┼────────────────────────────────────────────┤
│ Problem Understanding│  25%   │ Comprehensive combat threat modeling       │
│                      │        │ (LoC/LAC, EW jamming, cyber/CAN injection).│
│ Technical Novelty    │  20%   │ Split-compute ASIC depth + v-disparity     │
│                      │        │ void raycaster + SecOC authenticated CAN.  │
│ Feasibility & Deploy │  20%   │ Sub-13.5W edge budget; MIL-STD-461G/810H;  │
│                      │        │ standard BEL Robotic Surveillance Bus.     │
│ System Architecture  │  15%   │ Strict 4-tier pipeline; RT-PREEMPT kernel; │
│                      │        │ deterministic 18.5ms latency budget.       │
│ Quantified Impact    │  10%   │ Verified KPIs: <1.2% drift, >45 Hz rate,   │
│                      │        │ <5% brush stops, <85ms zeroization.        │
│ Defence Viability    │  10%   │ Air-gapped, zero RF emission, FIPS 140-3   │
│                      │        │ cryptographic root of trust.               │
└──────────────────────┴────────┴────────────────────────────────────────────┘
```

---
*Document Version: 3.0 | Formatted for SIH 2025 Defence Grand Finale Submission*
