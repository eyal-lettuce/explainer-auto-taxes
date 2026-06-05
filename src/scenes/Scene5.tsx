import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, staticFile } from "remotion";
import type { SceneConfig } from "../SceneConfig";

// ── Layout ────────────────────────────────────────────────────────────────────
const SVG_CENTER_X = 544;
const SVG_CENTER_Y = 540;

const LETTUCE_SIZE = 420;

// income-and-taxes.svg used only for the magnified view
const SVG_DISPLAY_SIZE = 624;
const SVG_DISPLAY_HEIGHT = SVG_DISPLAY_SIZE * (527 / 524);
const SVG_X = SVG_CENTER_X - SVG_DISPLAY_SIZE / 2;
const SVG_Y = SVG_CENTER_Y - SVG_DISPLAY_HEIGHT / 2;

// ── Magnifier ─────────────────────────────────────────────────────────────────
const MAGNIFY_SIZE = 300;
const LENS_OFFSET_X = (131.292 / 310) * MAGNIFY_SIZE;
const LENS_OFFSET_Y = (118.292 / 310) * MAGNIFY_SIZE;
const LENS_RADIUS = (86 / 310) * MAGNIFY_SIZE;

// ── Coins ─────────────────────────────────────────────────────────────────────
const COIN_SIZE = 100;
const COIN_LEFT_DX  = -210;
const COIN_LEFT_DY  = -230;
const COIN_RIGHT_DX =  210;
const COIN_RIGHT_DY = -230;

// ── Timing ────────────────────────────────────────────────────────────────────
const LETTUCE_FADE_FRAMES    = 25;
const GLASS_APPEAR_FRAME     = 5;
const GLASS_FADE_IN_FRAMES   = 15;
const GLASS_OUT_START        = 93;
const GLASS_OUT_FRAMES       = 12;   // glass fully out at frame 105

const COIN_LEFT_START        = 120;
const COIN_RIGHT_START       = 130;
const COIN_FADE_FRAMES       = 8;
const LABEL_DELAY            = 15;   // frames after coin start before label appears
const LABEL_FADE_FRAMES      = 8;
const FLOAT_DELAY            = 10;   // frames after label before float starts
const FLOAT_DUR              = 28;

const MAG = 1.5;

