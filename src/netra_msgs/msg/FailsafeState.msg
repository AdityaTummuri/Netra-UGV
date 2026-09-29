# Deterministic health and limp-home mode status
# Published by: netra_planning (failsafe_manager) at 10 Hz
# Consumed by:  netra_planning (planner_node), netra_security (tamper_monitor)

std_msgs/Header header

uint8 MODE_NOMINAL=0          # Level 0: 100% Visual-Inertial Autonomous
uint8 MODE_VISION_DEGRADED=1  # Level 1: Sun Glare / Dust Washout (Speed Capped)
uint8 MODE_VISION_CRITICAL=2  # Level 2: Mud / Thick Smoke (Inertial Limp-to-Halt)
uint8 MODE_SECURITY_TAMPER=3  # Level 3: Hull Breach Detected (Hardware Zeroized)

uint8 current_mode
float32 camera_lens_obscuration # Percentage [0.0 - 1.0]
float32 v_max_allowed           # Dynamically clamped vehicle velocity (m/s)
bool air_purge_firing           # Status of optical cleaning nozzle
bool zeroization_engaged        # Status of cryptographic crowbar circuit
