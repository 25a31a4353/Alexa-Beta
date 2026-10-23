import os
from PIL import Image, ImageDraw, ImageFont

def render_sample_frame():
    # Load raw frame 150
    webp_path = r'C:\Users\SHANMUKHESWAR\.gemini\antigravity-ide\brain\d3d79a5f-bbf7-434a-9300-d9c95a43af93\alexa_demo_recording_1792692880066.webp'
    im = Image.open(webp_path)
    im.seek(150)
    raw_frame = im.convert('RGBA').resize((1920, 1080), Image.Resampling.LANCZOS)

    # Create overlay
    overlay = Image.new('RGBA', (1920, 1080), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    font_path_reg = r'C:\Windows\Fonts\segoeui.ttf'
    font_path_bold = r'C:\Windows\Fonts\segoeuib.ttf'

    font_logo = ImageFont.truetype(font_path_bold, 22)
    font_badge = ImageFont.truetype(font_path_bold, 13)
    font_chap = ImageFont.truetype(font_path_bold, 15)
    font_title = ImageFont.truetype(font_path_bold, 20)
    font_sub = ImageFont.truetype(font_path_reg, 16)
    font_tc = ImageFont.truetype(font_path_bold, 14)

    # 1. Top Header Bar (0 to 52px)
    draw.rectangle([(0, 0), (1920, 52)], fill=(10, 15, 26, 235))
    draw.line([(0, 52), (1920, 52)], fill=(30, 58, 138, 180), width=1)

    # Logo + Platform Badge
    draw.text((36, 14), "ALEXA+", fill=(255, 255, 255), font=font_logo)
    # Badge
    draw.rounded_rectangle([(140, 15), (280, 39)], radius=6, fill=(29, 99, 237, 50), outline=(59, 130, 246, 180), width=1)
    draw.text((152, 19), "AGENTIC MISSION", fill=(147, 197, 253), font=font_badge)

    # Center Chapter
    draw.text((780, 17), "CHAPTER 4: LIVE MCP EXECUTION", fill=(226, 232, 240), font=font_chap)

    # Right Badges
    draw.rounded_rectangle([(1530, 15), (1700, 39)], radius=6, fill=(16, 185, 129, 30), outline=(16, 185, 129, 150), width=1)
    draw.text((1542, 19), "MCP STREAMABLE HTTP", fill=(110, 231, 183), font=font_badge)

    draw.rounded_rectangle([(1715, 15), (1884, 39)], radius=6, fill=(139, 92, 246, 30), outline=(139, 92, 246, 150), width=1)
    draw.text((1730, 19), "OAUTH 2.0 AES-256", fill=(216, 180, 254), font=font_badge)

    # Progress Bar (4px)
    prog_w = int(1920 * 0.52)  # 52% progress
    draw.rectangle([(0, 52), (prog_w, 56)], fill=(6, 182, 212))

    # 2. Lower-Third Glass Card (y: 870 to 1045, height: 175px)
    card_box = [(40, 870), (1880, 1045)]
    draw.rounded_rectangle(card_box, radius=16, fill=(15, 23, 42, 238), outline=(56, 189, 248, 90), width=1)

    # Left Accent strip
    draw.rounded_rectangle([(40, 870), (48, 1045)], radius=4, fill=(59, 130, 246))

    # Chapter pill badge
    draw.rounded_rectangle([(70, 888), (280, 914)], radius=6, fill=(37, 99, 235, 60), outline=(59, 130, 246, 200), width=1)
    draw.text((82, 892), "STAGE 4: MCP MULTI-SERVICE", fill=(147, 197, 253), font=font_badge)

    # Timecode on right
    draw.text((1760, 893), "01:34 / 02:58", fill=(148, 163, 184), font=font_tc)

    # Headline takeaway
    draw.text((70, 926), "Real-Time Tool Chain: calendar_get_events ➔ gmail_search ➔ drive_search ➔ document_analyze", fill=(248, 250, 252), font=font_title)

    # Narration Subtitle
    sub_text = "Now watch the multi-service execution. Our agent communicates with a self-hosted Model Context Protocol server over Streamable HTTP.\nIt retrieves calendar events, searches Gmail, discovers relevant Google Drive files, and extracts live Google Doc text."
    draw.text((70, 965), sub_text, fill=(203, 213, 225), font=font_sub)

    # Composite
    final_img = Image.alpha_composite(raw_frame, overlay)
    os.makedirs('scratch', exist_ok=True)
    out_path = 'scratch/test_frame.png'
    final_img.convert('RGB').save(out_path)
    print(f"Sample frame rendered successfully to {out_path}!")

if __name__ == '__main__':
    render_sample_frame()
