import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, staticFile } from "remotion";
import type { SceneConfig } from "../SceneConfig";

// ── Layout (fractions of 1920×1080) ──────────────────────────────────────────
const LETTUCE_CX = 0.68;
const LETTUCE_CY = 0.50;
const TAX_CX = 0.813;
const TAX_CY = 0.50;

// ── Sizes (px) ────────────────────────────────────────────────────────────────
const LETTUCE_SIZE = 230;
const COG_SIZE = 125;
const INCOME_COIN_SIZE = 80;
const TAX_COIN_TRAVEL_SIZE = 52;
const TAX_PILE_BASE_SIZE = 70;
const TAX_PILE_INCREMENT = 26;

// ── Timing ────────────────────────────────────────────────────────────────────
const LETTUCE_POP_FRAME = 20;
const FALL_FRAMES = 28;
const TAX_TRAVEL_FRAMES = 16;
const COIN_FADE_FRAMES = 5;

// ── Seeded coin drops — 3 cycles complete before frame 180 ───────────────────
// Cycle N completes at: startFrame + FALL_FRAMES + TAX_TRAVEL_FRAMES
// → 94, 134, 174 (all < 180)
const COIN_DROPS = [
  { startFrame: 50,  xFrac: LETTUCE_CX, rotation: 18 },
  { startFrame: 90,  xFrac: LETTUCE_CX, rotation: -25 },
  { startFrame: 130, xFrac: LETTUCE_CX, rotation: 30 },
] as const;

