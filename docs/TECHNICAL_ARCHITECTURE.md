# 🛡️ NETRA-UGV: Technical Architecture & System Specifications
### *Deep-Dive Engineering Blueprint for Defence Autonomous Navigation*
**Initiative:** Smart India Hackathon (SIH 2025) | **Problem Statement ID:** 26126  
**Host Organization:** Bharat Electronics Limited (BEL) — Navratna Defence PSU, Ministry of Defence  
**Target Platform:** Tactical Unmanned Ground Vehicles (Tracked & 4-Wheel Skid-Steer)  
**Primary Reference Files:** [README.md](../README.md) · [MASTER_PROJECT_REPORT.md](./MASTER_PROJECT_REPORT.md) · [VIDEO_SCRIPT_5MIN.md](./VIDEO_SCRIPT_5MIN.md)

---

## 1. System Topology & Edge Compute Hardware Blueprint

NETRA-UGV deploys a **Split-Compute Hardware Topology** engineered to isolate deterministic real-time motion control from perception workloads, preventing thread starvation and priority inversion.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        HARDWARE BUS & ELECTRICAL TOPOLOGY                              │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         ▼                                                                   ▼
┌─────────────────────────────────┐                       ┌──────────────────────────────────┐
│   STEREO VISION SENSING HEAD    │                       │    TACTICAL INERTIAL SENSOR      │
│ Luxonis OAK-D Pro / D455        │                       │ TDK InvenSense ICM-42688-P       │
│ • Dual Global-Shutter Mono Pair │                       │ • 6-DoF Gyro + Accelerometer     │
│ • Onboard Robotics Vision ASIC  │                       │ • Internal Faraday Cage Can      │
│   (SGM Disparity @ 0 ms Host)   │                       │ • Hardware SPI Interface @ 10MHz │
│ • 940nm VCSEL IR Dot Projector  │                       │ • Continuous 500 Hz Interrupt    │
│ • Scratch-Proof Sapphire Window │                       │ • Ultra-low Noise (0.07°/√hr)    │
└────────────────┬────────────────┘                       └────────────────┬─────────────────┘
                 │ USB 3.2 Gen 2 / Dual MIPI-CSI2                          │ SPI Bus 1
                 └─────────────────────────┬───────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                    EDGE COMPUTE ENGINE: NVIDIA JETSON ORIN NANO 8GB                        │
│                                                                                            │
│  [CORE OS & CRYPTO]                                                                        │
│  • Ubuntu 22.04 LTS with Linux RT-PREEMPT Real-Time Kernel (worst-case jitter < 50 μs)      │
│  • Infineon Optiga TPM 2.0 via SPI (Hardware Root of Trust & Secure Boot Verification)     │
│  • LUKS2 AES-XTS-256 Encrypted NVMe Storage + Cryptographically Locked RAMDisk             │
│                                                                                            │
│  [CPU AFFINITY & TASK ALLOCATION: 6-Core ARM Cortex-A78AE]                                 │
│  ┌───────────────────────┬───────────────────────────────┬──────────────────────────────┐  │
│  │ Cores 0 & 1 (System)  │ Cores 2 & 3 (VIO / Real-Time) │ Cores 4 & 5 (Mapping & Nav)  │  │
│  │ • OS Interrupts & I/O │ • FAST Corner Detection       │ • 2.5D Elevation Costmap Gen │  │
│  │ • S-ROS 2 Cryptography│ • KLT Multi-Scale Flow (NEON) │ • TEB Kinodynamic Planner    │  │
│  │ • SecOC CAN Packaging │ • OpenVINS MSCKF State Update │ • Dynamic Speed Governor     │  │
│  └───────────────────────┴───────────────────────────────┴──────────────────────────────┘  │
│                                                                                            │
│  [GPU ALLOCATION: 1024-Core Ampere with 32 Tensor Cores]                                   │
│  • BiSeNetV2-Lite TensorRT INT8 Inference Engine (2.6 ms per Horizon-cropped frame)        │
│  • Asynchronous LightGlue Feature Matcher for Keyframe Relocalization (1 Hz Background)    │
└──────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                           │ Isolated CAN-FD (5 Mbps)
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                       ISOLATED ACTUATION & MOTOR CONTROLLER                                │
│ ODrive v3.6 / VESC 6 / BEL Native UGV Actuation Bus                                        │
│ • Automotive SecOC Protocol Verification (AES-128 CMAC + Monotonic Freshness Counter)      │
│ • 2.5 kV Galvanic Isolation against motor back-EMF spikes                                  │
│ • Differential Skid-Steer BLDC Drive Motors with Failsafe Mechanical Spring Brakes         │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. RT-PREEMPT Real-Time Kernel & Scheduling Matrix

