import React from "react";
import {
  useCurrentFrame,
  interpolate,
  staticFile,
  delayRender,
  continueRender,
} from "remotion";
import type { SceneConfig } from "../SceneConfig";

const PRIMARY = "#9FE963";

const fontHandle =
  typeof document !== "undefined" ? delayRender("Loading ABCGravity font") : null;

if (typeof document !== "undefined") {
  const face = new FontFace(
    "ABCGravity",
    `url(${staticFile("ABCGravityVariable.ttf")})`,
    { weight: "900", style: "normal" }
  );
  document.fonts.add(face);
  face
    .load()
    .then(() => continueRender(fontHandle!))
    .catch(() => continueRender(fontHandle!));
}

const ANIM_DUR = 12;

const NumbersOverlay: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [20, 20 + ANIM_DUR], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const slideY = interpolate(frame, [20, 20 + ANIM_DUR], [20, 0], {
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
    opacity,
    transform: `translateY(${slideY}px)`,
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ ...numBlock, left: "5%" }}>1</div>
      <div style={{ ...numBlock, right: "5%" }}>2</div>
    </div>
  );
};

export const sceneConfig: SceneConfig = {
  video: "video6.mp4",
  hostZoom: "closeUp",
  trimStart: 72,
  overlay: NumbersOverlay,
};
