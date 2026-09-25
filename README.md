# Auto-Taxes Explainer Video

A [Remotion](https://www.remotion.dev/) project for the Lettuce auto-taxes explainer video. A green-screen host is composited over animated leaf backgrounds with per-scene overlays.

Single composition: `auto-taxes`.

## Output

- **Resolution:** 1920×1080
- **Frame rate:** 24 FPS
- **Scenes:** 10 sequential segments, each backed by a green-screen video clip

## Getting started

```bash
npm install
npm run studio     # open Remotion Studio for live preview
npm run render     # render to out/auto-taxes.mp4
```

## Project structure

```
src/
  index.ts                  # Remotion entry point
  Root.tsx                  # Composition definition — dynamic duration
  Timeline.tsx              # Main renderer — sequences all scenes with audio & captions
  SceneConfig.ts            # TypeScript interface for scene options
  segments.ts               # Ordered array of all scene configs
  AnimatedBackground.tsx    # Shared leaf animation background
  ChromaKeyVideo.tsx        # Runtime green-screen removal
  Captions.tsx              # Shared captions track
  fonts.ts                  # Font loading (ABCGravity, RobotoMono)
  scenes/
    Scene1.tsx … Scene10.tsx  # Per-scene config + optional overlay component
  captions/
    captions.json           # Caption data keyed by video filename

public/
  video1.mp4 … video10.mp4  # Host green-screen clips
  *.mp3                      # Background music
  *.svg / *.png              # Scene overlay assets
  ABCGravityVariable-Trial.ttf
```

## Scene architecture

### Layer order (back → front)

1. `AnimatedBackground` — leaf particle animation
2. Secondary video — optional chroma-keyed clip rendered behind the host
3. Scene overlay — optional per-scene React component
4. Host video — chroma-keyed green-screen clip

### SceneConfig options

| Field | Type | Description |
|---|---|---|
| `video` | `string` | Filename in `public/` for the host clip |
| `trimStart` | `number` | Frames to skip at the start of the clip |
| `trimEnd` | `number` | Frames to cut from the end of the clip |
| `overlay` | `React.ComponentType` | Component rendered behind the host |
| `showVideo` | `boolean` | Set `false` to hide video but keep audio |
| `showAnimatedBackground` | `boolean` | Set `false` to disable the leaf animation |
| `hostZoom` | `HostZoomLevel` | Preset zoom level for the host — see Host zoom levels below |
| `hostX` | `string` | Horizontal offset for the host as a CSS percentage (e.g. `"-20%"`, `"20%"`) |
| `videoStyle` | `CSSProperties` | Additional CSS applied to the host video container |
| `leafCenter` | `{ x, y }` | Override for the leaf animation center — auto-derived from `hostX` when omitted |
| `secondaryVideo` | `string` | Filename of an additional chroma-keyed clip |
| `secondaryVideoStyle` | `CSSProperties` | CSS applied to the secondary video container |
| `secondaryVideoFrom` | `number` | Frame (relative to segment start) at which the secondary video appears |
| `secondaryVideoMuted` | `boolean` | Mute the secondary video's audio |
| `secondaryAudio` | `string` | Separate audio file to play alongside the secondary video |
| `secondaryAudioFrom` | `number` | Frame at which the secondary audio begins (defaults to `secondaryVideoFrom`) |
| `extraFrames` | `number` | Extra frames appended after the video ends (background + overlay keep playing) |
| `videoFadeOutFrames` | `number` | Frames at the end to visually fade out (audio continues) |

### Host zoom levels

`hostZoom` selects a preset from `HOST_ZOOM_PRESETS` in `SceneConfig.ts`. Each preset sets a CSS `scale` and a `translateY` offset applied with `transformOrigin: top center`, keeping the host's head in frame as the camera zooms in.

| Level | Scale | Effect |
|---|---|---|
| `longShot` | 1.0 | Full body — default framing |
| `mediumShot` | 1.4 | Waist-up framing |
| `closeUp` | 1.85 | Shoulders-and-head framing |

Use `hostX` alongside `hostZoom` to shift the host left or right independently of the zoom level:

```ts
export const sceneConfig: SceneConfig = {
  video: "video4.mp4",
  hostZoom: "mediumShot",
  hostX: "20%",   // shift right; leaf animation follows automatically
};
```

### Adding / editing a scene

1. Create or edit `src/scenes/Scene{N}.tsx`
2. Export `sceneConfig: SceneConfig` with the scene's configuration
3. If the scene has an overlay, export a React component and set it as `overlay` in the config
4. Overlays receive no props — use `useCurrentFrame()` and `useVideoConfig()` from Remotion for timing
5. Import the config in `src/segments.ts` and add it to the `segments` array

## Scripts

| Command | Description |
|---|---|
| `npm run studio` | Launch Remotion Studio (hot-reload preview) |
| `npm run render` | Render to `out/auto-taxes.mp4` |
| `npm run transcribe` | Transcribe videos via Whisper and add to `captions.json` |

### Transcription

```bash
node scripts/transcribe.mjs                  # transcribe all videos
node scripts/transcribe.mjs video3.mp4       # transcribe a single file
node scripts/transcribe.mjs --backend openai # force OpenAI Whisper API
```

Auto-selects backend: **mlx-whisper** (local, Apple Silicon) if available, otherwise **OpenAI Whisper API** (requires `OPENAI_API_KEY`).

## Captions

`src/captions/captions.json` is keyed by video filename. Each entry is a short phrase with millisecond timestamps and per-word timing:

```json
"video1.mp4": [
  {
    "text": "Lettuce is built to take income",
    "startMs": 560, "endMs": 2100,
    "words": [
      { "word": " Lettuce", "startMs": 560, "endMs": 1080 },
      ...
    ]
  }
]
```

`Captions.tsx` finds the current phrase by converting the playhead frame to milliseconds and matching it against the active segment's entries. Words are highlighted in green as they are spoken. Re-run `npm run transcribe` after recording new clips.