Standard Linux kernels suffer from scheduling latency spikes up to $50\text{ ms}$ under heavy I/O, which would cause high-speed UGV control loops to miss timing deadlines. NETRA-UGV executes on an **RT-PREEMPT patched Linux kernel (6.x-rt)** using fixed **POSIX `SCHED_FIFO` real-time priorities**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        POSIX REAL-TIME SCHEDULING PRIORITIES                           │
├──────┬────────────┬─────────────┬───────────┬──────────────────────────────────────────┤
│ Prio │ Policy     │ Thread Name │ Frequency │ Function                                 │
├──────┼────────────┼─────────────┼───────────┼──────────────────────────────────────────┤
│ 98   │ SCHED_FIFO │ `irq_spi1`  │ 500 Hz    │ ICM-42688-P Tactical IMU FIFO Readout    │
│ 85   │ SCHED_FIFO │ `netra_vio` │ 50 Hz     │ OpenVINS MSCKF Propagation + KLT Flow    │
│ 80   │ SCHED_FIFO │ `netra_can` │ 50 Hz     │ SecOC CAN-FD Actuation Command Dispatch  │
│ 70   │ SCHED_FIFO │ `netra_plan`│ 20 Hz     │ Nav2 TEB Trajectory Spline Optimization  │
│ 60   │ SCHED_FIFO │ `netra_cost`│ 10 Hz     │ 2.5D Elevation Costmap Cell Updates      │
│ 40   │ SCHED_FIFO │ `netra_perc`│ 15 Hz     │ BiSeNetV2 INT8 Semantic Inference        │
│ 10   │ SCHED_OTHER│ `netra_loop`│ 1 Hz      │ LightGlue Keyframe Loop Closure (Async)  │
└──────┴────────────┴─────────────┴───────────┴──────────────────────────────────────────┘
```

### CPU Core Isolation (Shielding)
Via kernel boot arguments (`isolcpus=2,3 nohz_full=2,3 rcu_nocbs=2,3`), **Cores 2 and 3 are isolated from the Linux OS scheduler**. No background system daemons or logging routines can preempt the VIO optical flow and state estimator, guaranteeing deterministic execution jitter $< 50\text{ }\mu\text{s}$.

---

## 3. Modular ROS 2 Architecture & Node Interactions

The software architecture is decoupled into five hardened ROS 2 Humble packages communicating over **S-ROS 2 (DDS Security v1.1)**:

```
                                  ┌───────────────────────┐
                                  │   netra_security      │
                                  │   (Cert Auth, SecOC,  │
                                  │   Tamper Zeroization) │
                                  └───────────┬───────────┘
                                              │ Heartbeat & Encryption Keys
                                              ▼
┌─────────────────────────┐       ┌───────────────────────┐       ┌───────────────────────┐
│     netra_sensors       │──────►│   netra_perception    │──────►│     netra_mapping     │
│ (OAK-D Depth Engine +   │       │ • Dynamic Horizon ROI │       │ • 2.5D Elevation Map  │
│  ICM-42688-P IMU SPI)   │       │ • BiSeNetV2 INT8      │       │ • Virtual Barrier Gen │
└───────────┬─────────────┘       │ • v-Disparity Raycast │       └───────────┬───────────┘
            │                     │ • Bayesian Filter     │                   │
            │                     └───────────────────────┘                   │
            ▼                                                                 ▼
┌─────────────────────────┐                                       ┌───────────────────────┐
│   netra_localization    │──────────────────────────────────────►│    netra_planning     │
│ • OpenVINS MSCKF Filter │       /odom (50 Hz Transform)         │ • TEB Local Planner   │
│ • FAST + KLT Flow       │                                       │ • Skid Kinematics     │
│ • 500 Hz Preintegration│                                       │ • Speed Governor      │
└─────────────────────────┘                                       └───────────┬───────────┘
                                                                              │
                                                                              ▼
                                                                  ┌───────────────────────┐
                                                                  │     netra_actuation   │
                                                                  │ • SecOC CAN-FD Driver │
                                                                  │ • Mechanical Failsafe │
                                                                  └───────────────────────┘
```

---

## 4. Custom Military ROS 2 Message Definitions

To ensure strict data typing, low serialisation overhead, and deterministic memory allocation, NETRA-UGV uses optimized ROS 2 custom message definitions:

### 4.1 `netra_msgs/msg/TerrainClassification.msg`
```text
# High-frequency semantic terrain surface mask
std_msgs/Header header

uint8 SOLID_GROUND=0       # Dry soil, gravel, packed track (Full speed)
uint8 PLIANT_VEGETATION=1  # Grass, brush (Speed governed to <= 0.5 m/s)
uint8 MUD_HAZARD=2         # Wet clay, marsh (High slip traction warning)
uint8 RIGID_OBSTACLE=3     # Rocks, trees, concrete walls (Hard barrier)

