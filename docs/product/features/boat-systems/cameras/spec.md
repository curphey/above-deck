# Cameras & Visual Monitoring — Feature Specification

**Feature:** 6.15 Cameras & Visual Monitoring
**Status:** Draft
**Date:** 2026-03-31
**License:** GPL v3

---

## 1. Overview

The Cameras feature integrates IP camera feeds into the Above Deck MFD shell, providing live visual monitoring of the boat's engine room, cockpit, anchor, mast, and stern areas. Cameras are displayed as MFD app tiles in single-view or multi-camera grid layouts, and can be shown in split view alongside charts, instruments, or anchor watch.

Beyond live viewing, the feature supports motion detection alerts (engine room activity, cockpit intrusion when at anchor or on the dock), time-lapse recording (anchor watch overnight, passage highlights), snapshot capture with GPS/timestamp metadata, and remote viewing via the hub when internet is available.

The spoke's Go server acts as the camera management layer: it discovers cameras on the local network, proxies RTSP streams to browser-compatible formats, manages recording storage, and runs motion detection analysis. The dashboard shows video; it does not require any proprietary camera vendor software.

Design references: Raymarine Axiom 2 Video app (camera feeds as MFD tiles, split view with charts), Maretron N2KView (embedded camera alongside gauges), ClearCruise AR (camera with data overlay — future foundation).

---

## 2. User Stories

### Visual monitoring at anchor
- As a cruiser at anchor overnight, I want to see the foredeck camera feed alongside my anchor watch display so I can visually confirm the anchor and rode while monitoring GPS drift.
- As a cruiser in a busy anchorage, I want motion detection on my cockpit camera to alert me if someone boards the boat while I am below deck or asleep.

### Engine room monitoring
- As a sailor motoring, I want a live engine room camera feed on my MFD so I can visually check for leaks, smoke, or belt issues without going below.
- As a boat owner, I want motion detection in the engine room to alert me to any unexpected activity when the engine should be off.

### Passage recording
- As a sailor on passage, I want automatic time-lapse recording from my stern or cockpit camera to capture highlights of the voyage.
- As a cruiser, I want to capture snapshots with GPS position and timestamp embedded so I can document anchorages and conditions.

### Remote monitoring
- As a boat owner away from the boat, I want to view camera feeds remotely via the hub so I can visually check on the boat from shore.

### Multi-camera awareness
- As a skipper docking, I want a 4-camera grid view (bow, stern, port, starboard) on my nav station display so I can see all around the boat from one screen.

---

## 3. Supported Protocols

### 3.1 RTSP (Real Time Streaming Protocol)

The primary integration protocol. Most IP cameras expose an RTSP endpoint for live video streaming.

- The spoke connects to each camera's RTSP URL (typically `rtsp://{ip}:{port}/stream1`)
- Authentication via camera username/password stored encrypted in the spoke's local config
- H.264 and H.265 codec support
- The spoke proxies RTSP to browser-compatible formats (see section 3.3)

### 3.2 ONVIF (Open Network Video Interface Forum)

ONVIF is an industry standard for IP camera interoperability. Used for camera discovery and management, not for video streaming (which uses RTSP).

- **Device discovery:** the spoke scans the local network for ONVIF-compatible cameras via WS-Discovery multicast
- **Profile S (streaming):** query camera capabilities, get RTSP stream URLs, control PTZ (pan-tilt-zoom) if supported
- **Profile T (advanced streaming):** H.265 support, bidirectional audio, metadata streaming
- **Events:** ONVIF event subscription for camera-side motion detection events

Cameras that support ONVIF can be auto-discovered and configured without the user manually entering RTSP URLs. For cameras without ONVIF support, the user enters the RTSP URL manually.

### 3.3 Browser Delivery

Browsers cannot natively consume RTSP streams. The spoke transcodes or repackages the stream for browser delivery:

| Method | Latency | CPU Cost | Use Case |
|--------|---------|----------|----------|
| **MSE + fMP4** (via ffmpeg) | 0.5-2s | Medium | Primary method. ffmpeg demuxes RTSP, repackages H.264 as fragmented MP4, delivers via WebSocket to browser MediaSource Extensions. |
| **WebRTC** | < 0.5s | Higher | Low-latency option for PTZ cameras and active docking situations. |
| **HLS** | 5-15s | Low | Fallback for remote/hub viewing where latency is acceptable. Segment-based, cacheable. |
| **MJPEG** | 1-2s | Low (no transcode) | Legacy cameras that only output MJPEG. Direct passthrough. |

