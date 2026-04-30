# instructions.txt

PROJECT NAME:
AI Gesture-Controlled Indian Bamboo Flute (Bansuri) Web App

====================================================
OVERVIEW
====================================================

Build a responsive web application that uses the device webcam and real-time hand/finger gesture tracking to simulate playing an Indian bamboo flute (bansuri).

The application should:

1. Detect a real flute held in the user’s hand.
2. Track finger placement over 6 flute holes.
3. Detect start and stop gestures.
4. Play accurate and melodious Indian bansuri swaras/notes.
5. Render a beautiful animated 3D Indian bamboo flute in the center of the screen.
6. Animate virtual fingers over the flute holes corresponding to detected finger positions.
7. Highlight closed/open holes visually.
8. Support half-hole gestures for notes such as Ma.
9. Work smoothly on both desktop/laptop and mobile devices.
10. Maintain low latency and highly responsive audio playback.

====================================================
CORE USER EXPERIENCE
====================================================

USER FLOW:

1. User opens web app.
2. Webcam permission is requested.
3. Camera feed appears in a small adaptive floating preview window.
4. 3D animated bansuri appears in center screen.
5. User holds flute in playing position.
6. Gesture tracking activates.
7. User performs “start playing” gesture.
8. Finger placements are continuously analyzed.
9. Corresponding swara/note is played instantly.
10. 3D flute animation updates in real time.
11. User performs “stop playing” gesture.
12. Audio stops gracefully.

====================================================
RESPONSIVE UI REQUIREMENTS
====================================================

GENERAL:

- Responsive layout for:
  - phones
  - tablets
  - laptops
  - desktops

- Smooth 60 FPS rendering where possible.
- GPU acceleration preferred.
- Avoid UI clutter.
- Elegant immersive dark aesthetic.
- Traditional Indian bamboo visual theme.

LAYOUT:

Desktop:
- 3D flute centered horizontally.
- Webcam preview bottom-right corner.
- Controls minimal and semi-transparent.

Mobile:
- 3D flute scaled proportionally.
- Webcam preview top-right or bottom-right.
- Avoid blocking flute visualization.
- Touch-safe margins.

WEBCAM PREVIEW:

- Small floating rounded rectangle.
- Auto-scaled based on screen size.
- Mirror mode enabled.
- Optional opacity adjustment.

====================================================
TECH STACK
====================================================

FRONTEND:
- React
- Vite
- TypeScript preferred

3D ENGINE:
- Three.js
OR
- React Three Fiber

GESTURE TRACKING:
- MediaPipe Hands
- MediaPipe Pose (optional)

ANIMATION:
- Framer Motion
- GSAP (optional)

AUDIO:
- Web Audio API
OR
- Tone.js

STATE MANAGEMENT:
- Zustand or lightweight React state

DEPLOYMENT:
- Vercel preferred

====================================================
WEBCAM + GESTURE SYSTEM
====================================================

CAMERA:

- Use real-time webcam feed.
- Support front-facing mobile cameras.
- Mirror video naturally.
- Optimize for low latency.

HAND TRACKING:

Use MediaPipe Hands to track:

- fingertip landmarks
- joint positions
- finger curvature
- pinch states
- angle rotations

Track both hands if needed.

====================================================
FLUTE DETECTION LOGIC
====================================================

SYSTEM GOAL:

Detect whether fingers are covering virtual flute hole positions.

IMPLEMENTATION IDEA:

1. Define virtual flute hole coordinates.
2. Map tracked finger positions onto flute axis.
3. Determine whether each hole is:
   - fully closed
   - half closed
   - open

HOLE STATES:

- CLOSED
- HALF_OPEN
- OPEN

====================================================
INDIAN BANSURI NOTE MAPPING
====================================================

Use 6-hole Indian bansuri fingering.

NOTES / SWARAS:

Sa
Re
Ga
Ma
Pa
Dha
Ni
Sa (upper octave optional)

====================================================
FINGERING RULES
====================================================

NOTE: Exact mappings can later be configurable.

Example standard mapping:

Pa:
- all 6 holes closed

Dha:
- bottom hole open

Ni:
- bottom 2 holes open

Sa:
- bottom 3 holes open

Re:
- bottom 4 holes open

Ga:
- bottom 5 holes open

Ma:
- half-hole gesture

====================================================
SPECIAL HALF-HOLE MECHANISM FOR MA
====================================================

IMPORTANT FEATURE:

Ma should support authentic half-hole fingering.

IMPLEMENTATION:

When the upper index finger tilts slightly sideways:

- detect partial hole exposure
- classify as HALF_OPEN
- trigger Ma swara

Detection strategy:

1. Analyze finger angle.
2. Detect lateral rotation.
3. Detect partial overlap region.
4. Use confidence thresholds.
5. Smooth values to avoid jitter.

Suggested thresholds:

- FULL_CLOSE >= 85% coverage
- HALF_OPEN between 35% and 70%
- OPEN below 35%

