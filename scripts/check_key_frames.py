import os
from PIL import Image

key_frames = sorted(os.listdir('scratch/key_frames'))
for kf in key_frames:
    p = os.path.join('scratch/key_frames', kf)
    img = Image.open(p)
    print(f"{kf}: size {img.size}")
