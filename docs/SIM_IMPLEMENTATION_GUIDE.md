# 🛰️ NETRA-UGV Simulation Subsystem (`sim/`) Implementation Guide
### Complete Engineering Blueprint for Gazebo Garden / Harmonic & ROS 2 Humble
**Target Audience:** Teammate / Robotics Simulation Engineer  
**Objective:** Build the tactical simulation environment (`sim/`) from scratch to validate the complete NETRA-UGV autonomous stack under harsh off-road conditions (ditches, tall grass, rough boulders, and GPS-denied environments).

---

## 1. Directory Tree & Architecture Overview

The teammate will create the `sim/` folder in the repository root with the following layout:

```
sim/
├── README.md                          # Quickstart instructions for running simulation
├── package.xml                        # ROS 2 package definition for simulation assets
├── CMakeLists.txt                     # CMake install rules for models, worlds, and launch
├── models/
│   └── ugv_skidsteer/
│       ├── model.config               # Gazebo model metadata
│       ├── model.sdf                  # Gazebo SDF 1.9 tactical UGV definition
│       └── ugv_skidsteer.urdf         # ROS 2 URDF with transmission & sensor frames
├── worlds/
│   └── tactical_obstacle.world        # Tactical off-road world (ditches, rocks, tall brush)
├── config/
│   ├── gz_bridge.yaml                 # ros_gz_bridge topic mapping configuration
│   └── rviz_config.rviz               # Pre-configured RViz2 display layout
└── launch/
    ├── spawn_robot.launch.py          # Robot state publisher & Gazebo spawner
    └── full_demo.launch.py            # Master end-to-end launch: Gazebo + ROS 2 Stack + RViz
```

---

## 2. Tactical Chassis Specification (`ugv_skidsteer.urdf`)

The virtual UGV matches the physical tactical chassis described in `MASTER_PROJECT_REPORT.md §5`:
- **Chassis Dimensions:** Length $0.75\text{ m}$, Width $0.50\text{ m}$, Height $0.25\text{ m}$.
- **Mass:** Total chassis mass $\approx 45.0\text{ kg}$ (conduction-cooled electronics + 200Wh LiFePO4 battery pack).
- **Drive Kinematics:** 4-wheel skid-steer differential drive ($r_{\text{wheel}} = 0.165\text{ m}$, wheelbase $L = 0.65\text{ m}$, track width $W = 0.60\text{ m}$).
- **Sensors Rig:**
  - **Stereo Camera (Luxonis OAK-D baseline $128\text{ mm}$):** Mounted at $x = +0.35\text{ m}$ (forward nose), $z = +0.30\text{ m}$, with a fixed **$5^\circ$ downward pitch** ($\approx 0.087\text{ rad}$) to focus ground-ROI on the forward obstacle zone.
  - **Tactical IMU (TDK ICM-42688-P):** Mounted at the geometric center of mass ($x = 0.0\text{ m}, y = 0.0\text{ m}, z = 0.05\text{ m}$) publishing high-rate acceleration and angular velocity.

### Complete URDF Template (`sim/models/ugv_skidsteer/ugv_skidsteer.urdf`)

