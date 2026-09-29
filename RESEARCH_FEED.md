# 🚀 SIH GRAND FINALE QUALIFICATION FEEDER & RESEARCH ENGINE
*The Plug-and-Play Pipeline: From Raw Problem Statement Text to Top-1% Grand Finale Selection*

---

## 1. Executive Context & Purpose of this Feeder

Congratulations on clearing the **Internal Hackathon Round with AquaPulse**!

At the national screening level, your submission is reviewed anonymously against **150 to 500+ college teams** submitting for the exact same Problem Statement ID. Evaluators (Ministry Scientists, NIC Technical Directors, and Industry Evaluators) spend an average of **90 to 120 seconds per PPT** during the first screening pass.

To ensure your secondary submission secures the highest probability of qualifying for the Grand Finale, this document is structured as an **Actionable Feeder**:
* You copy this file directly into your new repository as `RESEARCH_FEEDER.md`.
* You feed the raw Problem Statement into **Section 3 (The Intake Questionnaire)**.
* You run through **Section 4 (The 5 Innovation Multipliers)** to engineer your competitive edge.
* You populate **Section 5 (The 5-Slide Submission Blueprint)** with the exact phrasing required to score maximum marks across all rubrics.

```
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│     RAW PS DESCRIPTION    │ ───► │  INNOVATION MULTIPLIERS   │ ───► │  FINAL 5-SLIDE DECK &     │
│   (Ministry Constraints)  │      │ (Edge AI, Sync, Ledgers)  │      │ REPO MVP ARCHITECTURE     │
└───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
```

---

## 2. The SIH National Evaluator Scoring Rubric (Secret Weights)

National evaluators score on a 100-point rubric. Understanding where points are lost determines how your research must be targeted:

| Evaluation Dimension | Weight | Common Mistake (Instant Rejection) | The Top-1% Winning Formulation |
| :--- | :---: | :--- | :--- |
| **Problem Domain Understanding** | **25%** | Re-stating the prompt without operational context. | Breaking down the exact administrative friction point, legacy failure mode, and affected user personas. |
| **Technical Novelty & Depth** | **20%** | Submitting a generic CRUD website, Firebase dashboard, or simple OpenAI API chat wrapper. | Proprietary algorithmic pipeline, self-hosted edge ML, offline-first peer-to-peer sync, or verified cryptographic ledger. |
| **Feasibility & Indian Context** | **20%** | Assuming high-speed 5G, expensive cloud GPUs, or complex proprietary software licenses. | Runs on low-cost Android hardware, operates in 0-network blackouts, 0 recurring API cost, full i18n support (Bhashini). |
| **System Architecture Rigor** | **15%** | Vague arrows connecting "Frontend -> Backend -> Database". | Multi-tier architecture diagram specifying exact protocols (gRPC/WSS/HTTPS), caching (Redis/IndexedDB), and persistence schemas. |
| **Quantified Operational Impact**| **10%** | Fluffy claims like *"will improve farmer life and speed up work."* | Exact metric targets: *"Reduces turnaround time from 14 days to 4.2 hours; cuts operational manpower overhead by 68%."* |
| **36-Hour Hackathon Viability** | **10%** | Overly ambitious claims impossible to demonstrate live. | Clear 4-phase milestone roadmap showing exact working modules for the Grand Finale 3-round evaluation. |

---

## 3. The Intake Questionnaire (PS ID: 26126 - Bharat Electronics Limited)

### Field 1: Basic Identity
* **Problem Statement ID:** `26126`
* **Title:** `Vision Based Autonomous Navigation for Unmanned Ground Vehicle for Outdoor environment`
* **Ministry / Department / PSU:** `Bharat Electronics Limited (BEL) (Navratna Defence PSU under the Ministry of Defence, Government of India)`
* **Category:** `Software`
* **Domain Bucket:** `Smart Automation / Defence Robotics`

