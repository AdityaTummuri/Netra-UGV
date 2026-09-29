Netra UGV - Webots project (Webots R2025a)
Open worlds/netra_tactical.wbt in Webots. Click the 3D view, then:
  T = tamper (zeroize keys)   S = spoofed CAN-style command   R = re-provision
Robot: Pioneer 3-AT (stock Webots PROTO) + GPS, IMU, gyro, accelerometer, camera, 2 lidars.
Terrain: 50x36 m elevation grid with hills, 4 ditches (negative obstacles), 28 rocks. Goal = yellow disc.
gen_world.py regenerates the world (change seed / counts). Untested inside Webots here - tune thresholds in the controller.
