from PIL import Image
import os

path = r'C:\Users\SHANMUKHESWAR\.gemini\antigravity-ide\brain\d3d79a5f-bbf7-434a-9300-d9c95a43af93\alexa_demo_recording_1792692880066.webp'
im = Image.open(path)
total = getattr(im, 'n_frames', 1)
print(f"Total frames: {total}")

out_dir = r'scratch\key_frames'
os.makedirs(out_dir, exist_ok=True)

# Sample 15 key points across the recording
indices = [int(i * (total - 1) / 14) for i in range(15)]
for idx in indices:
    im.seek(idx)
    fn = os.path.join(out_dir, f"frame_{idx:03d}.png")
    im.save(fn)
    print(f"Saved keyframe {idx}: {fn} (size: {im.size})")

print("Inspection complete!")