### Field 2: Stakeholder & Operational Reality
* **Primary Stakeholder & Operational Context:** Bharat Electronics Limited (BEL) develops tactical unmanned platforms for Indian Defence, Paramilitary (BSF/CRPF/ITBP), and disaster response forces (NDRF). The vehicle operates in hostile, forward, or disputed borders where satellite navigation is actively jammed, spoofed, or blocked by dense forest canopies, deep valleys, and urban canyons (GPS-Denied environments).
* **Who are the Field Operators?** Tactical combat units, border surveillance teams, search-and-rescue operators, or agricultural drone/UGV technicians sending high-level waypoint commands from a remote, low-bandwidth Ground Control Station (GCS).
* **Current Operational Bottlenecks / Why Existing Systems Fail:**
  1. *GPS Vulnerability:* Conventional autonomous rovers rely on RTK-GPS; electronic warfare (EW) jamming or mountain shadows cause total mission abort or runaway vehicles.
  2. *Sensor Payload Limits:* Heavy LiDAR systems consume excessive battery wattage, add payload weight, and emit active laser signatures detectable by enemy sensors.
  3. *Dynamic Outdoor Lighting:* Off-the-shelf camera models fail when moving between harsh sunlight and deep tree shadows (high dynamic range shifts and lens flare).
  4. *Unstructured Terrain Ambiguity:* Road-following models expect asphalt lane markings; outdoor rugged terrain features negative obstacles (ditches, sudden drop-offs, mud, tall grass) that standard bounding-box detectors overlook.

### Field 3: Data Availability & Validation Strategy
* **Real Public Benchmark Datasets:**
  * *RELLIS-3D & RELLIS:* Dedicated benchmark for off-road, rugged outdoor navigation, forest trails, mud, and vegetation.
  * *KITTI Vision Benchmark:* Real-world stereo/monocular visual odometry and SLAM ground truth.
  * *TartanAir Dataset (AirLab / CMU):* Photorealistic visual SLAM dataset covering harsh outdoor environments, changing seasons, rain, and adverse lighting.
* **Synthetic & Simulation Environment (Grand Finale Live Demo Strategy):**
  * ROS 2 (Humble) + Gazebo / Isaac Sim: A simulated 3D rugged outdoor obstacle course (rocks, slopes, negative ditches, light transitions).
  * Demonstrates real-time camera feed ingestion $\rightarrow$ pose estimation $\rightarrow$ motor velocity outputs (`geometry_msgs/Twist cmd_vel`) live on screen.
* **Data Security & Defence Standards:**
  * Zero external telemetry transmission (air-gapped autonomy).
  * Onboard edge execution preventing video feed interception over tactical radio frequencies.

### Field 4: The 2 Core Technical Hooks
* **Hook 1 (Perception): Self-Supervised Traversability & Semantic Depth Estimation:**
  Lightweight Semantic Traversability Matrix (Fast-SCNN / BiSeNetV2 on TensorRT/ONNX INT8) paired with self-supervised monocular depth estimation. Classifies every pixel into Traversable Ground, Non-Traversable Obstacle, Pliant Vegetation (drive-through grass), and Negative Hazard (drop-offs/trenches).
* **Hook 2 (Localization & Planning): Edge-Optimized Visual-Inertial Odometry (VIO) + Real-Time Dynamic Costmap:**
  Robust, drift-corrected Stereo/Monocular Visual-Inertial Odometry (VIO) pipeline (ORB-SLAM3 / OpenVINS principles) with photometric bundle adjustment to survive sudden illumination shocks. Feeds into an Ego-Centric Local Elevation Costmap coupled to a TEB (Timed-Elastic-Band) Local Planner to generate dynamic, collision-free spline trajectories to target waypoints at $>30\text{ FPS}$ on embedded hardware (NVIDIA Jetson Orin Nano / RK3588).

### Field 5: Measurable Key Performance Indicators (KPIs)
* **Metric 1 (Visual Localization Accuracy):** Trajectory drift $<1.2\%$ of total path distance traveled under complete GPS blackout over an outdoor course of $500\text{ meters}$.
* **Metric 2 (Inference & Latency Budget):** End-to-end perception-to-actuation latency $<35\text{ ms}$ ($\ge 28\text{ FPS}$) running on an embedded edge compute budget ($<15\text{W}$ TDP).
* **Metric 3 (Dynamic Obstacle Avoidance):** $100\%$ collision-free path replanning within $<50\text{ ms}$ upon encountering sudden pop-up obstacles within a $5\text{-meter}$ proximity buffer.

