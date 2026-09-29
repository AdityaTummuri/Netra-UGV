"""
Academic Figure 1: Stereo Triangulation Depth Error vs. Stopping Dynamics
Generated for SIH 26126 (NETRA-UGV / Bharat Electronics Limited)
Publication Standard: IEEE Transactions on Robotics / Nature
"""
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams.update({
    'font.family': 'serif',
    'font.serif': ['DejaVu Serif', 'Times New Roman', 'Liberation Serif'],
    'font.size': 11,
    'axes.labelsize': 12,
    'axes.titlesize': 13,
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'legend.fontsize': 9.5,
    'lines.linewidth': 2.0,
    'mathtext.fontset': 'dejavuserif',
    'figure.autolayout': True
})

fig, ax1 = plt.subplots(figsize=(9, 5.2), dpi=300)
fig.patch.set_facecolor('#ffffff')
ax1.set_facecolor('#ffffff')

# Forward distance Z: 1.0 to 12.0 meters
Z = np.linspace(1.0, 12.0, 400)
f_px = 800.0   # OAK-D focal length in pixels (approx 73 deg HFOV at 1280x720)
B_m = 0.128    # Baseline = 128 mm = 0.128 m
sigma_d = 0.5  # Sub-pixel disparity error in pixels

# Depth uncertainty in centimeters: sigma_Z = (Z^2 / (f * B)) * sigma_d * 100
sigma_Z_cm = ((Z**2) / (f_px * B_m)) * sigma_d * 100.0

# Plot 1: Stereo Depth Uncertainty (Left Axis)
color1 = '#004080' # Deep Navy
line1, = ax1.plot(Z, sigma_Z_cm, color=color1, linewidth=2.5,
                  label=r'Stereo Depth Uncertainty $\sigma_Z = \frac{Z^2}{f \cdot B}\sigma_d$ ($B=128\,\mathrm{mm}$)')

ax1.set_xlabel('Forward Lookahead Distance $Z$ (m)', fontweight='bold', color='#111111')
ax1.set_ylabel(r'Depth Uncertainty $\sigma_Z$ (cm)', fontweight='bold', color=color1)
ax1.tick_params(axis='y', labelcolor=color1, direction='in', which='both')
ax1.tick_params(axis='x', direction='in', which='both')
ax1.set_yscale('log')
ax1.set_xlim(1.0, 12.0)
ax1.set_ylim(0.2, 100.0)
ax1.grid(True, which='major', color='#e0e0e0', linestyle='-', linewidth=0.8)
ax1.grid(True, which='minor', color='#f0f0f0', linestyle=':', linewidth=0.5)

# Lethal Step Drop Threshold (20 cm)
line_thresh = ax1.axhline(20.0, color='#b30000', linestyle='--', linewidth=1.8,
                          label=r'Lethal Ditch Step Threshold ($\epsilon_{\mathrm{drop}} = 20\,\mathrm{cm}$)')

# Highlight Operational Ditch Detection Window [2.8m, 3.2m]
span_win = ax1.axvspan(2.8, 3.2, color='#2e7d32', alpha=0.18, 
                       label=r'Operational Detection Window ($Z \in [2.8, 3.2]\,\mathrm{m}$)')

# Callout at 3.0 m
ax1.plot(3.0, ((3.0**2)/(f_px*B_m))*sigma_d*100.0, 'o', color=color1, markersize=6)
ax1.annotate(r'$\sigma_Z = 4.4\,\mathrm{cm} \ll 20\,\mathrm{cm}$' + '\n' + r'(High-Confidence Detection)',
             xy=(3.0, 4.4), xytext=(3.8, 1.2),
             arrowprops=dict(arrowstyle='->', color=color1, lw=1.2),
             fontsize=9, color=color1, fontweight='bold',
             bbox=dict(boxstyle='square,pad=0.25', facecolor='#f4f8fb', edgecolor=color1, lw=0.8))

# Axis 2: Skid-Steer Stopping Distance (Right Axis)
ax2 = ax1.twinx()
color2 = '#c0392b' # Crimson

# d_stop = v * T_react + v^2 / (2 * mu * g)
# mu = 0.65 (tactical off-road soil), g = 9.81, T_react = 0.05 s (50 Hz control loop)
mu = 0.65
g = 9.81
T_react = 0.05

v_arr = np.linspace(0.4, 1.5, 400)
d_stop = v_arr * T_react + (v_arr**2) / (2.0 * mu * g)

v_patrol = 1.2 # m/s max patrol speed
d_stop_patrol = v_patrol * T_react + (v_patrol**2) / (2.0 * mu * g)

line2, = ax2.plot(Z, d_stop, color=color2, linewidth=2.2, linestyle='-.',
                  label=r'Skid-Steer Stopping Distance $d_{\mathrm{stop}} = v T_r + \frac{v^2}{2\mu g}$')

ax2.set_ylabel(r'Emergency Stopping Distance $d_{\mathrm{stop}}$ (m)', fontweight='bold', color=color2)
ax2.tick_params(axis='y', labelcolor=color2, direction='in')
ax2.set_ylim(0.0, 1.5)

# Annotation for Stopping Margin
ax2.plot(3.0, d_stop_patrol, 's', color=color2, markersize=6)
ax2.annotate(r'At $v = 1.2\,\mathrm{m/s}$:' + '\n' + r'$d_{\mathrm{stop}} = 0.17\,\mathrm{m} \ll 2.8\,\mathrm{m}$' + '\n' + r'Reaction Margin $> 2.3\,\mathrm{s}$',
             xy=(3.0, d_stop_patrol), xytext=(5.2, 0.45),
             arrowprops=dict(arrowstyle='->', color=color2, lw=1.2),
             fontsize=9, color=color2, fontweight='bold',
             bbox=dict(boxstyle='square,pad=0.25', facecolor='#fdf2f2', edgecolor=color2, lw=0.8))

lines = [line1, line_thresh, span_win, line2]
labels = [l.get_label() for l in lines]
ax1.legend(lines, labels, loc='upper left', frameon=True, facecolor='#ffffff', edgecolor='#cccccc', framealpha=0.95)

plt.title('PHYSICAL FOUNDATION: Stereo Depth Uncertainty vs. Stopping Dynamics\nNegative Obstacle Geometric Verification (SIH 26126)', 
          fontweight='bold', pad=12)

out_file = 'docs/diagrams/academic_fig1_stereo_depth_physics.png'
plt.savefig(out_file, dpi=300, bbox_inches='tight')
plt.close()
print(f'Successfully generated: {out_file}')
