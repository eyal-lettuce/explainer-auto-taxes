# Auto-Taxes Explainer Video

Remotion project — a green-screen host composited over animated leaf backgrounds with per-scene overlays.

Single composition: `auto-taxes`.

## Scene architecture

Each scene is defined in its own file (`src/scenes/Scene{N}.tsx`) and exports a `sceneConfig` object of type `SceneConfig`. Scenes with overlays also export the overlay React component. `src/segments.ts` aggregates all scene configs into an ordered array.

Each segment maps to one green-screen video file in `public/`.

### Layer order (back to front)

1. **AnimatedBackground** — shared across all segments (`src/AnimatedBackground.tsx`)
2. **Secondary video** — optional chroma-keyed overlay clip, rendered behind the host
3. **Overlay** — optional per-scene React component (`src/scenes/Scene{N}.tsx`), rendered *behind* the host
4. **Host** — chroma-keyed video (`src/ChromaKeyVideo.tsx`), green screen removed at runtime

### Adding / editing a scene

1. Create or edit `src/scenes/Scene{N}.tsx`
2. Export `sceneConfig: SceneConfig` with the scene's configuration
3. If the scene has an overlay, export a React component and set `overlay` in the config
4. The overlay receives no props — use `useCurrentFrame()` / `useVideoConfig()` from Remotion for timing
5. Import the config in `src/segments.ts` and add it to the `segments` array

### SceneConfig options

- `video` — video filename inside `public/`
- `trimStart` / `trimEnd` — frames to crop from the source video
- `overlay` — React component rendered behind the host
- `showVideo` — set to `false` to hide the video (audio still plays); useful for fully animated scenes
- `showAnimatedBackground` — set to `false` to disable the leaf animation for this scene
- `hostZoom` — `"longShot"` (default) | `"mediumShot"` | `"closeUp"`
- `hostX` — horizontal shift as CSS percentage string (e.g. `"-20%"`, `"20%"`)
- `videoStyle` — CSS applied to the host video container (e.g. repositioning)
- `leafCenter` — center point `{ x, y }` for the background leaf animation (auto-derived from `hostX` when omitted)
- `secondaryVideo` — filename of an additional chroma-keyed clip
- `secondaryVideoStyle` — CSS applied to the secondary video container
- `secondaryVideoFrom` — frame at which the secondary video begins
- `extraFrames` — frames appended after the video ends (background + overlay keep playing)
- `videoFadeOutFrames` — frames at the end to visually fade out (audio continues)

## Assets

Place video files, images, fonts, and audio in `public/`. Reference them with `staticFile("filename")` in code.

## Scripts

| Command | Description |
|---|---|
| `npm run studio` | Launch Remotion Studio (hot-reload preview) |
| `npm run render` | Render to `out/auto-taxes.mp4` |
| `npm run transcribe` | Transcribe videos via Whisper and add to `src/captions/captions.json` |
