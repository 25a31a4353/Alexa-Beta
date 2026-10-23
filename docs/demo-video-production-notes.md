# Alexa+ Hackathon Demo Video — Pure Prototype Edition

## 1. Video Specifications
- **Master File**: [`artifacts/demo-video/alexa-plus-demo-final.mp4`](file:///c:/Users/SHANMUKHESWAR/OneDrive/Desktop/Alexa+/artifacts/demo-video/alexa-plus-demo-final.mp4)
- **Workspace Copy**: [`alexa-plus-demo-final.mp4`](file:///c:/Users/SHANMUKHESWAR/OneDrive/Desktop/Alexa+/alexa-plus-demo-final.mp4)
- **Duration**: **174.00 seconds (02:54.00)** — *Strictly under the 3-minute hackathon maximum*
- **Resolution**: **1920 × 1080 (Full HD, 16:9 Landscape)**
- **Frame Rate**: **30.00 fps (5,220 frames total)**
- **Video Codec**: **H.264 (High Profile, yuv420p, progressive)**
- **Audio Codec**: **AAC 48kHz Stereo, 169 kb/s**
- **Voice**: **`en-US-ChristopherNeural`** (Authoritative, natural keynote delivery)
- **Subtitles**: Exported to [`alexa-plus-demo-subtitles.srt`](file:///c:/Users/SHANMUKHESWAR/OneDrive/Desktop/Alexa+/artifacts/demo-video/alexa-plus-demo-subtitles.srt) and rendered as non-intrusive bottom pills

---

## 2. Design Principles Applied
1. **Focus Exclusively on the Real Prototype**:
   - Every single scene displays the actual 1080p interface of the running application (`http://127.0.0.1:3000` / `:3001`).
   - Zero device frames, zero floating cards, zero artificial graphics, zero decorative badges obscuring the interface.
2. **No Overlapping Scenes**:
   - Clean, distinct scene transitions aligned with the narration script.
3. **Interactive Cursor Guidance**:
   - Natural OS cursor demonstrates real interactive navigation across sidebar items, the prompt composer, execution mode pills, the send button, and live MCP tool runners.
4. **Legible Subtitles**:
   - Placed at the very bottom edge inside a slim translucent pill that never covers buttons, tabs, or tool outputs.

---

## 3. Scene Breakdown & Timestamps

| Scene | Time Range | Duration | Prototype View | Feature & Working Explained |
|---|---|---|---|---|
| **Scene 1** | `00:00 – 00:16` | 16.0s | Home Launchpad (`01_home.png`) | Autonomous multi-service mission concept vs single-turn chatbots; real home launchpad and capability pills. |
| **Scene 2** | `00:16 – 00:34` | 18.0s | Complete Sidebar Tour (8 screens) | Interactive sidebar navigation tour visiting Home, New Conversation, Missions, Knowledge, Tools, Integrations, Activity, and Settings. |
| **Scene 3** | `00:34 – 00:53` | 19.0s | New Mission Composer (`02_new_filled.png`) | Entering a high-level real-world mission in natural language, selecting Autonomous mode, and dispatching via the execute button. |
| **Scene 4** | `00:53 – 01:11` | 18.0s | 5-Phase Stepper & DAG (`04_mission_top.png`) | Horizontal 5-phase lifecycle stepper (Understand ➔ Plan ➔ Use Tools ➔ Verify ➔ Results) and dependency-aware DAG execution. |
| **Scene 5** | `01:11 – 01:35` | 24.0s | Live MCP Tool Execution (`04_mission_bottom.png`) | Multi-service tool orchestration over Streamable HTTP (`calendar_get_events`, `gmail_search`, `drive_search`, `document_analyze`) with live JSON arguments and outputs. |
| **Scene 6** | `01:35 – 01:51.5` | 16.5s | Synthesized Briefing (`04_mission_middle.png`) | Evidence-grounded executive briefing, schedule confirmation, transparent local fallback attribution, decisions, risks, and actionable checklist. |
| **Scene 7** | `01:51.5 – 02:08.5` | 17.0s | Self-Hosted MCP Tools (`06_tools.png`) | Self-hosted Model Context Protocol server on port 3001, 11 discovered tools, Zod schemas, and interactive tool runner. |
| **Scene 8** | `02:08.5 – 02:26` | 17.5s | Enterprise Integrations (`07_integrations.png`) | Google Workspace OAuth with AES-256-GCM encryption and zero-dependency local SQLite fallback. |
| **Scene 9** | `02:26 – 02:41` | 15.0s | Activity & Settings (`08_activity.png`, `09_settings.png`) | Real-time SSE event telemetry stream & Amazon Bedrock Native Converse integration (Claude 3.5 Sonnet & Amazon Nova Pro). |
| **Scene 10** | `02:41 – 02:54` | 13.0s | Open Source & Wrap-Up (`09_settings.png`, `01_home.png`) | Published open-source companion package `mcp-session-reaper` (MIT) and return to the completed prototype platform. |

---

## 4. Production Artifacts Summary
- **Master Video MP4**: [`artifacts/demo-video/alexa-plus-demo-final.mp4`](file:///c:/Users/SHANMUKHESWAR/OneDrive/Desktop/Alexa+/artifacts/demo-video/alexa-plus-demo-final.mp4) (8.78 MB)
- **Workspace Root Video**: [`alexa-plus-demo-final.mp4`](file:///c:/Users/SHANMUKHESWAR/OneDrive/Desktop/Alexa+/alexa-plus-demo-final.mp4)
- **Narration Audio WAV**: [`artifacts/demo-video/alexa-plus-demo-narration.wav`](file:///c:/Users/SHANMUKHESWAR/OneDrive/Desktop/Alexa+/artifacts/demo-video/alexa-plus-demo-narration.wav)
- **Narration Audio MP3**: [`artifacts/demo-video/alexa-plus-demo-narration.mp3`](file:///c:/Users/SHANMUKHESWAR/OneDrive/Desktop/Alexa+/artifacts/demo-video/alexa-plus-demo-narration.mp3)
- **Subtitles SRT**: [`artifacts/demo-video/alexa-plus-demo-subtitles.srt`](file:///c:/Users/SHANMUKHESWAR/OneDrive/Desktop/Alexa+/artifacts/demo-video/alexa-plus-demo-subtitles.srt)
