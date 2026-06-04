import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { segments } from "./segments";

const LEAF_GROWING = staticFile("leaf-growing.png");

const BG_COLOR = "#003438";

const DEFAULT_LEAF_CENTER = { x: "50%", y: "40%" };

function deriveLeafCenter(segment: { leafCenter?: { x: string; y: string }; hostX?: string }) {
  if (segment.leafCenter) return segment.leafCenter;
  const hostXNum = segment.hostX ? parseFloat(segment.hostX) : 0;
  return { x: `${50 + hostXNum}%`, y: DEFAULT_LEAF_CENTER.y };
}

const SPAWN_INTERVAL_MS = 3000;
const GROW_DURATION_MS = 20000;
const SCALE_START = 0.01;
const SCALE_END = 4;

type Props = {
  segmentFrames: number[];
};

export const AnimatedBackground: React.FC<Props> = ({ segmentFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let accumulated = 0;
  let center = DEFAULT_LEAF_CENTER;
  let showBackground = true;
  for (let i = 0; i < segmentFrames.length; i++) {
    if (frame < accumulated + segmentFrames[i]) {
      center = deriveLeafCenter(segments[i]);
      showBackground = segments[i].showAnimatedBackground !== false;
      break;
    }
    accumulated += segmentFrames[i];
  }

  if (!showBackground) {
    return <AbsoluteFill style={{ backgroundColor: BG_COLOR }} />;
  }

  const spawnInterval = (SPAWN_INTERVAL_MS / 1000) * fps;
  const growDuration = (GROW_DURATION_MS / 1000) * fps;
  const maxLayers = Math.ceil(growDuration / spawnInterval);

  const layerData: { key: number; scale: number }[] = [];

  for (let i = 0; i < maxLayers; i++) {
    const age = ((frame + i * spawnInterval) % (maxLayers * spawnInterval));
    const progress = age / growDuration;

    if (progress > 1) continue;

    const scale = SCALE_START + progress * (SCALE_END - SCALE_START);
    layerData.push({ key: i, scale });
  }

  layerData.sort((a, b) => b.scale - a.scale);

  const layers = layerData.map(({ key, scale }) => (
    <Img
      key={key}
      src={LEAF_GROWING}
      style={{
        position: "absolute",
        height: "90%",
        top: center.y,
        left: center.x,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }} />
  ));

  return (
    <AbsoluteFill style={{ backgroundColor: BG_COLOR }}>
      {layers}
    </AbsoluteFill>
  );
};
