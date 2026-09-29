# 🧠 NETRA-UGV Model Weights & Artifacts (`weights/`)

This directory contains the trained weights, exported ONNX models, compilation scripts, and verification artifacts for the **BiSeNetV2** off-road terrain semantic segmentation neural network.

---

## 1. Directory Structure

```
weights/
├── README.md                          # Model provenance, checksums, and architecture specs
├── bisenetv2_rellis_best.pth          # Trained PyTorch checkpoint (Validation mIoU: 76.25%)
├── bisenetv2_rellis.onnx              # Optimized ONNX model (opset 17, 1024x448 RGB)
├── bisenetv2_rellis_int8.trt          # Serialized TensorRT INT8 engine / validation stub
├── dataset_sample_verification.png    # Pre-training multi-sample dataset audit image
├── test_segmentation_mask.png         # ONNX inference colorized segmentation output
├── test_segmentation_overlay.png      # ONNX inference 50/50 visual overlay
└── scripts/
    ├── generate_stub.py               # Generates placeholder stub for non-Jetson/CPU testing
    ├── export_onnx.py                 # PyTorch (.pth) -> ONNX graph export (448x1024)
    ├── calibrate_int8.py              # TensorRT IInt8EntropyCalibrator2 generator
    ├── build_trt_engine.sh            # trtexec compilation script for NVIDIA Jetson Orin Nano
    └── download_dataset_sample.sh     # Downloads / stages calibration frames from RELLIS-3D
```

---

## 2. Model Specifications & Checksums

| Artifact | Size | SHA-256 Checksum | Target Platform |
| :--- | :---: | :--- | :--- |
| **`bisenetv2_rellis.onnx`** | 8.79 MB | `01292717e549416361beee6fa49ab0a70632faedaa19d25cb1f02156dc13fc28` | Cross-platform (ONNX Runtime / TensorRT) |
| **`bisenetv2_rellis_best.pth`** | 29.59 MB | `2008d80f724895e044964cd530c4ff796fb73087400bff0d03f1a548389d67e0` | PyTorch training / fine-tuning |
| **`bisenetv2_rellis_int8.trt`** | Variable | Dynamic compilation via `trtexec` per target GPU | NVIDIA Jetson Orin Nano (Ampere) |

---

## 3. Architecture & Tactical Classes

* **Backbone:** BiSeNetV2 (Bilateral Segmentation Network v2)
* **Parameter Count:** ~2.31M parameters
* **Input Tensor:** `input_rgb` $\rightarrow [1, 3, 448, 1024]$ float32 (ImageNet normalized)
* **Output Tensor:** `output_mask` $\rightarrow [1, 4, 448, 1024]$ float32 logits
* **Output Classes:**
  * `0: SOLID_GROUND` (Soil, gravel, asphalt, packed track)
  * `1: PLIANT_VEGETATION` (Grass, brush)
  * `2: MUD_HAZARD` (Wet mud, marsh, puddles)
  * `3: RIGID_OBSTACLE` (Trees, rocks, barriers, buildings, vehicles)
* **Dataset:** RELLIS-3D (5,957 keyframe image-mask pairs across 5 sequences)
* **Best Validation Metric:** **76.25% mIoU** across all 4 tactical classes

---

## 4. Verification Checklist

- [x] Trained checkpoint achieves high mIoU on the 4 NETRA classes.
- [x] ONNX model exported with input shape `(1, 3, 448, 1024)`.
- [x] ONNX Runtime numerical equivalence verified against PyTorch (`< 1e-4` max difference).
- [x] Standalone test script runs on RELLIS camera frames in ~14 ms on RTX 4050 (`CUDAExecutionProvider`).
- [x] ROS 2 perception pipeline (`netra_perception`) seamlessly loads and runs the model.
- [x] TensorRT engine builder script and placeholder stub created for deployment.