```xml
<?xml version="1.0"?>
<robot name="netra_ugv">

  <!-- ================= BASE FOOTPRINT & CHASSIS ================= -->
  <link name="base_footprint"/>

  <joint name="base_footprint_joint" type="fixed">
    <parent link="base_footprint"/>
    <child link="base_link"/>
    <origin xyz="0 0 0.165" rpy="0 0 0"/>
  </joint>

  <link name="base_link">
    <inertial>
      <mass value="45.0"/>
      <origin xyz="0 0 0.05" rpy="0 0 0"/>
      <inertia ixx="0.9375" ixy="0.0" ixz="0.0"
               iyy="2.3437" iyz="0.0"
               izz="2.8125"/>
    </inertial>
    <visual>
      <origin xyz="0 0 0.05" rpy="0 0 0"/>
      <geometry>
        <box size="0.75 0.50 0.25"/>
      </geometry>
      <material name="matte_olive">
        <color rgba="0.25 0.30 0.20 1.0"/>
      </material>
    </visual>
    <collision>
      <origin xyz="0 0 0.05" rpy="0 0 0"/>
      <geometry>
        <box size="0.75 0.50 0.25"/>
      </geometry>
    </collision>
  </link>

  <!-- ================= 4 SKID-STEER WHEELS ================= -->
  <!-- Wheel macro helper -->
  <!-- Front-Left: x=+0.325, y=+0.30 | Front-Right: x=+0.325, y=-0.30 -->
  <!-- Rear-Left:  x=-0.325, y=+0.30 | Rear-Right:  x=-0.325, y=-0.30 -->

  <link name="front_left_wheel">
    <inertial>
      <mass value="4.0"/>
      <origin xyz="0 0 0" rpy="0 0 0"/>
      <inertia ixx="0.030" ixy="0" ixz="0" iyy="0.054" iyz="0" izz="0.030"/>
    </inertial>
    <visual>
      <origin xyz="0 0 0" rpy="1.570796 0 0"/>
      <geometry>
        <cylinder radius="0.165" length="0.10"/>
      </geometry>
      <material name="tire_rubber"><color rgba="0.1 0.1 0.1 1.0"/></material>
    </visual>
    <collision>
      <origin xyz="0 0 0" rpy="1.570796 0 0"/>
      <geometry>
        <cylinder radius="0.165" length="0.10"/>
      </geometry>
    </collision>
  </link>
  <joint name="front_left_wheel_joint" type="continuous">
    <parent link="base_link"/>
    <child link="front_left_wheel"/>
    <origin xyz="0.325 0.30 0" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
  </joint>

  <link name="front_right_wheel">
    <inertial>
      <mass value="4.0"/>
      <origin xyz="0 0 0" rpy="0 0 0"/>
      <inertia ixx="0.030" ixy="0" ixz="0" iyy="0.054" iyz="0" izz="0.030"/>
    </inertial>
    <visual>
      <origin xyz="0 0 0" rpy="1.570796 0 0"/>
      <geometry>
        <cylinder radius="0.165" length="0.10"/>
      </geometry>
      <material name="tire_rubber"><color rgba="0.1 0.1 0.1 1.0"/></material>
    </visual>
    <collision>
      <origin xyz="0 0 0" rpy="1.570796 0 0"/>
      <geometry>
        <cylinder radius="0.165" length="0.10"/>
      </geometry>
    </collision>
  </link>
  <joint name="front_right_wheel_joint" type="continuous">
    <parent link="base_link"/>
    <child link="front_right_wheel"/>
    <origin xyz="0.325 -0.30 0" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
  </joint>

  <link name="rear_left_wheel">
    <inertial>
      <mass value="4.0"/>
      <origin xyz="0 0 0" rpy="0 0 0"/>
      <inertia ixx="0.030" ixy="0" ixz="0" iyy="0.054" iyz="0" izz="0.030"/>
    </inertial>
    <visual>
      <origin xyz="0 0 0" rpy="1.570796 0 0"/>
      <geometry>
        <cylinder radius="0.165" length="0.10"/>
      </geometry>
      <material name="tire_rubber"><color rgba="0.1 0.1 0.1 1.0"/></material>
    </visual>
    <collision>
      <origin xyz="0 0 0" rpy="1.570796 0 0"/>
      <geometry>
        <cylinder radius="0.165" length="0.10"/>
      </geometry>
    </collision>
  </link>
  <joint name="rear_left_wheel_joint" type="continuous">
    <parent link="base_link"/>
    <child link="rear_left_wheel"/>
    <origin xyz="-0.325 0.30 0" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
  </joint>

  <link name="rear_right_wheel">
    <inertial>
      <mass value="4.0"/>
      <origin xyz="0 0 0" rpy="0 0 0"/>
      <inertia ixx="0.030" ixy="0" ixz="0" iyy="0.054" iyz="0" izz="0.030"/>
    </inertial>
    <visual>
      <origin xyz="0 0 0" rpy="1.570796 0 0"/>
      <geometry>
        <cylinder radius="0.165" length="0.10"/>
      </geometry>
      <material name="tire_rubber"><color rgba="0.1 0.1 0.1 1.0"/></material>
    </visual>
    <collision>
      <origin xyz="0 0 0" rpy="1.570796 0 0"/>
      <geometry>
        <cylinder radius="0.165" length="0.10"/>
      </geometry>
    </collision>
  </link>
  <joint name="rear_right_wheel_joint" type="continuous">
    <parent link="base_link"/>
    <child link="rear_right_wheel"/>
    <origin xyz="-0.325 -0.30 0" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
  </joint>

  <!-- ================= SENSORS ================= -->
  <!-- 1. IMU: ICM-42688-P Tactical IMU -->
  <link name="imu_link"/>
  <joint name="imu_joint" type="fixed">
    <parent link="base_link"/>
    <child link="imu_link"/>
    <origin xyz="0 0 0.05" rpy="0 0 0"/>
  </joint>

  <!-- 2. Stereo Camera: Luxonis OAK-D (5 deg pitch down) -->
  <link name="camera_link"/>
  <joint name="camera_joint" type="fixed">
    <parent link="base_link"/>
    <child link="camera_link"/>
    <origin xyz="0.35 0 0.30" rpy="0 0.087266 0"/>
  </joint>

  <link name="camera_optical_frame"/>
  <joint name="camera_optical_joint" type="fixed">
    <parent link="camera_link"/>
    <child link="camera_optical_frame"/>
    <origin xyz="0 0 0" rpy="-1.570796 0 -1.570796"/>
  </joint>

  <!-- ================= GAZEBO SENSORS & PLUGINS ================= -->
  <gazebo reference="imu_link">
    <sensor name="netra_imu" type="imu">
      <always_on>true</always_on>
      <update_rate>500</update_rate>
      <topic>/imu/data</topic>
      <imu>
        <angular_velocity>
          <x><noise type="gaussian"><mean>0.0</mean><stddev>0.0002</stddev></noise></x>
          <y><noise type="gaussian"><mean>0.0</mean><stddev>0.0002</stddev></noise></x>
          <z><noise type="gaussian"><mean>0.0</mean><stddev>0.0002</stddev></noise></z>
        </angular_velocity>
        <linear_acceleration>
          <x><noise type="gaussian"><mean>0.0</mean><stddev>0.002</stddev></noise></x>
          <y><noise type="gaussian"><mean>0.0</mean><stddev>0.002</stddev></noise></x>
          <z><noise type="gaussian"><mean>0.0</mean><stddev>0.002</stddev></noise></z>
        </linear_acceleration>
      </imu>
    </sensor>
  </gazebo>

  <gazebo reference="camera_link">
    <sensor name="netra_stereo_camera" type="depth_camera">
      <update_rate>30</update_rate>
      <always_on>true</always_on>
      <topic>/camera</topic>
      <camera>
        <horizontal_fov>1.274</horizontal_fov> <!-- 73 deg HFOV -->
        <image>
          <width>1280</width>
          <height>720</height>
          <format>R8G8B8</format>
        </image>
        <clip>
          <near>0.3</near>
          <far>20.0</far>
        </clip>
      </camera>
    </sensor>
  </gazebo>

  <!-- Skid-Steer / Diff Drive plugin -->
  <gazebo>
    <plugin filename="gz-sim-diff-drive-system" name="gz::sim::systems::DiffDrive">
      <left_joint>front_left_wheel_joint</left_joint>
      <left_joint>rear_left_wheel_joint</left_joint>
      <right_joint>front_right_wheel_joint</right_joint>
      <right_joint>rear_right_wheel_joint</right_joint>
      <wheel_separation>0.60</wheel_separation>
      <wheel_radius>0.165</wheel_radius>
      <max_linear_acceleration>2.0</max_linear_acceleration>
      <max_angular_acceleration>3.0</max_angular_acceleration>
      <topic>/cmd_vel</topic>
      <odom_topic>/odom_ground_truth</odom_topic>
      <frame_id>odom</frame_id>
      <child_frame_id>base_footprint</child_frame_id>
    </plugin>
  </gazebo>

</robot>
```

