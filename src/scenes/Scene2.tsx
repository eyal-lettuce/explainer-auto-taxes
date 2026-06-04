import React from "react";
import {
  useCurrentFrame,
  interpolate,
  staticFile,
  delayRender,
  continueRender,
} from "remotion";
import type { SceneConfig } from "../SceneConfig";

// ─── Font loading ─────────────────────────────────────────────────────────────
const _fhGravity =
  typeof document !== "undefined" ? delayRender("Scene2: ABCGravity") : null;
const _fhMono =
  typeof document !== "undefined" ? delayRender("Scene2: RobotoMono") : null;

if (typeof document !== "undefined") {
  const gravity = new FontFace(
    "ABCGravity",
    `url(${staticFile("ABCGravityVariable.ttf")})`,
    { weight: "900", style: "normal" }
  );
  document.fonts.add(gravity);
  gravity
    .load()
    .then(() => continueRender(_fhGravity!))
    .catch(() => continueRender(_fhGravity!));

  const mono = new FontFace(
    "RobotoMono",
    `url(${staticFile("RobotoMono-SemiBold.woff2")})`,
    { weight: "600", style: "normal" }
  );
  document.fonts.add(mono);
  mono
    .load()
    .then(() => continueRender(_fhMono!))
    .catch(() => continueRender(_fhMono!));
}

// ─── Parameters ──────────────────────────────────────────────────────────────

/**
 * Income added in each cycle (non-rounded, two cycles in the hundreds).
 * Cumulative total reaches $121,095.
 */
const INCOME_INCREMENTS = [473, 52_847, 847, 41_451, 25_477];

/** Taxes as a fraction of income. */
const TAX_RATE = 0.3;

/** Frames each counter (income and taxes) takes to roll to its new value. */
const ROLL_FRAMES = 16;

/** Frames of pause between income settling and the tax roll starting. */
const DELAY_FRAMES = 5;

/** Frames of pause after taxes settle before the next cycle begins. */
const POST_CYCLE_PAUSE = 5;

/**
 * Per-cycle digit replacements for the tax display.
 * `cycle` is 1-based. `position` is the digit index from the right (1 = ones).
 * Replacements accumulate: once introduced they persist in all later cycles.
 */
const REPLACEMENTS: Array<{ cycle: number; position: number; char: string }> = [
  { cycle: 1, position: 3, char: "?" },
  { cycle: 2, position: 1, char: "!" },
  { cycle: 3, position: 4, char: "@" },
  { cycle: 4, position: 2, char: "#" },
];

// ─── Precomputed cumulative totals ────────────────────────────────────────────

const CUMULATIVE_INCOME = INCOME_INCREMENTS.reduce<number[]>((acc, v) => {
  acc.push((acc[acc.length - 1] ?? 0) + v);
  return acc;
}, []);

const CUMULATIVE_TAX = CUMULATIVE_INCOME.map((v) => Math.round(v * TAX_RATE));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CYCLE_FRAMES = ROLL_FRAMES + DELAY_FRAMES + ROLL_FRAMES + POST_CYCLE_PAUSE;

const ORANGE = "#F97316";

/** Scrambles from `from` toward `to` over ROLL_FRAMES, decelerating into the target. */
function rollingDisplay(elapsed: number, from: number, to: number): number {
  if (elapsed <= 0) return from;
  if (elapsed >= ROLL_FRAMES) return to;
  const p = elapsed / ROLL_FRAMES;
  const eased = 1 - Math.pow(1 - p, 3);
  const smooth = from + (to - from) * eased;
  if (p < 0.72) {
    const delta = to - from;
    const noise =
      Math.sin(elapsed * 1.1) * 0.22 +
      Math.sin(elapsed * 1.9) * 0.11 +
      Math.sin(elapsed * 0.5) * 0.07;
    return Math.max(from, Math.min(to, Math.round(smooth + delta * noise)));
  }
  return Math.round(smooth);
}

