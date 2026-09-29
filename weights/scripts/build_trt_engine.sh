#!/usr/bin/env bash
# ==============================================================================
# Compile BiSeNetV2 ONNX graph into TensorRT INT8 Engine on Jetson Orin Nano
# Reference: docs/WEIGHTS_AND_MODELS_GUIDE.md §3, Step 3
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ONNX_FILE="${SCRIPT_DIR}/../bisenetv2_rellis.onnx"
OUTPUT_ENGINE="${SCRIPT_DIR}/../bisenetv2_rellis_int8.trt"
CALIB_CACHE="${SCRIPT_DIR}/../bisenetv2_calibration.cache"

echo "Building TensorRT INT8 Engine on Jetson Orin Nano..."

/usr/src/tensorrt/bin/trtexec \
    --onnx="${ONNX_FILE}" \
    --saveEngine="${OUTPUT_ENGINE}" \
    --int8 \
    --calib="${CALIB_CACHE}" \
    --memPoolSize=workspace:1024MiB \
    --builderOptimizationLevel=5 \
    --useDLA=0 \
    --verbose

echo "========================================================"
echo "✓ TensorRT INT8 Engine successfully generated!"
echo "Target path: ${OUTPUT_ENGINE}"
echo "========================================================"
