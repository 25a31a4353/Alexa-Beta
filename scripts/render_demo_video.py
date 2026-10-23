import os
import sys
import time
import subprocess
from PIL import Image, ImageDraw, ImageFont

# Path to the raw recorded animated WebP video
RAW_WEBP_PATH = r'C:\Users\SHANMUKHESWAR\.gemini\antigravity-ide\brain\d3d79a5f-bbf7-434a-9300-d9c95a43af93\alexa_demo_recording_1792692880066.webp'

# Output paths
ARTIFACT_OUTPUT_PATH = r'C:\Users\SHANMUKHESWAR\.gemini\antigravity-ide\brain\d3d79a5f-bbf7-434a-9300-d9c95a43af93\alexa_plus_demo_with_motion_graphics.mp4'
WORKSPACE_OUTPUT_PATH = r'c:\Users\SHANMUKHESWAR\OneDrive\Desktop\Alexa+\alexa_plus_demo_with_motion_graphics.mp4'

FFMPEG_EXE = r'C:\Users\SHANMUKHESWAR\AppData\Local\Programs\Python\Python314\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'

# Video configuration
WIDTH = 1920
HEIGHT = 1080
FPS = 24
TOTAL_SECONDS = 178  # 2 minutes 58 seconds
TOTAL_FRAMES = TOTAL_SECONDS * FPS  # 4272 frames

# Fonts
FONT_REG = r'C:\Windows\Fonts\segoeui.ttf'
FONT_BOLD = r'C:\Windows\Fonts\segoeuib.ttf'

font_logo = ImageFont.truetype(FONT_BOLD, 22)
font_badge = ImageFont.truetype(FONT_BOLD, 13)
font_chap = ImageFont.truetype(FONT_BOLD, 15)
font_title = ImageFont.truetype(FONT_BOLD, 20)
font_sub = ImageFont.truetype(FONT_REG, 16)
font_tc = ImageFont.truetype(FONT_BOLD, 14)

font_intro_hero = ImageFont.truetype(FONT_BOLD, 54)
font_intro_sub = ImageFont.truetype(FONT_REG, 24)
font_intro_tag = ImageFont.truetype(FONT_BOLD, 16)

