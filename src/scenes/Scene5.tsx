import React from "react";
import { useCurrentFrame, interpolate, staticFile } from "remotion";
import type { SceneConfig } from "../SceneConfig";

// ── Layout ────────────────────────────────────────────────────────────────────
const SVG_DISPLAY_SIZE = 624;
const SVG_DISPLAY_HEIGHT = SVG_DISPLAY_SIZE * (527 / 524);
const SVG_CENTER_X = 614;
const SVG_CENTER_Y = 540;
const SVG_X = SVG_CENTER_X - SVG_DISPLAY_SIZE / 2;
const SVG_Y = SVG_CENTER_Y - SVG_DISPLAY_HEIGHT / 2;

// ── Magnifier ─────────────────────────────────────────────────────────────────
// magnify.svg is 310×310; ring inner edge radius = 86, lens center ≈ (131, 118)
const MAGNIFY_SIZE = 300;
const LENS_OFFSET_X = (131.292 / 310) * MAGNIFY_SIZE; // px from glass top-left to lens center
const LENS_OFFSET_Y = (118.292 / 310) * MAGNIFY_SIZE;
const LENS_RADIUS = (86 / 310) * MAGNIFY_SIZE; // inner edge of glass ring

// ── Timing ────────────────────────────────────────────────────────────────────
const SVG_FADE_FRAMES = 25;
const GLASS_APPEAR_FRAME = 20;
const GLASS_FADE_FRAMES = 20;

// ── Magnification ─────────────────────────────────────────────────────────────
const MAG = 1.5;

const Scene5Overlay: React.FC = () => {
  const frame = useCurrentFrame();

  const svgOpacity = interpolate(frame, [0, SVG_FADE_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const glassOpacity = interpolate(
    frame,
    [GLASS_APPEAR_FRAME, GLASS_APPEAR_FRAME + GLASS_FADE_FRAMES],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Lissajous scanning path centered on the SVG
  const t = Math.max(0, frame - GLASS_APPEAR_FRAME);
  const lensCX =
    SVG_CENTER_X +
    Math.sin(t * 0.038) * 143 +
    Math.cos(t * 0.021 + 1.5) * 58;
  const lensCY =
    SVG_CENTER_Y +
    Math.sin(t * 0.052 + 0.7) * 97 +
    Math.cos(t * 0.031) * 39;

  // Glass SVG top-left
  const glassX = lensCX - LENS_OFFSET_X;
  const glassY = lensCY - LENS_OFFSET_Y;

  // Magnified SVG position: the lens center maps to itself at 1.5×
  // magnifiedOrigin = MAG * svgOrigin - (MAG - 1) * lensCenter
  const magnifiedX = MAG * SVG_X - (MAG - 1) * lensCX;
  const magnifiedY = MAG * SVG_Y - (MAG - 1) * lensCY;

  // Clip div (circular, lens-sized window)
  const clipLeft = lensCX - LENS_RADIUS;
  const clipTop = lensCY - LENS_RADIUS;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* Original income-and-taxes.svg */}
      <img
        src={staticFile("income-and-taxes.svg")}
        style={{
          position: "absolute",
          left: SVG_X,
          top: SVG_Y,
          width: SVG_DISPLAY_SIZE,
          height: SVG_DISPLAY_HEIGHT,
          opacity: svgOpacity,
          zIndex: 1,
        }}
        alt=""
      />

      {/* Dark oval — masks original SVG under the lens */}
      <div
        style={{
          position: "absolute",
          left: lensCX - LENS_RADIUS - 4,
          top: lensCY - LENS_RADIUS - 4,
          width: (LENS_RADIUS + 4) * 2,
          height: (LENS_RADIUS + 4) * 2,
          borderRadius: "50%",
          background: "#013438",
          opacity: svgOpacity * glassOpacity,
          zIndex: 2,
        }}
      />

      {/* Magnified & clipped income-and-taxes.svg */}
      <div
        style={{
          position: "absolute",
          left: clipLeft,
          top: clipTop,
          width: LENS_RADIUS * 2,
          height: LENS_RADIUS * 2,
          borderRadius: "50%",
          overflow: "hidden",
          opacity: svgOpacity * glassOpacity,
          zIndex: 3,
        }}
      >
        <img
          src={staticFile("income-and-taxes.svg")}
          style={{
            position: "absolute",
            left: magnifiedX - clipLeft,
            top: magnifiedY - clipTop,
            width: SVG_DISPLAY_SIZE * MAG,
            height: SVG_DISPLAY_HEIGHT * MAG,
          }}
          alt=""
        />
      </div>

      {/* Magnifying glass frame — rendered on top */}
      <img
        src={staticFile("magnify.svg")}
        style={{
          position: "absolute",
          left: glassX,
          top: glassY,
          width: MAGNIFY_SIZE,
          height: MAGNIFY_SIZE,
          opacity: glassOpacity,
          zIndex: 4,
        }}
        alt=""
      />
    </div>
  );
};

export const sceneConfig: SceneConfig = {
  video: "video5.mp4",
  hostX: "20%",
  hostZoom: "closeUp",
  overlay: Scene5Overlay,
};