---

## 4. The 5 Innovation Multipliers (How to Beat Generic Software Teams)

Almost 80% of student software submissions in SIH follow the exact same cookie-cutter template: *React + Node.js/FastAPI + MongoDB + OpenAI API*.  
**Juries reject these immediately.** To guarantee qualification, inject at least two of these engineering patterns:

### Multiplier 1: "Offline-First & Mesh Resilience" (Crucial for Indian Deployment)
* **The Problem:** In rural districts, border areas, or natural disaster zones, internet is dead or drops packets continuously.
* **The Winning Architecture:** 
  * Local-first storage on the client using **SQLite / IndexedDB**.
  * Use **CRDTs (Conflict-free Replicated Data Types)** or deterministic vector clocks so multiple field devices can record data offline and auto-reconcile conflicts once a 2G/3G ping is detected.
  * Local peer-to-peer sharing via Wi-Fi Direct or Bluetooth Low Energy (BLE) mesh before uplink to cloud.

### Multiplier 2: "Edge AI / Client-Side Quantization" (Zero-Cloud Cost)
* **The Problem:** If 100,000 citizens use your app and every click sends an image/audio to a cloud GPU or commercial API, the Ministry's cloud bill will explode.
* **The Winning Architecture:**
  * Quantize models into **INT8 / ONNX format** or compile into **WebAssembly (WASM) / WebGPU**.
  * Run the model directly in the browser or mobile CPU in $<50\text{ ms}$ with zero server round-trip.
  * Use self-hosted, open-weight Small Language Models (SLMs) such as Microsoft Phi-3-Mini, Qwen2.5-Coder, or MobileNetV4.

### Multiplier 3: "India Stack & Indigenous Public Infrastructure Hooks"
* **The Winning Architecture:**
  * **Bhashini Integration:** Multi-dialect voice-in, voice-out in 22 regional Indian languages (allows illiterate or semi-literate rural operators to speak rather than type).
  * **DigiLocker / Aadhaar XML:** Native verification of certificates, identity, and land records without paper document uploads.
  * **Open Network for Digital Commerce (ONDC) / Beckn Protocol:** For any supply chain or market access problem.

### Multiplier 4: "Verifiable Cryptographic Auditability (Lightweight Provenance)"
* **The Problem:** Corruption, backdated entries, and manual doctoring of government records.
* **The Winning Architecture:**
  * Avoid heavy, energy-draining proof-of-work blockchains.
  * Implement an append-only **Merkle Tree log** or lightweight verifiable ledger (similar to Google Trillian or Git commit trees).
  * Every transaction/report produces a SHA-256 cryptographic receipt that any auditor can verify mathematically in offline mode.

### Multiplier 5: "Explainable & Auditable Decision Engines"
* **The Problem:** Black-box neural networks cannot be used for government welfare allocation or penalty issuance because officials face legal scrutiny.
* **The Winning Architecture:**
  * Combine ML scoring with a transparent **Rule-Based Heuristic Safety Net**.
  * Provide **SHAP / LIME feature attribution scores** showing exactly why an alert or priority was assigned (e.g., *"Flagged as High Risk due to +42% deviation in water turbidity and consecutive missing inspections"*).

### Multiplier 6: "Defence-Grade Embedded AI & Passive Sensor Autonomy" *(Critical for PS-26126)*
* **The Problem:** Defence PSU evaluators (BEL, DRDO, HAL scientists) are deeply skeptical of any solution that:
  * Requires cloud connectivity (eliminates air-gapped battlefield scenarios),
  * Uses active sensors like LiDAR (detectable by enemy EW / NVD systems),
  * Cannot explain its navigation decisions (black-box rejection risk),
  * Relies on GPS/GNSS (trivially jammed in any modern conflict zone).