# Chapters configuration matching the exact 7 segments in the prompt
CHAPTERS = [
    {
        "id": 1,
        "start_sec": 0,
        "end_sec": 15,
        "tag": "STAGE 1: THE PROBLEM",
        "header_title": "CHAPTER 1: THE PROBLEM",
        "takeaway": "Single-Turn Chatbots Fail at Complex Multi-Service Real-World Tasks",
        "subtitles": [
            "Most digital assistants answer simple questions or execute one-off commands.",
            "Preparing for an important meeting means checking your calendar, searching emails, finding documents, and identifying what remains unfinished.",
            "Our project brings those tasks together in an autonomous agentic mission workflow."
        ],
        "frame_start": 0,
        "frame_end": 20
    },
    {
        "id": 2,
        "start_sec": 15,
        "end_sec": 35,
        "tag": "STAGE 2: SUBMIT THE MISSION",
        "header_title": "CHAPTER 2: SUBMIT THE MISSION",
        "takeaway": "High-Level Goal Dispatch: 'Prepare me for my Alexa+ product review tomorrow'",
        "subtitles": [
            "Here is our mission: prepare me for my Alexa+ product review tomorrow.",
            "Check my calendar, find relevant emails, locate documents in Drive, identify what I have not prepared, and create a preparation checklist.",
            "We submit the request, and the agent takes over."
        ],
        "frame_start": 21,
        "frame_end": 75
    },
    {
        "id": 3,
        "start_sec": 35,
        "end_sec": 75,
        "tag": "STAGE 3: UNDERSTAND & PLAN",
        "header_title": "CHAPTER 3: UNDERSTAND & PLAN",
        "takeaway": "Autonomous Multi-Service DAG Formulation across Calendar, Email & Documents",
        "subtitles": [
            "The agent interprets the goal and identifies the services required: Calendar, Email, and Documents.",
            "It creates a structured execution plan. Each stage contributes evidence to the next:",
            "Retrieve the schedule, search for relevant communications, locate the supporting document, and analyze its contents."
        ],
        "frame_start": 76,
        "frame_end": 135
    },
    {
        "id": 4,
        "start_sec": 75,
        "end_sec": 115,
        "tag": "STAGE 4: LIVE MCP EXECUTION",
        "header_title": "CHAPTER 4: LIVE MCP EXECUTION",
        "takeaway": "Self-Hosted Model Context Protocol: calendar ➔ gmail ➔ drive ➔ document_analyze",
        "subtitles": [
            "Now watch the multi-service execution. Our agent communicates with a self-hosted Model Context Protocol server over Streamable HTTP.",
            "It retrieves calendar events, searches Gmail, discovers relevant Google Drive files, retrieves the document content, and invokes document analysis.",
            "These are actual tool operations, not just a conversational description of the workflow."
        ],
        "frame_start": 136,
        "frame_end": 190
    },
    {
        "id": 5,
        "start_sec": 115,
        "end_sec": 145,
        "tag": "STAGE 5: EVIDENCE FUSION & RESULT",
        "header_title": "CHAPTER 5: EVIDENCE FUSION & RESULT",
        "takeaway": "Verified Preparation Brief: Decisions Needed, Technical Risks & Action Checklist",
        "subtitles": [
            "The agent combines the retrieved evidence into a preparation brief.",
            "The result identifies the meeting schedule, relevant email context, supporting document, important technical topics, risks, and preparation actions.",
            "The brief is grounded in evidence returned by the executed MCP tools."
        ],
        "frame_start": 191,
        "frame_end": 235
    },
    {
        "id": 6,
        "start_sec": 145,
        "end_sec": 165,
        "tag": "STAGE 6: ARCHITECTURE & SECURITY",
        "header_title": "CHAPTER 6: ARCHITECTURE & SECURITY",
        "takeaway": "Self-Hosted Streamable HTTP MCP, AES-256-GCM Tokens & Keyless Fallback",
        "subtitles": [
            "The browser communicates with our application API, which coordinates the agent and MCP client.",
            "The self-hosted server exposes discoverable tools through Streamable HTTP. Google Workspace access uses OAuth, and encrypted token storage protects credentials.",
            "A transparently labelled local fallback supports evaluation when live authorization is unavailable."
        ],
        "frame_start": 236,
        "frame_end": 275
    },
    {
        "id": 7,
        "start_sec": 165,
        "end_sec": 178,
        "tag": "STAGE 7: CONCLUSION & IMPACT",
        "header_title": "CHAPTER 7: CONCLUSION & IMPACT",
        "takeaway": "An Agentic Mission System Turning High-Level Goals into Verified Action Sequences",
        "subtitles": [
            "We did not just build an MCP server.",
            "We built an agentic mission system that turns a complex user goal into an autonomous, evidence-grounded, multi-service workflow.",
            "MCP is the mechanism that makes it possible. Thank you."
        ],
        "frame_start": 276,
        "frame_end": 308
    }
]

def load_raw_frames():
    print(f"Loading raw WebP frames from {RAW_WEBP_PATH}...")
    im = Image.open(RAW_WEBP_PATH)
    total_raw = getattr(im, 'n_frames', 1)
    print(f"Found {total_raw} raw frames. Pre-resizing to {WIDTH}x{HEIGHT}...")
    frames = []
    for i in range(total_raw):
        im.seek(i)
        # Convert and resize cleanly
        resized = im.convert('RGBA').resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR)
        frames.append(resized)
    print("Raw frames loaded successfully into memory.")
    return frames

