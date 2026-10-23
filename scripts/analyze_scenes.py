from PIL import Image
import os

path = r'C:\Users\SHANMUKHESWAR\.gemini\antigravity-ide\brain\d3d79a5f-bbf7-434a-9300-d9c95a43af93\alexa_demo_recording_1792692880066.webp'
im = Image.open(path)

# Sample every 15th frame and print average RGB and top-left/center colors
print("Frame scene analysis:")
for i in range(0, im.n_frames, 20):
    im.seek(i)
    rgb = im.convert('RGB')
    w, h = rgb.size
    # Sample center patch
    center_color = rgb.getpixel((w//2, h//2))
    # Sample top bar
    top_color = rgb.getpixel((w//2, 40))
    print(f"Frame {i:03d}: size=({w}x{h}), top={top_color}, center={center_color}")