* **The Winning Architecture:**
  * **Zero-Emission Passive Navigation:** Stereo cameras + IMU only. No radar, no LiDAR, no GPS. Completely passive — zero electromagnetic or photonic signature.
  * **Knowledge Distillation for Edge Deployment:** Train a large teacher model (DINOv2, ViT) offline on rich datasets; distill into a lightweight INT8/FP16 student model (BiSeNetV2, Fast-SCNN) deployable at $>30\text{ FPS}$ on $<15\text{W}$ embedded hardware (Jetson Orin Nano / RK3588).
  * **Geometric Safety Nets:** Combine learned semantic traversability with deterministic geometric algorithms (ground plane fitting, negative obstacle raycasting). This gives an **explainable, rule-based safety layer** that BEL engineers can inspect and certify — unlike pure neural black boxes.
  * **Kinodynamic Vehicle Constraints:** All motion planning enforces physical vehicle limits (tip-over angles, slip dynamics, CAN Bus actuator limits), preventing model-in-loop simulation accidents when interfacing with real hardware.

---


## 5. The Official 5-Slide SIH Idea PPT Blueprint

*Use this exact slide-by-slide copy framework when preparing your final PowerPoint submission:*

### 📌 Slide 1: Cover Page & Team Identity
```
[PROJECT ACRONYM / BRAND NAME]: [Crisp One-Line Technological Subtitle]
Problem Statement ID: [e.g. SIH26XXX] | Category: Software
Ministry / Department: [e.g., Ministry of Agriculture & Farmers Welfare]

Team Name: [Your Team Name]
College: [Your College Name & City]
Team Leader: [Name, Contact, Email]
```

### 📌 Slide 2: Problem Understanding & Domain Failure Modes
* **Operational Bottleneck:** Quantified breakdown of the current pain point (e.g., *"Over 62% of field grievance reports in rural districts are delayed by 18+ days due to manual paper triage and lack of offline capture"*).
* **Root-Cause Analysis:** Why previous portals failed (unreliable network dependency, rigid desktop UIs, lack of localized language support, disconnected data silos).
* **Affected Stakeholders:** Field enumerators, district supervisory officers, and the general public.

### 📌 Slide 3: Proposed Solution & Core Innovation
* **System Concept (2-3 sentences):** An end-to-end, edge-intelligent platform delivering automated capture, offline synchronization, and deterministic verification.
* **Key Innovations:**
  1. *Innovation 1:* [e.g., Offline-first CRDT synchronization engine for zero-connectivity zones].
  2. *Innovation 2:* [e.g., On-device INT8 quantized vision model for real-time anomaly detection with zero cloud inference cost].
  3. *Innovation 3:* [e.g., Multilingual voice interface powered by indigenous Bhashini models].
* **Competitive Edge Table:**
  * Existing System: High latency, cloud dependency, English-only, manual verification.
  * Our Solution: Sub-second response, 100% offline capable, 22 Indian languages, automated cryptographic audit.

### 📌 Slide 4: System Architecture & Engineering Flow
* **Visual Architecture Diagram (4 Tiers):**
  * *Tier 1 (Client):* PWA / Flutter mobile client + SQLite offline cache + WebAssembly engine.
  * *Tier 2 (Gateway):* FastAPI / Go reverse-proxied with Nginx, JWT auth, and Redis queue.
  * *Tier 3 (Intelligence):* On-premise quantized AI engine + pgvector RAG for government manuals.
  * *Tier 4 (Persistence):* PostgreSQL relational store + MinIO S3 object store.
* **Step-by-Step Data Flow:** Clear numbered sequence ($1 \rightarrow 2 \rightarrow 3 \rightarrow 4 \rightarrow 5$) from field input to ministry executive dashboard.

### 📌 Slide 5: Feasibility, Tech Stack & Quantified Impact
* **Technology Stack:**
  * *Frontend:* Flutter / Next.js / Tailwind CSS / WebAssembly
  * *Backend:* FastAPI / Go / Redis / Celery
  * *AI/Edge:* ONNX Runtime / PyTorch / Bhashini API
  * *Database:* PostgreSQL (TimescaleDB / pgvector) / MinIO
