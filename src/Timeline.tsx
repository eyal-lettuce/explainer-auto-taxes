import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Audio } from "@remotion/media";
import { AnimatedBackground } from "./AnimatedBackground";
import { ChromaKeyVideo } from "./ChromaKeyVideo";
import { Captions } from "./Captions";
import { HOST_ZOOM_PRESETS } from "./SceneConfig";
import { segments } from "./segments";

const VideoWithFade: React.FC<{
  src: string;
  trimBefore: number;
  trimAfter: number;
  style?: React.CSSProperties;
  fadeFrames?: number;
  duration: number;
}> = ({ src, trimBefore, trimAfter, style, fadeFrames, duration }) => {
  const frame = useCurrentFrame();
  const opacity =
    fadeFrames !== undefined
      ? interpolate(frame, [duration - fadeFrames, duration], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  const video = (
    <ChromaKeyVideo src={src} trimBefore={trimBefore} trimAfter={trimAfter} />
  );

  if (style || opacity !== 1) {
    return (
      <AbsoluteFill style={{ ...style, opacity }}>
        {video}
      </AbsoluteFill>
    );
  }
  return video;
};

export type Props = {
  segmentFrames: number[];
};

export const Timeline: React.FC<Props> = ({ segmentFrames }) => {
  let offset = 0;
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Audio
        src={staticFile("Wutif - Lauren Duski.mp3")}
        volume={(f) =>
          interpolate(
            f,
            [0, durationInFrames - 5 * 24, durationInFrames - 4 * 24, durationInFrames - 2 * 24, durationInFrames],
            [0.07, 0.07, 0.5, 0.5, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />
      <AnimatedBackground segmentFrames={segmentFrames} />

      {segments.map((segment, i) => {
        const from = offset;
        const duration = segmentFrames[i];
        offset += duration;

        const src = staticFile(segment.video);
        const trimStart = segment.trimStart ?? 0;
        const extraFrames = segment.extraFrames ?? 0;
        const trimAfter = trimStart + duration - extraFrames;

        return (
          <Sequence
            key={segment.video}
            from={from}
            durationInFrames={duration}
            name={segment.video}
          >
            <Sequence durationInFrames={duration - extraFrames}>
              {segment.secondaryVideo && (
                <Sequence from={segment.secondaryVideoFrom ?? 0}>
                  <AbsoluteFill style={segment.secondaryVideoStyle}>
                    <ChromaKeyVideo
                      src={staticFile(segment.secondaryVideo)}
                      trimBefore={trimStart}
                      trimAfter={trimAfter}
                      muted={segment.secondaryVideoMuted}
                    />
                  </AbsoluteFill>
                </Sequence>
              )}
              {segment.secondaryAudio && (
                <Sequence from={segment.secondaryAudioFrom ?? segment.secondaryVideoFrom ?? 0}>
                  <Audio src={staticFile(segment.secondaryAudio)} />
                </Sequence>
              )}
            </Sequence>

            {segment.overlay && <segment.overlay />}

            <Sequence durationInFrames={duration - extraFrames}>
              {segment.showVideo === false ? (
                <Audio src={src} trimBefore={trimStart} trimAfter={trimAfter} />
              ) : (() => {
                const zoom = segment.hostZoom ? HOST_ZOOM_PRESETS[segment.hostZoom] : null;
                const hostStyle: React.CSSProperties | undefined =
                  zoom || segment.hostX
                    ? {
                        ...segment.videoStyle,
                        transform: `translateX(${segment.hostX ?? "0%"}) scale(${zoom?.scale ?? 1}) translateY(${zoom?.translateY ?? "0%"})`,
                        transformOrigin: "top center",
                      }
                    : segment.videoStyle;
                return (
                  <VideoWithFade
                    src={src}
                    trimBefore={trimStart}
                    trimAfter={trimAfter}
                    style={hostStyle}
                    fadeFrames={segment.videoFadeOutFrames}
                    duration={duration - extraFrames}
                  />
                );
              })()}
            </Sequence>
          </Sequence>
        );
      })}
      <Captions segmentFrames={segmentFrames} />
    </AbsoluteFill>
  );
};