---

## 3. Tactical Obstacle World (`sim/worlds/tactical_obstacle.world`)

The simulation world must challenge the NETRA algorithms with realistic battlefield conditions:
1. **Negative Obstacle (Ditch/Trench):** A trench $0.5\text{ m}$ deep, $1.2\text{ m}$ wide, and $5.0\text{ m}$ long crossing the path at $x = +6.0\text{ m}$. This evaluates the $v$-disparity raycaster and Bayesian log-odds commit filter.
2. **Pliant Vegetation Patch:** A field of tall grass ($0.6\text{ m}$ height) covering $x \in [10.0, 14.0]\text{ m}$. It has collision set to non-blocking so the UGV can drive through, triggering the Speed Governor's $v \le 0.5\text{ m/s}$ clamp.
3. **Rigid Rock Boulders:** Granite obstacles of diameters $0.4\text{ m}$ and $0.8\text{ m}$ placed along the corridor to test TEB local obstacle avoidance.
4. **Mud Hazard Zone:** Low-friction surface patch ($\mu = 0.25$) at $x \in [16.0, 20.0]\text{ m}$ to test mud slip governing.
5. **Directional Sun Lighting:** Positioned at an oblique $30^\circ$ elevation angle to generate long shadows and direct lens glare, exercising the Ground-Horizon ROI dynamic crop and auto-exposure recovery.

### World SDF Template (`sim/worlds/tactical_obstacle.world`)