* **Financial & Infrastructure Feasibility:**
  * 100% open-source software stack with zero recurring proprietary licensing fees.
  * Deployable on sovereign MeghRaj government cloud or local district on-premise servers.
* **Measurable ROI Impact:**
  * $\downarrow 75\%$ reduction in processing turnaround time.
  * $0$ recurring cloud GPU inference cost via edge quantization.
  * $100\%$ operational uptime during zero-connectivity network blackouts.

### 📌 Slide 6: References, Attachments & Supporting Evidence
* **Academic References:** Key papers, datasets, and published benchmarks that underpin your technical claims. For PS-26126 (BEL UGV), this includes RELLIS-3D (ICRA 2021), OpenVINS (ICRA 2020), BiSeNetV2 (IJCV 2021), STEPP/DINOv2 (ICRA 2025), MASt3R (ECCV 2024).
* **Demo Video Link:** A 2-minute YouTube or Google Drive-hosted screen recording of your live Gazebo simulation — semantic overlay, VIO drift counter, negative ditch avoidance, TEB trajectory spline.
* **Repository Link:** GitHub URL to the public repository containing ROS 2 source packages, model weights, Gazebo world files, and inference benchmarks.
* **Architecture Poster / One-Pager:** High-resolution PDF architecture diagram and project one-pager suitable for jury review (include Google Drive link).

> **⚠️ IMPORTANT NOTE (PS-26126 Specific):** Slide 6 for a Defence / Robotics problem statement should NOT be a generic team bio slide. BEL jurors expect technical citations and live demo evidence. A working Gazebo demo video with real telemetry metrics (FPS, power draw, drift %) is worth more than any team bio slide.

---

## 6. Checklist: Before You Hit "Submit" on the Portal

### General Checklist
- [ ] **Exact PS ID & Title Match:** Does Slide 1 match the official SIH portal character-for-character?
- [ ] **No Generic Web Wrapper:** Does the proposal contain at least 2 Innovation Multipliers from Section 4?
- [ ] **High-Resolution Vector Architecture:** Is your architecture diagram crisp, professional, and clear even when scaled to full screen?
- [ ] **Quantified Impact:** Have you replaced all vague words (*"better"*, *"faster"*, *"efficient"*) with exact percentages and time savings?
- [ ] **Slide 6 = References & Demo Links:** Not a team bio. Include GitHub repo link, demo video link, and key academic citations.
- [ ] **Team Gender Diversity Rule Verified:** Does your 6-member team fulfill the mandatory SIH criterion (at least 1 female team member)?

### PS-26126 (BEL UGV) — Defence-Specific Checklist
- [ ] **Zero GPS Dependency Demonstrated:** Can your live demo run in complete GNSS blackout with VIO alone?
- [ ] **Passive Sensor Only:** Does your submission explicitly state that NO LiDAR, NO radar, and NO active illuminator is used?
- [ ] **Negative Obstacle Addressed:** Does your Slide 2 explicitly name trenches, ditches, and craters as a problem solved by your system?
- [ ] **Tall Grass / Pliant Vegetation Addressed:** Does your submission explain how your system distinguishes drive-through vegetation from rigid walls?
- [ ] **Edge Power Budget Stated:** Is your total inference power draw ($<15\text{W}$) explicitly called out in Slide 5?
- [ ] **Air-Gapped Architecture Stated:** Does your Slide 4 explicitly mention zero cloud dependency and zero external network calls?
- [ ] **Live Gazebo Demo Ready:** Is your simulation environment set up with at minimum: tall grass trail, rocky incline, hidden ditch, lighting transition, and pop-up obstacle?
- [ ] **Kinodynamic Constraints Included:** Does your motion planner include explicit roll/pitch tip-over prevention?
- [ ] **RELLIS-3D Training Confirmed:** Is your traversability model trained on real off-road dataset (not just synthetic data or urban Cityscapes)?
- [ ] **Benchmark Cited:** Have you cited drift metrics (ATE, RPE) vs. ground truth on a publicly recognized benchmark (KITTI, TartanAir, or Gazebo GT)?

