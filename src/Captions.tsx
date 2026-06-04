import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { segments } from "./segments";
import captionsJson from "./captions/captions.json";

type CaptionWord = { word: string; startMs: number; endMs: number };
type CaptionEntry = { text: string; startMs: number; endMs: number; words?: CaptionWord[] };
type CaptionsMap = Record<string, CaptionEntry[]>;

const data: CaptionsMap = captionsJson as CaptionsMap;

export const Captions: React.FC<{ segmentFrames: number[] }> = ({ segmentFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let offset = 0;
  let currentSegment = segments[0];
  let frameInSegment = frame;

  for (let i = 0; i < segments.length; i++) {
    const duration = segmentFrames[i];
    if (frame < offset + duration) {
      currentSegment = segments[i];
      frameInSegment = frame - offset;
      break;
    }
    offset += duration;
  }

  if (!currentSegment) return null;

  const videoFile = currentSegment.video;
  const trimStart = currentSegment.trimStart ?? 0;
  const videoMs = ((frameInSegment + trimStart) / fps) * 1000;

  const segmentCaptions = data[videoFile] ?? [];
  const current = segmentCaptions.find(
    (c) => videoMs >= c.startMs && videoMs <= c.endMs
  );

  if (!current) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0,0,0,0.55)",
          color: "#fff",
          fontSize: 60,
          fontFamily: "sans-serif",
          fontWeight: 600,
          padding: "20px 40px",
          borderRadius: 100,
          maxWidth: "80%",
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        {current.words ? (
          current.words.map((w, i) => (
            <span
              key={i}
              style={{
                color: videoMs >= w.startMs && videoMs <= w.endMs ? "#7bc67e" : "#fff",
                transition: "color 0.05s",
              }}
            >
              {w.word}{i < current.words!.length - 1 ? " " : ""}
            </span>
          ))
        ) : (
          current.text
        )}
      </div>
    </div>
  );
};