const Scene4Overlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Lettuce + Cog pop-in ───────────────────────────────────────────────────
  const lettucePopScale = spring({
    frame: frame - LETTUCE_POP_FRAME,
    fps,
    config: { damping: 10, stiffness: 120, mass: 0.5 },
  });

  const activeFrame = Math.max(0, frame - LETTUCE_POP_FRAME);
  const lettuceRotation = -activeFrame * 0.3;
  const cogRotation = activeFrame * 0.5;

  const lx = LETTUCE_CX * 100;
  const ly = LETTUCE_CY * 100;
  const tx = TAX_CX * 100;
  const ty = TAX_CY * 100;

  // ── Tax pile state ─────────────────────────────────────────────────────────
  const arrivalFrames = COIN_DROPS.map(
    (c) => c.startFrame + FALL_FRAMES + TAX_TRAVEL_FRAMES
  );
  const completedArrivals = arrivalFrames.filter((af) => frame >= af);
  const arrivedCount = completedArrivals.length;
  const latestArrivalFrame =
    completedArrivals.length > 0 ? Math.max(...completedArrivals) : -1;

  // First coin stays at traveling size (no pop/animation).
  // Growth starts only when a second coin joins.
  const targetPileSize =
    arrivedCount === 1
      ? TAX_COIN_TRAVEL_SIZE
      : TAX_PILE_BASE_SIZE + Math.max(0, arrivedCount - 2) * TAX_PILE_INCREMENT;
  const prevPileSize =
    arrivedCount <= 2
      ? TAX_COIN_TRAVEL_SIZE
      : TAX_PILE_BASE_SIZE + Math.max(0, arrivedCount - 3) * TAX_PILE_INCREMENT;

  const pileGrowSpring =
    latestArrivalFrame >= 0
      ? spring({
          frame: frame - latestArrivalFrame,
          fps,
          config: { damping: 8, stiffness: 200, mass: 0.3 },
        })
      : 0;

  const animatedPileSize =
    prevPileSize + (targetPileSize - prevPileSize) * pileGrowSpring;
  const pileVisible = arrivedCount > 0;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>

      {/* ── Income coins — behind lettuce (z-index 1) ─────────────────────── */}
      {COIN_DROPS.map((coin, i) => {
        if (frame < coin.startFrame || frame >= coin.startFrame + FALL_FRAMES)
          return null;

        const elapsed = frame - coin.startFrame;
        // Ease-in fall
        const t = elapsed / FALL_FRAMES;
        const fallEased = t * t;

        const coinY = interpolate(fallEased, [0, 1], [-8, ly]);
        const coinX = coin.xFrac * 100;
        const coinRotation = coin.rotation + elapsed * 0.9;

        const opacity = interpolate(
          frame,
          [
            coin.startFrame + FALL_FRAMES - COIN_FADE_FRAMES,
            coin.startFrame + FALL_FRAMES,
          ],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={`income-${i}`}
            style={{
              position: "absolute",
              left: `${coinX}%`,
              top: `${coinY}%`,
              width: INCOME_COIN_SIZE,
              height: INCOME_COIN_SIZE,
              transform: `translate(-50%, -50%) rotate(${coinRotation}deg)`,
              opacity,
              zIndex: 1,
            }}
          >
            <img
              src={staticFile("coin-income.svg")}
              style={{ width: "100%", height: "100%", display: "block" }}
              alt=""
            />
          </div>
        );
      })}

      {/* ── Lettuce shape (z-index 2 — occludes falling coins) ────────────── */}
      <div
        style={{
          position: "absolute",
          left: `${lx}%`,
          top: `${ly}%`,
          width: LETTUCE_SIZE,
          height: LETTUCE_SIZE,
          transform: `translate(-50%, -50%) scale(${lettucePopScale}) rotate(${lettuceRotation}deg)`,
          zIndex: 2,
        }}
      >
        <img
          src={staticFile("lettuce-shape.svg")}
          style={{ width: "100%", height: "100%", display: "block" }}
          alt=""
        />
      </div>

      {/* ── Cog centered on lettuce (z-index 3) ───────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: `${lx}%`,
          top: `${ly}%`,
          width: COG_SIZE,
          height: COG_SIZE,
          transform: `translate(-50%, -50%) scale(${lettucePopScale}) rotate(${cogRotation}deg)`,
          zIndex: 3,
        }}
      >
        <img
          src={staticFile("cog.svg")}
          style={{ width: "100%", height: "100%", display: "block" }}
          alt=""
        />
      </div>

      {/* ── Traveling tax coins (lettuce → target) ─────────────────────────── */}
      {COIN_DROPS.map((coin, i) => {
        const travelStart = coin.startFrame + FALL_FRAMES;
        const travelEnd = travelStart + TAX_TRAVEL_FRAMES;
        if (frame < travelStart || frame >= travelEnd) return null;

        const t = (frame - travelStart) / TAX_TRAVEL_FRAMES;
        // Ease-out
        const tEased = 1 - Math.pow(1 - t, 2);

        const taxX = lx + (tx - lx) * tEased;
        const taxY = ly + (ty - ly) * tEased;

        const opacity = interpolate(
          frame,
          [travelEnd - 4, travelEnd],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={`tax-travel-${i}`}
            style={{
              position: "absolute",
              left: `${taxX}%`,
              top: `${taxY}%`,
              width: TAX_COIN_TRAVEL_SIZE,
              height: TAX_COIN_TRAVEL_SIZE,
              transform: "translate(-50%, -50%)",
              opacity,
              zIndex: 1,
            }}
          >
            <img
              src={staticFile("coin-payroll.svg")}
              style={{ width: "100%", height: "100%", display: "block" }}
              alt=""
            />
          </div>
        );
      })}

      {/* ── Tax pile at target (grows with each arrival) ───────────────────── */}
      {pileVisible && (
        <div
          style={{
            position: "absolute",
            left: `${tx}%`,
            top: `${ty}%`,
            width: animatedPileSize,
            height: animatedPileSize,
            transform: "translate(-50%, -50%)",
            zIndex: 1,
          }}
        >
          <img
            src={staticFile("coin-payroll.svg")}
            style={{ width: "100%", height: "100%", display: "block" }}
            alt=""
          />
        </div>
      )}
    </div>
  );
};

export const sceneConfig: SceneConfig = {
  video: "video4.mp4",
  hostX: "-20%",
  overlay: Scene4Overlay,
};