const Scene5Overlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Lettuce ────────────────────────────────────────────────────────────────
  const lettuceOpacity = interpolate(frame, [0, LETTUCE_FADE_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Magnifier ──────────────────────────────────────────────────────────────
  const glassIn = interpolate(
    frame,
    [GLASS_APPEAR_FRAME, GLASS_APPEAR_FRAME + GLASS_FADE_IN_FRAMES],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const glassOut = interpolate(
    frame,
    [GLASS_OUT_START, GLASS_OUT_START + GLASS_OUT_FRAMES],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const glassOpacity = glassIn * glassOut;

  const t = Math.max(0, frame - GLASS_APPEAR_FRAME);
  const lensCX =
    SVG_CENTER_X + Math.sin(t * 0.049) * 172 + Math.cos(t * 0.027 + 1.5) * 70;
  const lensCY =
    SVG_CENTER_Y + Math.sin(t * 0.068 + 0.7) * 116 + Math.cos(t * 0.040) * 47;

  const glassX = lensCX - LENS_OFFSET_X;
  const glassY = lensCY - LENS_OFFSET_Y;

  const magnifiedX = MAG * SVG_X - (MAG - 1) * lensCX;
  const magnifiedY = MAG * SVG_Y - (MAG - 1) * lensCY;
  const clipLeft = lensCX - LENS_RADIUS;
  const clipTop  = lensCY - LENS_RADIUS;

  // ── Left coin ──────────────────────────────────────────────────────────────
  const leftSpring = spring({
    frame: frame - COIN_LEFT_START,
    fps,
    config: { damping: 11, stiffness: 100, mass: 0.8 },
  });

  const leftLabelStart = COIN_LEFT_START + LABEL_DELAY;
  const leftFloatStart = leftLabelStart + FLOAT_DELAY;

  const leftFloatT = interpolate(
    frame,
    [leftFloatStart, leftFloatStart + FLOAT_DUR],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const leftFloatE = leftFloatT * leftFloatT; // ease-in

  const coinLeftX = SVG_CENTER_X + leftSpring * COIN_LEFT_DX;
  const coinLeftY = SVG_CENTER_Y + leftSpring * COIN_LEFT_DY + leftFloatE * -600;

  const leftCoinOpacity = interpolate(
    frame, [COIN_LEFT_START, COIN_LEFT_START + COIN_FADE_FRAMES], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const leftLabelOpacity = interpolate(
    frame, [leftLabelStart, leftLabelStart + LABEL_FADE_FRAMES], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // ── Right coin ─────────────────────────────────────────────────────────────
  const rightSpring = spring({
    frame: frame - COIN_RIGHT_START,
    fps,
    config: { damping: 11, stiffness: 100, mass: 0.8 },
  });

  const rightLabelStart = COIN_RIGHT_START + LABEL_DELAY;
  const rightFloatStart = rightLabelStart + FLOAT_DELAY;

  const rightFloatT = interpolate(
    frame,
    [rightFloatStart, rightFloatStart + FLOAT_DUR],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const rightFloatE = rightFloatT * rightFloatT; // ease-in

  const coinRightX = SVG_CENTER_X + rightSpring * COIN_RIGHT_DX;
  const coinRightY = SVG_CENTER_Y + rightSpring * COIN_RIGHT_DY + rightFloatE * -600;

  const rightCoinOpacity = interpolate(
    frame, [COIN_RIGHT_START, COIN_RIGHT_START + COIN_FADE_FRAMES], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const rightLabelOpacity = interpolate(
    frame, [rightLabelStart, rightLabelStart + LABEL_FADE_FRAMES], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const labelStyle: React.CSSProperties = {
    position: "absolute",
    transform: "translateX(-50%)",
    color: "#F97316",
    fontFamily: "sans-serif",
    fontWeight: 800,
    fontSize: 32,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    zIndex: 0,
  };

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>

      {/* ── Left coin + label — behind lettuce ──────────────────────────────── */}
      {frame >= COIN_LEFT_START && (
        <>
          <img
            src={staticFile("coin-tax.svg")}
            style={{
              position: "absolute",
              left: coinLeftX - COIN_SIZE / 2,
              top: coinLeftY - COIN_SIZE / 2,
              width: COIN_SIZE,
              height: COIN_SIZE,
              opacity: leftCoinOpacity,
              zIndex: 0,
            }}
            alt=""
          />
          <div
            style={{
              ...labelStyle,
              left: coinLeftX,
              top: coinLeftY - COIN_SIZE / 2 - 42,
              opacity: leftLabelOpacity * leftCoinOpacity,
            }}
          >
            Federal
          </div>
        </>
      )}

      {/* ── Right coin + label — behind lettuce ─────────────────────────────── */}
      {frame >= COIN_RIGHT_START && (
        <>
          <img
            src={staticFile("coin-tax.svg")}
            style={{
              position: "absolute",
              left: coinRightX - COIN_SIZE / 2,
              top: coinRightY - COIN_SIZE / 2,
              width: COIN_SIZE,
              height: COIN_SIZE,
              opacity: rightCoinOpacity,
              zIndex: 0,
            }}
            alt=""
          />
          <div
            style={{
              ...labelStyle,
              left: coinRightX,
              top: coinRightY - COIN_SIZE / 2 - 42,
              opacity: rightLabelOpacity * rightCoinOpacity,
            }}
          >
            State
          </div>
        </>
      )}

      {/* ── Lettuce shape (z-index 1) ────────────────────────────────────────── */}
      <img
        src={staticFile("lettuce-shape.svg")}
        style={{
          position: "absolute",
          left: SVG_CENTER_X - LETTUCE_SIZE / 2,
          top: SVG_CENTER_Y - LETTUCE_SIZE / 2,
          width: LETTUCE_SIZE,
          height: LETTUCE_SIZE,
          opacity: lettuceOpacity,
          zIndex: 1,
        }}
        alt=""
      />

      {/* ── Dark oval masks lettuce behind the lens (z-index 2) ─────────────── */}
      {glassOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            left: lensCX - LENS_RADIUS - 4,
            top: lensCY - LENS_RADIUS - 4,
            width: (LENS_RADIUS + 4) * 2,
            height: (LENS_RADIUS + 4) * 2,
            borderRadius: "50%",
            background: "#013438",
            opacity: lettuceOpacity * glassOpacity,
            zIndex: 2,
          }}
        />
      )}

      {/* ── Magnified income-and-taxes.svg clipped to lens (z-index 3) ───────── */}
      {glassOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            left: clipLeft,
            top: clipTop,
            width: LENS_RADIUS * 2,
            height: LENS_RADIUS * 2,
            borderRadius: "50%",
            overflow: "hidden",
            opacity: lettuceOpacity * glassOpacity,
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
      )}

      {/* ── Magnifying glass frame (z-index 4) ───────────────────────────────── */}
      {glassOpacity > 0 && (
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
      )}
    </div>
  );
};

export const sceneConfig: SceneConfig = {
  video: "video5.mp4",
  hostX: "20%",
  hostZoom: "closeUp",
  overlay: Scene5Overlay,
};