/**
 * Returns the active replacement map for a given 0-based cycle index.
 * A replacement is active if its 1-based cycle number <= cycleIndex + 1.
 */
function activeReplacements(cycleIndex: number): Map<number, string> {
  const map = new Map<number, string>();
  for (const r of REPLACEMENTS) {
    if (r.cycle <= cycleIndex + 1) {
      map.set(r.position, r.char);
    }
  }
  return map;
}

/**
 * Format `amount` as a US dollar string, substituting specific digit positions
 * (1-based from the right) with their designated replacement characters.
 */
function formatTax(amount: number, replacements: Map<number, string>): string {
  const formatted = `$${amount.toLocaleString("en-US")}`;
  if (replacements.size === 0) return formatted;
  const chars = formatted.split("");
  let digitFromRight = 0;
  for (let i = chars.length - 1; i >= 0; i--) {
    if (/\d/.test(chars[i])) {
      digitFromRight++;
      const sub = replacements.get(digitFromRight);
      if (sub !== undefined) chars[i] = sub;
    }
  }
  return chars.join("");
}

// ─── Overlay ──────────────────────────────────────────────────────────────────

export const IncomeTrackerOverlay: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cycleIndex = Math.min(
    Math.floor(frame / CYCLE_FRAMES),
    CUMULATIVE_INCOME.length - 1
  );
  const elapsed = frame % CYCLE_FRAMES;

  const incomeFrom = cycleIndex > 0 ? CUMULATIVE_INCOME[cycleIndex - 1] : 0;
  const incomeTo = CUMULATIVE_INCOME[cycleIndex];
  const taxFrom = cycleIndex > 0 ? CUMULATIVE_TAX[cycleIndex - 1] : 0;
  const taxTo = CUMULATIVE_TAX[cycleIndex];

  const incomeVal = rollingDisplay(elapsed, incomeFrom, incomeTo);

  const taxElapsed = elapsed - (ROLL_FRAMES + DELAY_FRAMES);
  const taxVal =
    taxElapsed > 0 ? rollingDisplay(taxElapsed, taxFrom, taxTo) : taxFrom;
  const taxSettled = taxElapsed >= ROLL_FRAMES;

  // Replacements from the previous cycle persist during rolling;
  // this cycle's new replacement appears only once the counter settles.
  const prevMap = cycleIndex > 0 ? activeReplacements(cycleIndex - 1) : new Map();
  const currentMap = activeReplacements(cycleIndex);
  const activeMap = taxSettled ? currentMap : prevMap;

  const taxDisplay = formatTax(taxSettled ? taxTo : taxVal, activeMap);

  return (
    <div
      style={{
        position: "absolute",
        left: "5%",
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        opacity,
        userSelect: "none",
      }}
    >
      {/* Income */}
      <div>
        <div
          style={{
            fontFamily: "ABCGravity, sans-serif",
            fontSize: 80,
            fontWeight: 900,
            fontVariationSettings: '"wdth" 65',
            color: "white",
            lineHeight: 1,
          }}
        >
          Income
        </div>
        <div
          style={{
            fontFamily: '"RobotoMono", "Courier New", monospace',
            fontSize: 160,
            fontWeight: 600,
            color: "white",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          {`$${incomeVal.toLocaleString("en-US")}`}
        </div>
      </div>

      <div style={{ height: 30 }} />

      {/* Taxes */}
      <div>
        <div
          style={{
            fontFamily: "ABCGravity, sans-serif",
            fontSize: 80,
            fontWeight: 900,
            fontVariationSettings: '"wdth" 65',
            color: ORANGE,
            lineHeight: 1,
          }}
        >
          Taxes
        </div>
        <div
          style={{
            fontFamily: '"RobotoMono", "Courier New", monospace',
            fontSize: 160,
            fontWeight: 600,
            color: ORANGE,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          {taxDisplay}
        </div>
      </div>
    </div>
  );
};

export const sceneConfig: SceneConfig = {
  video: "video2.mp4",
  hostX: "20%",
  overlay: IncomeTrackerOverlay,
};
