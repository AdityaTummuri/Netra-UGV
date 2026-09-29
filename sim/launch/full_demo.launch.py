import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import ExecuteProcess
from launch_ros.actions import Node

def generate_launch_description():
    pkg_sim = get_package_share_directory('sim')
    world_path = os.path.join(pkg_sim, 'worlds', 'tactical_obstacle.world')
    urdf_path = os.path.join(pkg_sim, 'models', 'ugv_skidsteer', 'ugv_skidsteer.urdf')
    with open(urdf_path, 'r') as f:
        robot_desc = f.read()

    gz_sim = ExecuteProcess(
        cmd=['gz', 'sim', '-r', world_path],
        output='screen'
    )

    spawn_robot = Node(
        package='ros_gz_sim',
        executable='create',
        arguments=['-topic', 'robot_description', '-name', 'netra_ugv', '-z', '0.2'],
        output='screen'
    )

    rsp_node = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        parameters=[{'robot_description': robot_desc, 'use_sim_time': True}],
        output='screen'
    )

    bridge_node = Node(
        package='ros_gz_bridge',
        executable='parameter_bridge',
        parameters=[{'config_file': os.path.join(pkg_sim, 'config', 'gz_bridge.yaml')}],
        output='screen'
    )

    return LaunchDescription([
        gz_sim,
        spawn_robot,
        rsp_node,
        bridge_node,
    ])