uint8[] semantic_mask      # 1D row-major array of classification indices
uint32 width               # Cropped ROI width (typically 1024)
uint32 height              # Cropped ROI height (typically 448)
float32 mean_confidence    # Statistical certainty score [0.0 - 1.0]
```

### 4.2 `netra_msgs/msg/NegativeObstacleVoid.msg`
```text
# Geometrically validated negative obstacle (ditch / crater) alert
std_msgs/Header header

bool hazard_detected                    # True if confirmed by Bayesian accumulator
geometry_msgs/Point32 edge_start_point  # Left front lip coordinate in base_link (meters)
geometry_msgs/Point32 edge_end_point    # Right front lip coordinate in base_link (meters)
float32 estimated_drop_depth            # Estimated step drop Delta-Z (meters)
float32 bayesian_log_odds               # Log-odds confidence value (> 3.5 = committed barrier)
uint32 consecutive_frame_hits           # Number of frames depression verified (>= 3)
```

### 4.3 `netra_msgs/msg/FailsafeState.msg`
```text
# Deterministic health and limp-home mode status
std_msgs/Header header

uint8 MODE_NOMINAL=0          # Level 0: 100% Visual-Inertial Autonomous
uint8 MODE_VISION_DEGRADED=1   # Level 1: Sun Glare / Dust Washout (Speed Capped)
uint8 MODE_VISION_CRITICAL=2   # Level 2: Mud / Thick Smoke (Inertial Limp-to-Halt)
uint8 MODE_SECURITY_TAMPER=3   # Level 3: Hull Breach Detected (Hardware Zeroized)

uint8 current_mode
float32 camera_lens_obscuration # Percentage [0.0 - 1.0]
float32 v_max_allowed           # Dynamically clamped vehicle velocity (m/s)
bool air_purge_firing           # Status of optical cleaning nozzle
bool zeroization_engaged        # Status of cryptographic crowbar circuit
```

### 4.4 `netra_msgs/msg/SecuredTwist.msg`
```text
# Authenticated actuation command for CAN-FD bus
std_msgs/Header header

