import math, random
random.seed(7)
NX, NY, SP = 126, 91, 0.4          # grid points / spacing -> 50 x 36 m
OX, OY = -NX*SP/2+SP/2, -NY*SP/2+SP/2
hills = [(-5,2,3.5,1.1),(8,-6,4,1.4),(14,10,3,1.0),(-14,-8,4,0.9),(0,12,3.5,1.2),(20,-2,3,1.0)]
ditches = [(-8,-4,1.3,8,'y'),(4,3,10,1.3,'x'),(15,-12,1.3,7,'y'),(-2,-13,8,1.3,'x')]  # cx,cy,w,h
def h(x,y):
    z=0
    for cx,cy,r,a in hills: z+=a*math.exp(-((x-cx)**2+(y-cy)**2)/(2*(r/1.6)**2))
    z+=0.03*math.sin(x*1.7)*math.cos(y*1.3)
    d=math.hypot(x+22,y+14)             # keep start flat
    z*=min(1,max(0,(d-4)/4))
    for cx,cy,w,hh,_ in ditches:
        if abs(x-cx)<w/2 and abs(y-cy)<hh/2: z-=0.55
    return z
H=[h(OX+i*SP,OY+j*SP) for j in range(NY) for i in range(NX)]
def hs(x,y):
    i=min(NX-1,max(0,round((x-OX)/SP))); j=min(NY-1,max(0,round((y-OY)/SP))); return H[j*NX+i]
rocks=[]
while len(rocks)<28:
    x,y=random.uniform(-22,22),random.uniform(-16,16)
    if math.hypot(x+22,y+14)<5 or math.hypot(x-21,y-13)<3: continue
    if any(abs(x-cx)<w/2+1 and abs(y-cy)<hh/2+1 for cx,cy,w,hh,_ in ditches): continue
    rocks.append((x,y,random.uniform(.25,.5),random.uniform(0,6.28)))
out=["#VRML_SIM R2025a utf8",
"EXTERNPROTO \"https://raw.githubusercontent.com/cyberbotics/webots/R2025a/projects/objects/backgrounds/protos/TexturedBackground.proto\"",
"EXTERNPROTO \"https://raw.githubusercontent.com/cyberbotics/webots/R2025a/projects/objects/backgrounds/protos/TexturedBackgroundLight.proto\"",
"EXTERNPROTO \"https://raw.githubusercontent.com/cyberbotics/webots/R2025a/projects/robots/adept/pioneer3/protos/Pioneer3at.proto\"",
"",
"Viewpoint {\n  orientation -0.25 0.25 0.93 1.6\n  position -34 -30 22\n  follow \"Netra UGV\"\n  followType \"Mounted Shot\"\n}",
"TexturedBackground {}\nTexturedBackgroundLight {}",
"Solid {\n  name \"terrain\"\n  translation %.3f %.3f 0\n  children [ Shape {\n    appearance PBRAppearance { baseColor 0.55 0.47 0.33 roughness 1 metalness 0 }\n    geometry DEF TERRAIN ElevationGrid {\n      xDimension %d\n      xSpacing %g\n      yDimension %d\n      ySpacing %g\n      height [\n%s\n      ]\n    }\n  } ]\n  boundingObject USE TERRAIN\n}" % (OX,OY,NX,SP,NY,SP,"\n".join("        "+" ".join("%.3f"%v for v in H[j*NX:(j+1)*NX]) for j in range(NY)))]
# NOTE: terrain translation is the grid corner; ElevationGrid spans 0..(N-1)*SP
for i,(x,y,s,a) in enumerate(rocks):
    out.append("Solid {\n  name \"rock%d\"\n  translation %.2f %.2f %.2f\n  rotation 0 0 1 %.2f\n  children [ Shape { appearance PBRAppearance { baseColor 0.4 0.4 0.42 roughness 1 metalness 0 } geometry DEF R%d Box { size %.2f %.2f %.2f } } ]\n  boundingObject USE R%d\n}"%(i,x,y,hs(x,y)+s*0.4,a,i,s*1.6,s*1.3,s*0.9,i))
out.append("""Solid {
  name "goal marker"
  translation 21 13 %.2f
  children [ Shape { appearance PBRAppearance { baseColor 1 0.85 0.1 emissiveColor 0.6 0.5 0 } geometry Cylinder { height 0.05 radius 0.8 } } ]
}"""%(hs(21,13)+0.03))
out.append("""Pioneer3at {
  translation -22 -14 0.3
  name "Netra UGV"
  controller "netra_ugv"
  supervisor FALSE
  extensionSlot [
    GPS { translation 0 0 0.3 name "gps" }
    InertialUnit { translation 0 0 0.3 name "imu" }
    Gyro { translation 0 0 0.3 name "gyro" }
    Accelerometer { translation 0 0 0.3 name "accel" }
    Camera { translation 0.3 0 0.35 name "camera" width 320 height 240 fieldOfView 1.2 }
    Lidar { translation 0.3 0 0.35 name "lidar" horizontalResolution 180 fieldOfView 2.4 numberOfLayers 1 maxRange 12 minRange 0.2 }
    Lidar { translation 0.3 0 0.4 rotation 0 1 0 0.35 name "lidar_down" horizontalResolution 45 fieldOfView 0.9 numberOfLayers 1 maxRange 8 minRange 0.2 }
  ]
}""")
open("worlds/netra_tactical.wbt","w").write("\n\n".join(out)+"\n")
print(len(rocks),"rocks")
