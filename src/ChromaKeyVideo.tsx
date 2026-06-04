import React, { useCallback, useRef, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  OffthreadVideo,
} from "remotion";

const KEY_HUE = 148;
const HUE_RANGE = 45;
const MIN_SATURATION = 0.10;
const SIMILARITY = 0.42;
const SMOOTHNESS = 0.2;
const THRESHOLD = SIMILARITY + SMOOTHNESS;

const BAR_PX = 16;
const SRC_W = 1920;
const SRC_H = 1080;

function getHueAndSat(r: number, g: number, b: number): [number, number] {
  const rf = r / 255,
    gf = g / 255,
    bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;

  let h = 0;
  if (d !== 0) {
    if (max === rf) h = ((gf - bf) / d + 6) % 6;
    else if (max === gf) h = (bf - rf) / d + 2;
    else h = (rf - gf) / d + 4;
    h *= 60;
  }
  return [h, s];
}

function chromaKeyAlpha(r: number, g: number, b: number): number {
  const [h, s] = getHueAndSat(r, g, b);

  if (s < MIN_SATURATION) return 255;

  let hueDist = Math.abs(h - KEY_HUE);
  if (hueDist > 180) hueDist = 360 - hueDist;
  if (hueDist >= HUE_RANGE) return 255;

  const hueNorm = hueDist / HUE_RANGE;
  const keyStrength = (1 - hueNorm) * Math.min(s / 0.5, 1);

  if (keyStrength > THRESHOLD) return 0;
  if (keyStrength > SIMILARITY)
    return Math.round(((THRESHOLD - keyStrength) / SMOOTHNESS) * 255);

  return 255;
}

function despill(r: number, g: number, b: number): [number, number, number] {
  const limit = (r + b) / 2;
  if (g <= limit) return [r, g, b];
  return [r, Math.round(limit), b];
}

type Props = {
  src: string;
  trimBefore?: number;
  trimAfter?: number;
  muted?: boolean;
};

export const ChromaKeyVideo: React.FC<Props> = ({ src, trimBefore, trimAfter, muted }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [handle] = useState(() => delayRender("ChromaKeyVideo"));

  const onVideoFrame = useCallback(
    (frame: CanvasImageSource) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        cancelRender(new Error("Canvas not mounted"));
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cancelRender(new Error("Could not get 2d context"));
        return;
      }

      const srcW = (frame as any).videoWidth || (frame as any).width || SRC_W;
      const srcH = (frame as any).videoHeight || (frame as any).height || SRC_H;
      const scaledBar = Math.round(BAR_PX * srcH / SRC_H);
      ctx.drawImage(
        frame,
        0, scaledBar, srcW, srcH - scaledBar * 2,
        0, 0, canvas.width, canvas.height,
      );

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;

      for (let i = 0; i < data.length; i += 4) {
        const a = chromaKeyAlpha(data[i], data[i + 1], data[i + 2]);
        data[i + 3] = a;

        // Apply despill to all pixels — not just keyed ones — to remove
        // green halo that remains on opaque edge pixels near the hair.
        const [r, g, b] = despill(data[i], data[i + 1], data[i + 2]);
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }

      ctx.putImageData(imageData, 0, 0);
      continueRender(handle);
    },
    [handle],
  );

  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={src}
        style={{ position: "absolute", opacity: 0.001 }}
        onVideoFrame={onVideoFrame}
        trimBefore={trimBefore}
        trimAfter={trimAfter}
        muted={muted}
      />
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />
    </AbsoluteFill>
  );
};
