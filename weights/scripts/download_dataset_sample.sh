#!/usr/bin/env bash
# ==============================================================================
# Helper to stage calibration frames from RELLIS-3D dataset
# Reference: docs/WEIGHTS_AND_MODELS_GUIDE.md §1
# ==============================================================================
set -e

CALIB_DIR="./calib_frames"
mkdir -p "${CALIB_DIR}"

echo "Staging calibration frames into ${CALIB_DIR}..."
echo "Ensure RELLIS-3D dataset is mounted or sample frames are provided."
