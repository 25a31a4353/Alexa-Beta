import os
from PIL import Image
import numpy as np

card_path = r'C:\Users\SHANMUKHESWAR\.gemini\antigravity-ide\brain\a1d59fd5-299a-4205-aa06-fc6a3a12c032\.user_uploaded\media_1791876099231.jpg'
logo_path = r'C:\Users\SHANMUKHESWAR\.gemini\antigravity-ide\brain\a1d59fd5-299a-4205-aa06-fc6a3a12c032\.user_uploaded\media_1791876106261.png'
out_dir = r'C:\Users\SHANMUKHESWAR\OneDrive\Desktop\Alexa+\public\brand'
os.makedirs(out_dir, exist_ok=True)

# -------------------------------------------------------------
# 1. Process Amazon Logo: White text + brand orange smile on transparent
# -------------------------------------------------------------
img_logo = Image.open(logo_path).convert('RGBA')
arr_logo = np.array(img_logo, dtype=float)

# In img_logo, background is white (255, 255, 255)
# Text is black (0, 0, 0)
# Smile is orange (255, 153, 0) approx
r, g, b, a = arr_logo[:, :, 0], arr_logo[:, :, 1], arr_logo[:, :, 2], arr_logo[:, :, 3]

# Detect orange pixels: high red, medium green, low blue
is_orange = (r > 180) & (g > 80) & (g < 200) & (b < 80)

# Detect non-background pixels (where it differs from white)
diff_from_white = 255.0 - np.minimum(np.minimum(r, g), b)
alpha = np.clip(diff_from_white * 1.5, 0, 255)

# Create output image
out_logo = np.zeros_like(arr_logo)
# Orange smile parts
out_logo[is_orange, 0] = 255
out_logo[is_orange, 1] = 153
out_logo[is_orange, 2] = 0
out_logo[is_orange, 3] = alpha[is_orange]

# White text parts
is_text = (~is_orange) & (alpha > 10)
out_logo[is_text, 0] = 255
out_logo[is_text, 1] = 255
out_logo[is_text, 2] = 255
out_logo[is_text, 3] = alpha[is_text]

img_out_logo = Image.fromarray(out_logo.astype(np.uint8))
# Crop bounding box
bbox = img_out_logo.getbbox()
if bbox:
    img_out_logo = img_out_logo.crop(bbox)
out_logo_file = os.path.join(out_dir, 'amazon-logo-white.png')
img_out_logo.save(out_logo_file, 'PNG')
print(f"Saved: {out_logo_file}, size: {img_out_logo.size}")

# -------------------------------------------------------------
# 2. Extract Exact Amazon Smile from the Card
# -------------------------------------------------------------
img_card = Image.open(card_path).convert('RGBA')
arr_card = np.array(img_card, dtype=float)
# The center smile is in region y: 150 to 500, x: 100 to 950
cr, cg, cb = arr_card[:, :, 0], arr_card[:, :, 1], arr_card[:, :, 2]

# Card background is dark blue-slate approx (28, 36, 48)
# Orange smile is (255, 153, 0)
# A pixel is part of the smile if red is significantly higher than blue
smile_mask = (cr > 100) & (cr > cb * 2.2) & (cr > cg * 1.1)

# Clean alpha based on red channel intensity above background
bg_r = 28.0
smile_alpha = np.clip((cr - bg_r) / (255.0 - bg_r) * 255.0, 0, 255)
smile_alpha[~smile_mask] = 0

out_smile = np.zeros_like(arr_card)
# Set color to exact brand orange
out_smile[smile_mask, 0] = 255
out_smile[smile_mask, 1] = 153
out_smile[smile_mask, 2] = 0
out_smile[smile_mask, 3] = smile_alpha[smile_mask]

# Zero out top 150 pixels to exclude the header logo
out_smile[:160, :, :] = 0

img_out_smile = Image.fromarray(out_smile.astype(np.uint8))
smile_bbox = img_out_smile.getbbox()
if smile_bbox:
    img_out_smile = img_out_smile.crop(smile_bbox)

out_smile_file = os.path.join(out_dir, 'amazon-smile-exact.png')
img_out_smile.save(out_smile_file, 'PNG')
print(f"Saved: {out_smile_file}, size: {img_out_smile.size}")

# -------------------------------------------------------------
# 3. Extract exact top-right header logo from Card as well
# -------------------------------------------------------------
header_crop = img_card.crop((700, 30, 980, 160))
arr_hdr = np.array(header_crop, dtype=float)
hr, hg, hb = arr_hdr[:, :, 0], arr_hdr[:, :, 1], arr_hdr[:, :, 2]
bg_val = np.array([28, 36, 48])
dist = np.sqrt((hr - bg_val[0])**2 + (hg - bg_val[1])**2 + (hb - bg_val[2])**2)
hdr_alpha = np.clip(dist * 2.5, 0, 255)

out_hdr = np.copy(arr_hdr)
out_hdr[:, :, 3] = hdr_alpha
img_out_hdr = Image.fromarray(out_hdr.astype(np.uint8))
h_bbox = img_out_hdr.getbbox()
if h_bbox:
    img_out_hdr = img_out_hdr.crop(h_bbox)
out_hdr_file = os.path.join(out_dir, 'amazon-card-header-logo.png')
img_out_hdr.save(out_hdr_file, 'PNG')
print(f"Saved: {out_hdr_file}, size: {img_out_hdr.size}")

print("Asset extraction complete!")
