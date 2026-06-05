import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import type { SceneConfig } from "../SceneConfig";
import "../fonts";

const PRIMARY = "#9FE963";

export const TitleOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ANIM_FRAMES = Math.round(fps * 0.4);

  const opacity = interpolate(frame, [0, ANIM_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const slideX = interpolate(frame, [0, ANIM_FRAMES], [-50, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: "6%",
        top: "50%",
        transform: `translateY(-55%) translateX(${slideX}px)`,
        opacity,
        fontFamily: "ABCGravity, sans-serif",
        fontSize: 250,
        fontWeight: 900,
        fontVariationSettings: '"wdth" 65',
        lineHeight: 0.8,
        userSelect: "none",
      }}
    >
      <div style={{ color: "white"}}>Taxes on</div>
      <div style={{ color: PRIMARY}}>Auto Pilot</div>
    </div>
  );
};

export const sceneConfig: SceneConfig = {
  video: "video1.mp4",
  hostX: "20%",
  hostZoom: "mediumShot",
  trimStart: 5,
  overlay: TitleOverlay,
};
