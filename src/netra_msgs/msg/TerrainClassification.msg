# High-frequency semantic terrain surface mask
# Published by: netra_perception at 15 Hz
# Consumed by:  netra_mapping (costmap fusion), netra_planning (speed governor)

std_msgs/Header header

uint8 SOLID_GROUND=0       # Dry soil, gravel, packed track (Full speed)
uint8 PLIANT_VEGETATION=1  # Grass, brush (Speed governed to <= 0.5 m/s)
uint8 MUD_HAZARD=2         # Wet clay, marsh (High slip traction warning)
uint8 RIGID_OBSTACLE=3     # Rocks, trees, concrete walls (Hard barrier)

uint8[] semantic_mask      # 1D row-major array of classification indices
uint32 width               # Cropped ROI width (typically 1024)
uint32 height              # Cropped ROI height (typically 448)
float32 mean_confidence    # Statistical certainty score [0.0 - 1.0]
