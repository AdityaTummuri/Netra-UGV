# Geometrically validated negative obstacle (ditch / crater) alert
# Published by: netra_perception (Bayesian filter) at up to 50 Hz
# Consumed by:  netra_mapping (barrier injector)

std_msgs/Header header

bool hazard_detected                    # True if confirmed by Bayesian accumulator
geometry_msgs/Point32 edge_start_point  # Left front lip coordinate in base_link (meters)
geometry_msgs/Point32 edge_end_point    # Right front lip coordinate in base_link (meters)
float32 estimated_drop_depth            # Estimated step drop Delta-Z (meters)
float32 bayesian_log_odds               # Log-odds confidence value (> 3.5 = committed barrier)
uint32 consecutive_frame_hits           # Number of frames depression verified (>= 3)
