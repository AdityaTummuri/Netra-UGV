# 🛰️ NETRA-UGV Simulation Subsystem (`sim/`)

Gazebo Garden / Harmonic & ROS 2 Humble tactical simulation environment for NETRA-UGV.

## 🚀 Quickstart

```bash
# 1. Source ROS 2 Humble
source /opt/ros/humble/setup.bash

# 2. Build the workspace
colcon build --packages-select sim --symlink-install
source install/setup.bash

# 3. Launch the full tactical obstacle world and robot
ros2 launch sim full_demo.launch.py
```
