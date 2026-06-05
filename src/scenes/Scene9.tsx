import React from "react";
import {
  useCurrentFrame,
  interpolate,
} from "remotion";
import type { SceneConfig } from "../SceneConfig";
import "../fonts";

const PRIMARY = "#9FE963";

const TEXT_ANIM_DUR = 12;

const Scene9Overlay: React.FC = () => {
  const frame = useCurrentFrame();

  const textOpacity = interpolate(frame, [10, 10 + TEXT_ANIM_DUR], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textSlideY = interpolate(frame, [10, 10 + TEXT_ANIM_DUR], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const numBlock: React.CSSProperties = {
    position: "absolute",
    width: "30%",
    top: "25%",
    fontFamily: "ABCGravity, sans-serif",
    fontWeight: 900,
    fontVariationSettings: '"wdth" 65',
    fontSize: 280,
    color: "white",
    lineHeight: 1,
    textAlign: "center",
    userSelect: "none",
  };

  const labelBlock: React.CSSProperties = {
    fontFamily: "ABCGravity, sans-serif",
    fontWeight: 900,
    fontVariationSettings: '"wdth" 65',
    fontSize: 78,
    lineHeight: 1.15,
    textAlign: "center",
    userSelect: "none",
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Numbers — static */}
      <div style={{ ...numBlock, left: "5%" }}>1</div>
      <div style={{ ...numBlock, right: "5%" }}>2</div>

      {/* Text for #1 — static (revealed in scene 8) */}
      <div
        style={{
          position: "absolute",
          left: "5%",
          top: "48%",
          width: "30%",
          ...labelBlock,
        }}
      >
        <div style={{ color: PRIMARY }}>Annual Estimates</div>
        <div style={{ color: "white" }}>Up to Date</div>
      </div>

      {/* Text for #2 — animates in */}
      <div
        style={{
          position: "absolute",
          right: "5%",
          top: "48%",
          width: "30%",
          opacity: textOpacity,
          transform: `translateY(${textSlideY}px)`,
          ...labelBlock,
        }}
      >
        <div style={{ color: PRIMARY }}>Income & Expenses</div>
        <div style={{ color: "white" }}>Through Lettuce</div>
      </div>
    </div>
  );
};

export const sceneConfig: SceneConfig = {
  video: "video9.mp4",
  // hostZoom: "mediumShot",
  overlay: Scene9Overlay,
};