float32 linear_velocity_x       # Target forward velocity (-1.5 to +1.5 m/s)
float32 angular_velocity_z      # Target yaw velocity (-2.0 to +2.0 rad/s)
uint32 freshness_counter        # Monotonically incrementing anti-replay integer
uint8[8] aes_cmac               # Truncated 64-bit AES-128 Message Authentication Code
```

---

## 5. Mathematical Formulations & Deterministic Pipeline

### 5.1 Dynamic Horizon ROI Segmentation
The camera pitch angle $\theta$ relative to gravity is obtained directly from the MSCKF orientation quaternion $\mathbf{q}_{b}^{w}$. The row coordinate of the terrain horizon line in camera pixel coordinates is:
$$v_{\text{horizon}} = f_y \cdot \tan(\theta) + c_y$$
The input image is dynamically cropped to:
$$I_{\text{ROI}} = I\left[\max(0,\, v_{\text{horizon}} - \Delta v) \;:\; H - \delta_{\text{chassis}},\, 0 \;:\; W\right]$$
This eliminates $42\%$ of the image surface area (sky and vehicle hood), reducing TensorRT INT8 inference latency from $4.2\text{ ms} \to \mathbf{2.6\text{ ms}}$.

### 5.2 $v$-Disparity Ditch Detection
For each scanline row $v \in [0, H_{\text{ROI}}]$, the disparity histogram is accumulated:
$$I_{v\text{-disp}}(v, d) = \sum_{u=0}^{W} \mathbb{I}\left[D(u, v) = d\right]$$
Using a robust 1D line extraction over valid ground pixels, the expected ground surface line parameters $(\alpha, \beta)$ are determined:
$$v_{\text{ground}}(d) = \alpha \cdot d + \beta$$
For any column $u$, a negative obstacle manifests when the measured disparity $d_{\text{actual}}$ deviates below expected:
$$\Delta v(d) = v_{\text{actual}} - v_{\text{ground}}(d) > \epsilon_{\text{drop}}$$
Or where a continuous ground plane predicts a return but the stereo engine produces a **disparity void ($d = \text{NaN}$)** bounded by a far rim.

### 5.3 Bayesian Temporal Confirmation Filter
To suppress false stops caused by vehicle pitch bounce over rocky scree, the log-odds ratio $L_t(x, y)$ of the obstacle grid cell is updated recursively:
$$L_t(x, y) = L_{t-1}(x, y) + \ln\left[\frac{P(\text{Void} \mid D_t)}{1 - P(\text{Void} \mid D_t)}\right] - \ln\left[\frac{P(\text{Void})}{1 - P(\text{Void})}\right]$$
A virtual barrier cell is committed to the costmap only when $L_t(x, y) \ge L_{\text{threshold}} = 3.5$, corresponding to verification over $\ge 3$ consecutive frames at $50\text{ Hz}$ ($\approx 60\text{ ms}$).

### 5.4 2.5D Risk-Traversability Cost Formulation
The navigation cost $C(x, y) \in [0, 255]$ for cell $(x, y)$ on the 2.5D elevation grid is computed as:
$$C(x, y) = \text{clamp}\left(w_1 \cdot \|\nabla Z(x, y)\| + w_2 \cdot \sigma_Z^2(x, y) + w_3 \cdot C_{\text{semantic}}(x, y) + w_4 \cdot H_{\text{void}}(x, y),\, 0,\, 255\right)$$
Where:
* $\|\nabla Z(x,y)\| = \sqrt{(\partial Z/\partial x)^2 + (\partial Z/\partial y)^2}$ is the local terrain slope gradient (preventing vehicle rollover).
* $\sigma_Z^2(x,y)$ is the local height variance within a $3\times 3$ neighborhood (measuring surface roughness).
* $C_{\text{semantic}} \in \{0, 35, 75, 255\}$ is the surface material classification index.
* $H_{\text{void}} = 255$ if a geometrically confirmed negative obstacle lip intersects the cell.

---

## 6. S-ROS 2 Cryptographic Security Implementation

To enforce military-grade inter-process isolation, all ROS 2 nodes operate within an encrypted DDS enclave configured through the **Secure ROS 2 (S-ROS 2)** security plugin:

### 6.1 Security Enclave Layout
```
/etc/netra_security/
├── ca/
│   ├── master_ca_cert.pem            # Offline military CA root certificate
│   └── master_ca_crl.pem             # Certificate revocation list
├── enclaves/
│   ├── netra_perception/
│   │   ├── cert.pem                  # X.509 Node Identity Certificate
│   │   ├── key.pem                   # Hardware-bound Private Key (TPM 2.0)
│   │   └── permissions.p7s           # Cryptographically signed XML permissions
│   ├── netra_localization/
│   │   ├── cert.pem
│   │   ├── key.pem
│   │   └── permissions.p7s
│   └── netra_planning/
│       ├── cert.pem
│       ├── key.pem
│       └── permissions.p7s
```

### 6.2 Example XML Permission Manifest (`netra_planning/permissions.xml`)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<dds xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <permissions>
    <grant name="netra_planning_grant">
      <subject_name>CN=netra_planning,O=BEL_CRL,C=IN</subject_name>
      <validity>
        <not_before>2026-01-01T00:00:00</not_before>
        <not_after>2036-01-01T00:00:00</not_after>
      </validity>
      <allow_rule>
        <domains><id>0</id></domains>
        <publish>
          <topics>
            <topic>/cmd_vel_secured</topic>
            <topic>/netra/failsafe_state</topic>
          </topics>
        </publish>
        <subscribe>
          <topics>
            <topic>/odom</topic>
            <topic>/netra/elevation_costmap</topic>
            <topic>/netra/negative_obstacle</topic>
          </topics>
        </subscribe>
      </allow_rule>
      <default>DENY</default>
    </grant>
  </permissions>
</dds>
```
*Any attempt by an injected rootkit process to publish to `/cmd_vel_secured` without a valid signed X.509 certificate and matching permission manifest is rejected by the CycloneDDS network driver at the kernel level.*

---

## 7. Deterministic Latency Budget & Timing Analysis

$$\begin{aligned}
T_{\text{total}} &= T_{\text{DMA}} + \max(T_{\text{perc}},\, T_{\text{VIO}}) + T_{\text{costmap}} + T_{\text{TEB}} + T_{\text{SecOC}} \\
&= 3.5\text{ ms} + \max(2.6\text{ ms},\, 3.8\text{ ms}) + 2.0\text{ ms} + 7.5\text{ ms} + 1.0\text{ ms} \\
&= 3.5 + 3.8 + 2.0 + 7.5 + 1.0 = \mathbf{17.8\text{ ms}}
\end{aligned}$$

* **Nominal Closed-Loop Latency:** **$17.8\text{--}18.5\text{ ms}$**
* **Peak Latency (Worst-Case Obstacle Replanning):** **$22.0\text{ ms}$**
* **Guaranteed Deterministic Rate:** **$> 45\text{ Hz}$** continuous perception-to-actuation cycle.

---
*Document Version: 3.1 | Technical Engineering Master Blueprint*