Use temporal smoothing.

====================================================
START / STOP GESTURES
====================================================

START PLAYING GESTURE:

Suggested options:

Option A:
- Open palm for 1 second

Option B:
- Pinch gesture

Option C:
- Raise thumb briefly

STOP PLAYING GESTURE:

Suggested options:

Option A:
- Closed fist

Option B:
- Double pinch

Option C:
- Palm away from camera

System should:

- avoid accidental triggering
- debounce gestures
- use confidence scoring

====================================================
AUDIO REQUIREMENTS
====================================================

CRITICAL:

Audio quality must feel authentic, clean, and melodious.

REQUIREMENTS:

- Low latency.
- No clipping.
- No overlapping artifacts.
- Smooth transitions.
- Natural bamboo timbre.
- Sustain and breath realism.

NOTES:

- Use high-quality bansuri note samples.
OR
- Use physically inspired synthesis.

RECOMMENDED:

Use sampled Indian bansuri recordings.

AUDIO FEATURES:

- ADSR envelope
- subtle reverb
- soft attack
- natural decay
- optional breath ambience

SMOOTH NOTE TRANSITIONS:

- Crossfade notes slightly.
- Avoid abrupt cuts.
- Add legato behavior.

====================================================
SONG PLAYABILITY
====================================================

The app should support playing actual melodies.

IMPORTANT:

- Fast note switching.
- Stable detection.
- Distinct swara separation.
- Accurate rhythmic responsiveness.

OPTIMIZATION TARGETS:

- Detection latency under 40ms preferred.
- Audio response under 20ms preferred.

====================================================
3D BANSURI VISUALIZATION
====================================================

MAIN VISUAL:

A realistic animated 3D Indian bamboo flute.

VISUAL REQUIREMENTS:

- Bamboo texture.
- Traditional bindings.
- Soft cinematic lighting.
- Smooth animations.
- Realistic proportions.

CENTER SCREEN POSITIONING:

- Flute horizontally centered.
- Slight perspective angle.
- Gentle idle movement.

====================================================
ANIMATED FINGER SYSTEM
====================================================

Display animated virtual fingers over flute holes.

WHEN USER COVERS A HOLE:

- corresponding animated finger presses hole
- hole highlights softly
- note indicator updates

HALF-HOLE VISUALIZATION:

For Ma:

- animated finger tilts partially
- show partially exposed hole visually

VISUAL FEEDBACK:

- glowing indicators
- subtle pulse effects
- swara label display

====================================================
SWARA DISPLAY
====================================================

Show current active swara elegantly.

Example:

SA
RE
GA
MA
PA
DHA
NI

OPTIONAL:

- Sanskrit script display
- waveform pulse
- frequency visualization

====================================================
PERFORMANCE OPTIMIZATION
====================================================

IMPORTANT:

Application must remain fast even on mobile.

OPTIMIZATIONS:

- GPU rendering
- requestAnimationFrame loops
- memoized components
- avoid unnecessary rerenders
- lightweight shaders
- compressed assets
- adaptive quality settings

HAND TRACKING OPTIMIZATION:

- lower detection resolution on weak devices
- dynamic FPS adaptation
- smoothing filters

====================================================
ANIMATION STYLE
====================================================

VISUAL FEEL:

- elegant
- spiritual
- immersive
- cinematic
- Indian classical aesthetic

DO NOT:

- make UI cartoonish
- overload interface
- create distracting effects

====================================================
OPTIONAL ADVANCED FEATURES
====================================================

1. Raga mode.
2. Song tutorial mode.
3. Guided fingering lessons.
4. Multiplayer jam session.
5. AI note correction.
6. Breath detection using microphone.
7. Dynamic tanpura drone background.
8. Recording and playback.
9. MIDI export.
10. AR flute overlays.

====================================================
PROJECT STRUCTURE SUGGESTION
====================================================

src/

components/
- WebcamView
- GestureTracker
- Flute3D
- FingerAnimator
- SwaraDisplay
- AudioEngine

systems/
- handTracking
- gestureRecognition
- holeDetection
- audioMapping
- smoothing

assets/
- fluteModels
- bansuriSamples
- textures

shaders/
- bambooShader
- glowShader

====================================================
ACCESSIBILITY
====================================================

- Responsive scaling.
- Graceful fallback if webcam unavailable.
- Clear permission prompts.
- Mobile-safe UI spacing.
- Adjustable sensitivity settings.

====================================================
FINAL GOAL
====================================================

Create a highly immersive and responsive AI-powered Indian bansuri simulation web application that:

- feels authentic
- sounds melodious
- visually teaches fingering
- supports expressive musical performance
- works smoothly on mobile and desktop
- provides accurate swara detection using natural flute hand gestures

The final experience should feel like a fusion of:

- Indian classical music
- gesture-based interaction
- real-time AI vision
- cinematic 3D visuals
- musical performance art

