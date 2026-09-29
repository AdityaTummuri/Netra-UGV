# Authenticated actuation command for CAN-FD bus
# Published by: netra_planning at 20 Hz
# Consumed by:  netra_security (secoc_can_driver)

std_msgs/Header header

float32 linear_velocity_x       # Target forward velocity (-1.5 to +1.5 m/s)
float32 angular_velocity_z      # Target yaw velocity (-2.0 to +2.0 rad/s)
uint32 freshness_counter        # Monotonically incrementing anti-replay integer
uint8[8] aes_cmac               # Truncated 64-bit AES-128 Message Authentication Code