```xml
<?xml version="1.0" ?>
<sdf version="1.9">
  <world name="tactical_obstacle_world">
    <physics name="1ms" type="ignored">
      <max_step_size>0.002</max_step_size> <!-- 500 Hz physics for IMU fidelity -->
      <real_time_factor>1.0</real_time_factor>
    </physics>

    <!-- Environment Plugins -->
    <plugin filename="gz-sim-physics-system" name="gz::sim::systems::Physics"/>
    <plugin filename="gz-sim-user-commands-system" name="gz::sim::systems::UserCommands"/>
    <plugin filename="gz-sim-scene-broadcaster-system" name="gz::sim::systems::SceneBroadcaster"/>
    <plugin filename="gz-sim-sensors-system" name="gz::sim::systems::Sensors">
      <render_engine>ogre2</render_engine>
    </plugin>

    <!-- Harsh Tactical Sun Lighting -->
    <light type="directional" name="sun">
      <cast_shadows>true</cast_shadows>
      <pose>0 0 15 0.523 0.261 0</pose>
      <diffuse>0.9 0.85 0.75 1</diffuse>
      <specular>0.3 0.3 0.3 1</specular>
      <direction>-0.5 0.2 -1.0</direction>
    </light>

    <!-- Base Ground Plane (Rough Dirt) -->
    <model name="ground_plane">
      <static>true</static>
      <link name="link">
        <collision name="collision">
          <geometry><plane><normal>0 0 1</normal><size>100 100</size></plane></geometry>
          <surface><friction><ode><mu>0.8</mu><mu2>0.8</mu2></ode></friction></surface>
        </collision>
        <visual name="visual">
          <geometry><plane><normal>0 0 1</normal><size>100 100</size></plane></geometry>
          <material>
            <ambient>0.4 0.35 0.25 1</ambient>
            <diffuse>0.5 0.45 0.35 1</diffuse>
          </material>
        </visual>
      </link>
    </model>

    <!-- ================= NEGATIVE OBSTACLE: TACTICAL DITCH ================= -->
    <!-- Modeled as ground depression at x = 6.0m, width = 1.2m, depth = 0.5m -->
    <model name="tactical_ditch_drop">
      <static>true</static>
      <pose>6.0 0 -0.25 0 0 0</pose>
      <link name="ditch_bottom">
        <collision name="col">
          <geometry><box><size>1.2 5.0 0.5</size></box></geometry>
        </collision>
        <visual name="vis">
          <geometry><box><size>1.2 5.0 0.5</size></box></geometry>
          <material><ambient>0.2 0.15 0.1 1</ambient><diffuse>0.25 0.2 0.15 1</diffuse></material>
        </visual>
      </link>
    </model>

    <!-- ================= RIGID BOULDERS ================= -->
    <model name="boulder_1">
      <static>true</static>
      <pose>3.5 0.8 0.25 0 0 0.4</pose>
      <link name="link">
        <collision name="col"><geometry><sphere><radius>0.40</radius></sphere></geometry></collision>
        <visual name="vis">
          <geometry><sphere><radius>0.40</radius></sphere></geometry>
          <material><ambient>0.3 0.3 0.32 1</ambient><diffuse>0.4 0.4 0.42 1</diffuse></material>
        </visual>
      </link>
    </model>

    <!-- ================= PLIANT TALL VEGETATION FIELD ================= -->
    <model name="brush_field">
      <static>true</static>
      <pose>12.0 0 0.30 0 0 0</pose>
      <link name="link">
        <!-- Visual only: no collision so UGV can traverse, testing brush governor -->
        <visual name="vis">
          <geometry><box><size>4.0 6.0 0.60</size></box></geometry>
          <material><ambient>0.2 0.5 0.15 0.8</ambient><diffuse>0.25 0.6 0.2 0.8</diffuse></material>
        </visual>
      </link>
    </model>

  </world>
</sdf>
```

---

## 4. Gazebo-to-ROS 2 Bridge (`sim/config/gz_bridge.yaml`)

Bridge definition linking Gazebo transport topics to ROS 2 Humble topics:

```yaml
# ros_gz_bridge topic mapping
- ros_topic_name: "/camera/image_raw"
  gz_topic_name: "/camera/image"
  ros_type_name: "sensor_msgs/msg/Image"
  gz_type_name: "gz.msgs.Image"
  direction: GZ_TO_ROS

- ros_topic_name: "/camera/depth"
  gz_topic_name: "/camera/depth_image"
  ros_type_name: "sensor_msgs/msg/Image"
  gz_type_name: "gz.msgs.Image"
  direction: GZ_TO_ROS

- ros_topic_name: "/imu/data"
  gz_topic_name: "/imu/data"
  ros_type_name: "sensor_msgs/msg/Imu"
  gz_type_name: "gz.msgs.IMU"
  direction: GZ_TO_ROS

- ros_topic_name: "/cmd_vel"
  gz_topic_name: "/cmd_vel"
  ros_type_name: "geometry_msgs/msg/Twist"
  gz_type_name: "gz.msgs.Twist"
  direction: ROS_TO_GZ
```