def render_intro_card():
    card = Image.new('RGBA', (WIDTH, HEIGHT), (9, 13, 22, 255))
    draw = ImageDraw.Draw(card)

    # Ambient gradient glow
    for r in range(400, 0, -20):
        alpha = int(25 * (1 - r / 400))
        draw.ellipse([(WIDTH//2 - r, HEIGHT//2 - r - 60), (WIDTH//2 + r, HEIGHT//2 + r - 60)], fill=(29, 99, 237, alpha))

    # Title
    draw.text((WIDTH//2 - 120, HEIGHT//2 - 160), "ALEXA+", fill=(255, 255, 255), font=font_intro_hero)
    draw.text((WIDTH//2 - 380, HEIGHT//2 - 70), "Autonomous Multi-Service Mission Execution Platform", fill=(147, 197, 253), font=font_intro_sub)
    draw.text((WIDTH//2 - 310, HEIGHT//2 - 20), "Powered by Self-Hosted MCP (Streamable HTTP) & Amazon Bedrock", fill=(203, 213, 225), font=ImageFont.truetype(FONT_REG, 18))

    # Badges
    b_y = HEIGHT//2 + 50
    draw.rounded_rectangle([(WIDTH//2 - 360, b_y), (WIDTH//2 - 140, b_y + 36)], radius=8, fill=(30, 58, 138, 120), outline=(59, 130, 246, 220), width=1)
    draw.text((WIDTH//2 - 345, b_y + 8), "ALEXA+ TRACK 2026", fill=(191, 219, 254), font=font_intro_tag)

    draw.rounded_rectangle([(WIDTH//2 - 120, b_y), (WIDTH//2 + 120, b_y + 36)], radius=8, fill=(16, 185, 129, 80), outline=(16, 185, 129, 200), width=1)
    draw.text((WIDTH//2 - 105, b_y + 8), "MCP SPEC 2025-11-25+", fill=(167, 243, 208), font=font_intro_tag)

    draw.rounded_rectangle([(WIDTH//2 + 140, b_y), (WIDTH//2 + 360, b_y + 36)], radius=8, fill=(139, 92, 246, 80), outline=(139, 92, 246, 200), width=1)
    draw.text((WIDTH//2 + 155, b_y + 8), "AWS BUILDER QUALIFIED", fill=(233, 213, 255), font=font_intro_tag)

    draw.text((WIDTH//2 - 200, HEIGHT - 100), "Build, Ship, Shape: Amazon Developer Hackathon", fill=(100, 116, 139), font=font_intro_tag)
    return card

def render_outro_card():
    card = Image.new('RGBA', (WIDTH, HEIGHT), (9, 13, 22, 255))
    draw = ImageDraw.Draw(card)

    for r in range(400, 0, -20):
        alpha = int(25 * (1 - r / 400))
        draw.ellipse([(WIDTH//2 - r, HEIGHT//2 - r - 60), (WIDTH//2 + r, HEIGHT//2 + r - 60)], fill=(6, 182, 212, alpha))

    draw.text((WIDTH//2 - 120, HEIGHT//2 - 180), "ALEXA+", fill=(255, 255, 255), font=font_intro_hero)
    draw.text((WIDTH//2 - 420, HEIGHT//2 - 90), "“An agentic mission system that turns a high-level objective into a verified", fill=(248, 250, 252), font=font_intro_sub)
    draw.text((WIDTH//2 - 250, HEIGHT//2 - 50), "sequence of actions across multiple services.”", fill=(56, 189, 248), font=font_intro_sub)

    # Links Box
    box_y = HEIGHT//2 + 20
    draw.rounded_rectangle([(WIDTH//2 - 420, box_y), (WIDTH//2 + 420, box_y + 140)], radius=12, fill=(15, 23, 42, 220), outline=(51, 65, 85, 200), width=1)

    draw.text((WIDTH//2 - 390, box_y + 20), "🌐 Live Cloud Deployment:", fill=(148, 163, 184), font=ImageFont.truetype(FONT_BOLD, 16))
    draw.text((WIDTH//2 - 130, box_y + 20), "https://alexa-beta.onrender.com", fill=(56, 189, 248), font=ImageFont.truetype(FONT_REG, 16))

    draw.text((WIDTH//2 - 390, box_y + 55), "🐙 Public Code Repository:", fill=(148, 163, 184), font=ImageFont.truetype(FONT_BOLD, 16))
    draw.text((WIDTH//2 - 130, box_y + 55), "https://github.com/25a31a4353/Alexa-Beta", fill=(147, 197, 253), font=ImageFont.truetype(FONT_REG, 16))

    draw.text((WIDTH//2 - 390, box_y + 90), "📦 Open Source Companion:", fill=(148, 163, 184), font=ImageFont.truetype(FONT_BOLD, 16))
    draw.text((WIDTH//2 - 130, box_y + 90), "https://github.com/25a31a4353/mcp-session-reaper (MIT)", fill=(167, 243, 208), font=ImageFont.truetype(FONT_REG, 16))

    draw.text((WIDTH//2 - 90, HEIGHT - 70), "Thank You", fill=(255, 255, 255), font=ImageFont.truetype(FONT_BOLD, 22))
    return card

def render_frame_overlay(current_sec, chap, progress):
    overlay = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # 1. Top Header Bar (52px)
    draw.rectangle([(0, 0), (WIDTH, 52)], fill=(10, 15, 26, 235))
    draw.line([(0, 52), (WIDTH, 52)], fill=(30, 58, 138, 180), width=1)

    # Logo
    draw.text((36, 14), "ALEXA+", fill=(255, 255, 255), font=font_logo)
    draw.rounded_rectangle([(140, 15), (280, 39)], radius=6, fill=(29, 99, 237, 50), outline=(59, 130, 246, 180), width=1)
    draw.text((152, 19), "AGENTIC MISSION", fill=(147, 197, 253), font=font_badge)

    # Center Chapter
    draw.text((780, 17), chap["header_title"], fill=(226, 232, 240), font=font_chap)

    # Right Badges
    draw.rounded_rectangle([(1530, 15), (1700, 39)], radius=6, fill=(16, 185, 129, 30), outline=(16, 185, 129, 150), width=1)
    draw.text((1542, 19), "MCP STREAMABLE HTTP", fill=(110, 231, 183), font=font_badge)

    draw.rounded_rectangle([(1715, 15), (1884, 39)], radius=6, fill=(139, 92, 246, 30), outline=(139, 92, 246, 150), width=1)
    draw.text((1730, 19), "OAUTH 2.0 AES-256", fill=(216, 180, 254), font=font_badge)

    # Progress Bar (4px)
    prog_w = int(WIDTH * progress)
    draw.rectangle([(0, 52), (prog_w, 56)], fill=(6, 182, 212))

    # 2. Lower-Third Glassmorphic Card (y: 870 to 1045)
    card_box = [(40, 870), (1880, 1045)]
    draw.rounded_rectangle(card_box, radius=16, fill=(15, 23, 42, 238), outline=(56, 189, 248, 90), width=1)

    # Accent line on left edge of card
    draw.rounded_rectangle([(40, 870), (48, 1045)], radius=4, fill=(59, 130, 246))

    # Chapter pill badge
    draw.rounded_rectangle([(70, 888), (290, 914)], radius=6, fill=(37, 99, 235, 60), outline=(59, 130, 246, 200), width=1)
    draw.text((82, 892), chap["tag"], fill=(147, 197, 253), font=font_badge)

    # Real-time Timecode
    mins = int(current_sec) // 60
    secs = int(current_sec) % 60
    timecode_str = f"{mins:02d}:{secs:02d} / 02:58"
    draw.text((1760, 893), timecode_str, fill=(148, 163, 184), font=font_tc)

    # Headline Takeaway
    draw.text((70, 926), chap["takeaway"], fill=(248, 250, 252), font=font_title)

    # Subtitle Narration (select subtitle sentence based on sub-timing)
    chap_duration = chap["end_sec"] - chap["start_sec"]
    rel_sec = current_sec - chap["start_sec"]
    num_subs = len(chap["subtitles"])
    sub_idx = min(int((rel_sec / chap_duration) * num_subs), num_subs - 1)
    curr_subtitle = chap["subtitles"][sub_idx]

    draw.text((70, 965), curr_subtitle, fill=(203, 213, 225), font=font_sub)

    return overlay

def main():
    print("=" * 70)
    print("ALEXA+ DEMO VIDEO ENHANCEMENT & MOTION GRAPHICS RENDERER")
    print("=" * 70)

    raw_frames = load_raw_frames()
    num_raw = len(raw_frames)

    intro_card = render_intro_card()
    outro_card = render_outro_card()

    # Pre-render overlay cache for each second to optimize rendering speed
    print("Pre-rendering motion graphics overlay templates...")
    overlay_cache = {}
    for sec in range(TOTAL_SECONDS + 1):
        progress = min(sec / TOTAL_SECONDS, 1.0)
        curr_chap = CHAPTERS[-1]
        for c in CHAPTERS:
            if c["start_sec"] <= sec < c["end_sec"]:
                curr_chap = c
                break
        overlay_cache[sec] = render_frame_overlay(sec, curr_chap, progress)

    # Initialize FFmpeg pipe
    os.makedirs(os.path.dirname(ARTIFACT_OUTPUT_PATH), exist_ok=True)
    os.makedirs(os.path.dirname(WORKSPACE_OUTPUT_PATH), exist_ok=True)

    ffmpeg_cmd = [
        FFMPEG_EXE,
        '-y',
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo',
        '-s', f'{WIDTH}x{HEIGHT}',
        '-pix_fmt', 'rgba',
        '-r', str(FPS),
        '-i', '-',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'fast',
        '-crf', '18',
        ARTIFACT_OUTPUT_PATH
    ]

    print(f"Spawning FFmpeg encoder process ({FFMPEG_EXE})...")
    pipe = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)

    start_time = time.time()
    print(f"Rendering and streaming {TOTAL_FRAMES} frames ({TOTAL_SECONDS}s at {FPS}fps)...")

    # Render loop
    for frame_idx in range(TOTAL_FRAMES):
        current_sec = frame_idx / FPS
        int_sec = int(current_sec)
        progress = frame_idx / TOTAL_FRAMES

        # Determine current chapter
        curr_chap = CHAPTERS[-1]
        for c in CHAPTERS:
            if c["start_sec"] <= current_sec < c["end_sec"]:
                curr_chap = c
                break

        # Check for intro card (0 to 2.5s)
        if current_sec < 2.5:
            # Fade from intro card
            alpha = min(1.0, current_sec / 0.5)
            frame_img = intro_card
        # Check for outro card (174.5 to 178s)
        elif current_sec >= 174.5:
            frame_img = outro_card
        else:
            # Calculate corresponding raw frame index within chapter
            c_start_s = curr_chap["start_sec"]
            c_end_s = curr_chap["end_sec"]
            c_ratio = (current_sec - c_start_s) / (c_end_s - c_start_s)
            raw_idx = int(curr_chap["frame_start"] + c_ratio * (curr_chap["frame_end"] - curr_chap["frame_start"]))
            raw_idx = max(0, min(raw_idx, num_raw - 1))

            base_frame = raw_frames[raw_idx].copy()
            overlay = overlay_cache.get(int_sec, overlay_cache[TOTAL_SECONDS])
            frame_img = Image.alpha_composite(base_frame, overlay)

        # Write RGBA raw bytes to FFmpeg stdin
        pipe.stdin.write(frame_img.tobytes())

        # Progress reporting every 10 seconds
        if frame_idx % (FPS * 10) == 0 or frame_idx == TOTAL_FRAMES - 1:
            elapsed = time.time() - start_time
            fps_proc = (frame_idx + 1) / elapsed if elapsed > 0 else 0
            pct = ((frame_idx + 1) / TOTAL_FRAMES) * 100
            print(f"[{pct:5.1f}%] Frame {frame_idx + 1}/{TOTAL_FRAMES} | Current time: {int_sec//60:02d}:{int_sec%60:02d} | Encoding speed: {fps_proc:.1f} fps")

    pipe.stdin.close()
    pipe.wait()

    elapsed_total = time.time() - start_time
    print(f"\nFFmpeg encoding complete in {elapsed_total:.1f}s!")

    # Copy to workspace root for direct download
    if os.path.exists(ARTIFACT_OUTPUT_PATH):
        artifact_size = os.path.getsize(ARTIFACT_OUTPUT_PATH)
        print(f"Artifact MP4 generated: {ARTIFACT_OUTPUT_PATH} ({artifact_size:,} bytes)")
        import shutil
        shutil.copy2(ARTIFACT_OUTPUT_PATH, WORKSPACE_OUTPUT_PATH)
        print(f"Workspace MP4 ready: {WORKSPACE_OUTPUT_PATH}")
    else:
        print("ERROR: FFmpeg output file was not found.")

if __name__ == '__main__':
    main()