The default is MSE + fMP4, which provides a good balance of low latency and reasonable CPU usage on the spoke hardware (Mac Mini M4).

### 3.4 Camera Configuration

Each camera is registered in the data model at `cameras/feeds/{id}`:

```json
{
  "id": "engine_room",
  "name": "Engine Room",
  "location": "engine_room",
  "rtsp_url": "rtsp://192.168.1.50:554/stream1",
  "onvif_url": "http://192.168.1.50:80/onvif/device_service",
  "username": "admin",
  "resolution": "1920x1080",
  "fps": 15,
  "codec": "h264",
  "ptz": false,
  "audio": false,
  "night_vision": true,
  "motion_detection": true,
  "status": "online"
}
```

---

## 4. Camera Feeds

### 4.1 Single Camera View

Full-screen (or half-screen in split view) display of a single camera feed.

- Camera name and status overlay in the top-left corner (semi-transparent, auto-hides after 3 seconds)
- Timestamp overlay in the bottom-right (continuous, from the spoke's clock)
- Tap to show/hide the overlay controls
- Pinch to zoom (digital zoom on the video frame)
- If the camera supports PTZ, on-screen controls appear for pan, tilt, and zoom
- Snapshot button: captures the current frame with GPS position and timestamp metadata, saves to local storage
- Full-screen toggle when in split view

### 4.2 Multi-Camera Grid

Grid view showing 2, 4, 6, or 9 camera feeds simultaneously.

| Grid | Layout | Use Case |
|------|--------|----------|
| 2-up | Side by side or stacked | Engine room + cockpit |
| 4-up | 2x2 grid | Bow, stern, port, starboard for docking |
| 6-up | 3x2 grid | Full coverage: engine room, cockpit, bow, stern, mast, anchor |
| 9-up | 3x3 grid | Maximum density for large monitoring installations |

- Tap any feed to expand it to single view; tap again or swipe back to return to grid
- Each feed shows camera name label
- Offline cameras show a "No Signal" placeholder with the camera name and last-seen timestamp
- Grid layout adapts to screen size — a 7" display caps at 4-up; 16"+ displays support 9-up

### 4.3 Camera Cycling

Auto-cycle mode rotates through cameras at a configurable interval (5s, 10s, 30s, 60s) in single-view mode. Useful for monitoring multiple cameras on a small display without manual switching.

---

## 5. Motion Detection

### 5.1 Architecture

Motion detection runs on the spoke, not on the camera (though camera-side ONVIF motion events are accepted as an additional signal). This ensures consistent behaviour regardless of camera brand.

**Detection method:**
- Frame differencing: compare consecutive frames, calculate pixel-change percentage
- Region of interest (ROI): user-defined zones within the camera frame where motion matters (ignore swaying lines, moving water reflections)
- Sensitivity threshold: configurable per camera (low, medium, high, or custom percentage)
- Minimum motion duration: ignore transient changes shorter than N seconds (waves, shadows)

### 5.2 Detection Zones

Users can draw rectangular ROI zones on the camera feed to focus detection:

- **Engine room:** detect motion anywhere in frame (nothing should be moving when the engine is off)
- **Cockpit:** draw a zone around the boarding area, exclude areas with awning movement
- **Anchor/foredeck:** draw a zone around the anchor chain and rode, exclude wave splash zones

### 5.3 Alert Actions

When motion is detected:

| Action | Detail |
|--------|--------|
| **Snapshot capture** | Save the frame that triggered the alert, plus 2 seconds of pre-buffer |
| **Video clip** | Record a 30-second clip starting 5 seconds before the trigger |
| **On-screen alert** | Flash the camera tile border coral, show "Motion Detected" overlay |
| **Notification** | Push alert to the Above Deck notification system |
| **Audio alarm** | Optional audible alert via the spoke's audio output |
| **AI escalation** | Notify the Engineer agent for logging; if cockpit intrusion, escalate to a high-priority security alert |

### 5.4 Scheduling

Motion detection can be scheduled:

- **Always on** — continuous monitoring
- **At anchor only** — active when the anchor watch app reports an active anchor position
- **Time-based** — active between configurable hours (e.g., 22:00 - 06:00)
- **Manual** — user enables/disables via dashboard toggle

---

## 6. Time-Lapse

### 6.1 Capture Modes

| Mode | Frame Rate | Storage | Use Case |
|------|-----------|---------|----------|
| **Anchor watch** | 1 frame per 30s | ~5 MB/hr (JPEG, 1080p) | Overnight anchor monitoring — review the night in 2 minutes |
| **Passage** | 1 frame per 60s | ~2.5 MB/hr | Multi-day passage condensed to a few minutes |
| **Fast** | 1 frame per 5s | ~30 MB/hr | Docking manoeuvres, harbour entry |
| **Custom** | User-defined interval | Varies | Any interval from 1s to 300s |

### 6.2 Storage and Playback

- Time-lapse frames stored on the spoke's local filesystem in `/data/timelapse/{camera_id}/{date}/`
- Frames are JPEG files named by timestamp
- The spoke assembles frames into an MP4 video on demand (ffmpeg) when the user requests playback
- Playback controls: play, pause, speed (1x, 2x, 5x, 10x), scrub timeline
- Automatic cleanup: configurable retention (default 7 days for anchor watch, 30 days for passage)
- Time-lapse videos can be exported and synced to the hub for sharing

### 6.3 Automatic Triggers

- **Anchor watch:** time-lapse starts automatically when the anchor watch app is activated, stops when anchor is weighed
- **Passage:** time-lapse starts when a route is activated and the boat begins moving, stops on arrival or manual deactivation
- **Manual:** user starts/stops via the camera app interface

---

## 7. Remote Viewing

### 7.1 Via Hub

When the spoke has internet connectivity:

- Live camera feeds are proxied to the hub via the spoke-to-hub sync tunnel
- The hub re-serves the stream to the user's browser (HLS for bandwidth efficiency)
- Latency is higher than on-boat viewing (2-10 seconds depending on upstream bandwidth)
- Resolution may be reduced automatically based on available bandwidth (1080p on LAN, 720p or 480p over cellular)
- Remote viewing requires user authentication via the hub

### 7.2 Bandwidth Management

Camera streams are the most bandwidth-intensive data the spoke syncs to the hub. Controls:

| Setting | Default | Description |
|---------|---------|-------------|
| Remote stream resolution | 720p | Max resolution for hub-proxied feeds |
| Remote stream FPS | 10 | Max frame rate for hub viewing |
| Remote stream bitrate | 1 Mbps | Max bitrate per camera |
| Max concurrent remote streams | 2 | Limit to prevent saturating upstream |
| Metered connection behaviour | Snapshots only | On metered/satellite connections, send periodic snapshots instead of live video |

### 7.3 Snapshot Fallback

When live streaming is not feasible (satellite connection, very low bandwidth, spoke offline):

- The spoke captures a snapshot from each camera at a configurable interval (every 5 min, 15 min, 1 hr)
- Snapshots are synced to the hub as part of the normal data sync
- The hub camera view shows the most recent snapshot with its timestamp
- Users can request an on-demand snapshot (the spoke captures and uploads one immediately if online)

---

## 8. MFD Integration

### 8.1 App Tile

The Cameras app appears as a tile on the MFD home screen grid. The tile icon shows a camera glyph; with Mode Icons enabled (per Raymarine pattern), the tile can show a thumbnail of the primary camera's last frame.

### 8.2 Split View

The camera feed can occupy one half of the MFD split view alongside any other app:

| Combination | Use Case |
|-------------|----------|
| Camera + Chartplotter | Monitor anchor visually while watching GPS position on chart |
| Camera + Instruments | Engine room camera alongside engine gauges while motoring |
| Camera + Anchor Watch | Primary anchor monitoring setup — visual confirmation + GPS drift alarm |
| Camera + Radar | Augment radar picture with visual identification |

In split view, the camera occupies the right or bottom panel (user's choice). Controls are minimal: camera selector dropdown, snapshot button, full-screen toggle.

### 8.3 Home Screen Tile (Live Preview)

A camera feed can be rendered as a live tile on the MFD home screen — a small, auto-updating thumbnail that gives visual awareness without opening the full camera app. Tap the tile to open the camera app full-screen.

### 8.4 Overlay on Other Apps

Future capability (foundation laid in this spec): camera feed as a picture-in-picture (PiP) overlay on any app. A small draggable camera window floats above the chartplotter or instrument dashboard. This is the stepping stone toward the ClearCruise AR-style augmented reality overlay described in the product vision.

---

## 9. Night Vision and Infrared

- Cameras with IR illumination are supported natively (the IR image is just a standard video stream in greyscale)
- The camera app detects greyscale-only frames and can apply a false-colour palette (green phosphor, thermal-style) for improved visual contrast
- No special protocol handling is needed; night vision is a camera hardware feature that is transparent to the software
- FLIR or thermal imaging cameras that output RTSP are supported through the standard camera pipeline

---

## 10. Hub vs Spoke

### 10.1 Spoke (On-Board)

- All camera processing happens on the spoke
- RTSP connection, stream transcoding (ffmpeg), motion detection, time-lapse capture, recording storage
- Direct LAN connection to cameras — minimal latency
- Full resolution and frame rate
- Local storage for recordings (spoke filesystem, not SQLite)
- Motion detection and alert evaluation run as a spoke monitoring service

### 10.2 Hub (Remote)

- Receives proxied streams or snapshots from the spoke (when connected)
- Does not connect to cameras directly (cameras are on the boat's LAN)
- Stores synced snapshots and time-lapse videos
- Serves remote viewing to authenticated users
- Displays motion detection alerts received from the spoke

### 10.3 No-Spoke Mode

Without a spoke (boat with no on-board hardware), the camera feature is not available. IP cameras require local network access, which only the spoke provides. This is a spoke-only feature.

---

## 11. Technical Implementation Notes

### 11.1 Stream Processing Pipeline

```
[IP Camera] --RTSP--> [Go RTSP client] --H.264 NAL units--> [ffmpeg process]
    --fMP4 segments--> [WebSocket server] --binary frames--> [Browser MSE API]
```

- One ffmpeg process per active camera stream
- ffmpeg runs as a managed subprocess of the Go server
- Inactive cameras (no viewer connected) do not consume CPU — streams are only decoded when a client subscribes
- Motion detection taps the pipeline at the decoded frame stage (before re-encoding to fMP4)

### 11.2 Performance Budget

| Constraint | Target |
|-----------|--------|
| CPU per 1080p stream (transcode) | < 15% of one M4 core |
| CPU per motion detection camera | < 5% of one M4 core |
| Memory per active stream | < 100 MB |
| Max concurrent local streams | 6 (limited by CPU budget) |
| Max concurrent remote streams | 2 (limited by upstream bandwidth) |
| Stream startup time (RTSP connect to first frame) | < 2 seconds |
| Motion detection latency (event to alert) | < 3 seconds |

### 11.3 Storage Budget

| Data | Retention | Estimated Size |
|------|-----------|----------------|
| Motion detection clips (30s each) | 30 days | ~50 MB/day (assuming 10 events/day) |
| Time-lapse frames (anchor watch) | 7 days | ~35 MB/night |
| Time-lapse frames (passage) | 30 days | ~60 MB/day |
| Snapshots | 90 days | ~500 KB each, negligible |

Total camera storage estimate: 5-10 GB per month. The spoke's storage (Mac Mini with 256 GB+ SSD) handles this comfortably. Automatic cleanup enforces retention limits.

### 11.4 Camera Health Monitoring

- The spoke pings each registered camera every 30 seconds
- Connection failures are tracked: if a camera goes offline, the data model path `cameras/feeds/{id}/status` changes to `offline`
- Repeated failures generate an alert: "Engine Room camera offline for 15 minutes"
- Camera metrics (uptime, stream errors, reconnect count) available in the boat management interface

---

## 12. Recommended Camera Hardware

This is not prescriptive — any RTSP-compatible IP camera works. These are community-tested options for common marine installations:

| Location | Recommended Type | Considerations |
|----------|-----------------|----------------|
| Engine room | Fixed dome, IR night vision, wide angle | Heat-rated to 60C, vibration-resistant mount, wired Ethernet preferred (PoE) |
| Cockpit | Dome or bullet, weatherproof (IP67+), IR | UV-resistant housing, wide dynamic range for sun/shade |
| Anchor/bow | PTZ or fixed wide angle, weatherproof | Salt spray resistant, consider heated lens for cold climates |
| Mast | Fixed wide angle, compact, weatherproof | Vibration dampening, cable routing through mast |
| Stern | Fixed bullet, weatherproof, IR | Docking and MOB visual reference |

PoE (Power over Ethernet) cameras are preferred on boats — they require only a single Ethernet cable for both power and data, reducing installation complexity. A small PoE switch near the spoke provides power and network for all wired cameras.

---

## 13. Out of Scope

- AR (augmented reality) overlay of AIS targets and chart data on camera feeds (future feature, foundation laid here)
- Facial recognition or person identification
- Two-way audio / intercom via camera
- Analogue camera input (BNC/composite) — only IP cameras via RTSP
- Cloud recording or cloud-based motion detection (all processing is on the spoke)
- Integration with external NVR (network video recorder) systems