---

## 5. Master Launch Script (`sim/launch/full_demo.launch.py`)

This launch script runs the complete end-to-end mission:
1. Starts **Gazebo Garden/Harmonic** with `tactical_obstacle.world`.
2. Spawns `ugv_skidsteer` at origin $(0, 0, 0.2)$.
3. Starts `robot_state_publisher` for TF transforms (`base_link`, `camera_link`, `imu_link`).
4. Runs `ros_gz_bridge`.
5. Launches all 5 NETRA packages:
   - `netra_security/security_launch.py`
   - `netra_perception/perception_launch.py`
   - `netra_localization/localization_launch.py`
   - `netra_mapping/mapping_launch.py`
   - `netra_planning/planning_launch.py`
6. Opens **RViz2** with pre-configured costmap, pointcloud, and trajectory display.

### Launch Implementation Skeleton

```python
import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import ExecuteProcess, IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch_ros.actions import Node

def generate_launch_description():
    pkg_sim = get_package_share_directory('sim')
    
    # 1. World & Model paths
    world_path = os.path.join(pkg_sim, 'worlds', 'tactical_obstacle.world')
    urdf_path = os.path.join(pkg_sim, 'models', 'ugv_skidsteer', 'ugv_skidsteer.urdf')
    with open(urdf_path, 'r') as f:
        robot_desc = f.read()

    # 2. Gazebo Sim Process
    gz_sim = ExecuteProcess(
        cmd=['gz', 'sim', '-r', world_path],
        output='screen'
    )

    # 3. Spawn Robot in Gazebo
    spawn_robot = Node(
        package='ros_gz_sim',
        executable='create',
        arguments=['-topic', 'robot_description', '-name', 'netra_ugv', '-z', '0.2'],
        output='screen'
    )

    # 4. Robot State Publisher (TF)
    rsp_node = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        parameters=[{'robot_description': robot_desc, 'use_sim_time': True}],
        output='screen'
    )

    # 5. Topic Bridge
    bridge_node = Node(
        package='ros_gz_bridge',
        executable='parameter_bridge',
        parameters=[{'config_file': os.path.join(pkg_sim, 'config', 'gz_bridge.yaml')}],
        output='screen'
    )

    # 6. Include NETRA Autonomy Stack
    perception_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([get_package_share_directory('netra_perception'), '/launch/perception_launch.py'])
    )
    localization_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([get_package_share_directory('netra_localization'), '/launch/localization_launch.py'])
    )
    mapping_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([get_package_share_directory('netra_mapping'), '/launch/mapping_launch.py'])
    )
    planning_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([get_package_share_directory('netra_planning'), '/launch/planning_launch.py'])
    )
    security_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([get_package_share_directory('netra_security'), '/launch/security_launch.py'])
    )

    return LaunchDescription([
        gz_sim,
        spawn_robot,
        rsp_node,
        bridge_node,
        perception_launch,
        localization_launch,
        mapping_launch,
        planning_launch,
        security_launch,
    ])
```

---

## 6. How Your Teammates Should Test the Simulation

```bash
# 1. Install Gazebo Garden / Harmonic & Bridge on Ubuntu 22.04 / 24.04:
sudo apt-get install ros-humble-ros-gz-sim ros-humble-ros-gz-bridge ros-humble-robot-state-publisher

# 2. Build the workspace:
cd ~/Desktop/projects/SIH-2/Netra-UGV
colcon build --symlink-install

# 3. Source and Launch End-to-End Simulation:
source install/setup.bash
ros2 launch sim full_demo.launch.py

# 4. Send a navigation waypoint in another terminal:
ros2 topic pub --once /goal_pose geometry_msgs/msg/PoseStamped "{header: {frame_id: 'odom'}, pose: {position: {x: 10.0, y: 0.0, z: 0.0}}}"
```

**Verification Checklist for Teammate:**
- [ ] Robot model spawns upright without exploding or jittering.
- [ ] `/camera/image_raw` and `/imu/data` publish in `ros2 topic hz`.
- [ ] UGV stops or steers around the ditch at $x = 6.0\text{ m}$.
- [ ] Speed drops to $\le 0.5\text{ m/s}$ when traversing the brush patch at $x = 12.0\text{ m}$.
