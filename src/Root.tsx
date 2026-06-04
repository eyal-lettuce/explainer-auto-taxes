import React from "react";
import { Composition, CalculateMetadataFunction, staticFile } from "remotion";
import { Timeline, Props } from "./Timeline";
import { getVideoDuration } from "./get-video-duration";
import { getVideoDimensions } from "./get-video-dimensions";
import { segments } from "./segments";

const FPS = 24;

const calculateMetadata: CalculateMetadataFunction<Props> = async () => {
  if (segments.length === 0) {
    return {
      durationInFrames: 300,
      fps: FPS,
      width: 1920,
      height: 1080,
      props: { segmentFrames: [] },
    };
  }

  const durations = await Promise.all(
    segments.map((s) => getVideoDuration(staticFile(s.video))),
  );

  const dimensions = await getVideoDimensions(staticFile(segments[0].video));

  const segmentFrames = durations.map((d, i) => {
    const total = Math.ceil(d * FPS);
    const trimStart = segments[i].trimStart ?? 0;
    const trimEnd = segments[i].trimEnd ?? 0;
    return total - trimStart - trimEnd + (segments[i].extraFrames ?? 0);
  });
  const totalFrames = segmentFrames.reduce((sum, f) => sum + f, 0);

  return {
    durationInFrames: totalFrames,
    width: dimensions.width,
    height: dimensions.height,
    props: { segmentFrames },
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="auto-taxes"
      component={Timeline}
      durationInFrames={300}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{
        segmentFrames: segments.map(() => 72),
      }}
      calculateMetadata={calculateMetadata}
    />
  );
};
