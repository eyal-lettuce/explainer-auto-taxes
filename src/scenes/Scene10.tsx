import React from "react";
import { AbsoluteFill, useCurrentFrame, staticFile, interpolate, Easing } from "remotion";
import type { SceneConfig } from "../SceneConfig";

const FPS = 24;
const EXTRA_FRAMES = 72; // 3 seconds of background after video ends
const VIDEO_FADE_FRAMES = FPS; // host fades over final second

// Video10 is ~145 frames; leaf starts growing 3s before end, reaches 50% at video end
const LEAF_GROW_START = 73;
const LEAF_GROW_DURATION = 72;
const TARGET_LEAF_HEIGHT = 540; // 50% of 1080px screen height

const Scene10Overlay: React.FC = () => {
  const frame = useCurrentFrame();

  const growProgress = interpolate(
    frame,
    [LEAF_GROW_START, LEAF_GROW_START + LEAF_GROW_DURATION],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  if (growProgress <= 0) return null;

  const leafSize = growProgress * TARGET_LEAF_HEIGHT;

  const logoOpacity = interpolate(growProgress, [0.5, 0.85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <div
        style={{
          position: "relative",
          width: leafSize,
          height: leafSize,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <img
          src={staticFile("leaf-center.png")}
          style={{
            position: "absolute",
            width: "130%",
            height: "130%",
            objectFit: "contain",
          }}
        />
        <img
          src={staticFile("logotype.svg")}
          style={{
            position: "relative",
            width: "65%",
            opacity: logoOpacity,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const sceneConfig: SceneConfig = {
  video: "video10.mp4",
  hostZoom: "closeUp",
  leafCenter: { x: "50%", y: "50%" },
  videoFadeOutFrames: VIDEO_FADE_FRAMES,
  extraFrames: EXTRA_FRAMES,
  overlay: Scene10Overlay,
};
