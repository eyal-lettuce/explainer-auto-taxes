import React from "react";

export type HostZoomLevel = "longShot" | "mediumShot" | "closeUp";

export const HOST_ZOOM_PRESETS: Record<HostZoomLevel, { scale: number; translateY: string }> = {
  longShot:   { scale: 1.0,  translateY: "0%" },
  mediumShot: { scale: 1.4,  translateY: "0%" },
  closeUp:    { scale: 1.85, translateY: "0%" },
};

export type SceneConfig = {
  /** Video filename inside public/ */
  video: string;
  /** Frames to trim from the beginning of the video (default 0) */
  trimStart?: number;
  /** Frames to trim from the end of the video (default 0) */
  trimEnd?: number;
  /** Optional overlay animation component rendered behind the host */
  overlay?: React.ComponentType;
  /** Whether to show the host video (default true). When false, audio still plays. */
  showVideo?: boolean;
  /** Whether to show the animated background (default true) */
  showAnimatedBackground?: boolean;
  /** Optional CSS styles applied to the video container (e.g. to reposition the host) */
  videoStyle?: React.CSSProperties;
  /** Optional chroma-keyed video rendered behind the host (and behind the overlay) */
  secondaryVideo?: string;
  /** Optional CSS styles applied to the secondary video container */
  secondaryVideoStyle?: React.CSSProperties;
  /** Frame (relative to segment start) at which the secondary video begins (default 0) */
  secondaryVideoFrom?: number;
  /** Whether to mute the secondary video's audio (default false) */
  secondaryVideoMuted?: boolean;
  /** Optional audio file to play alongside the secondary video */
  secondaryAudio?: string;
  /** Frame (relative to segment start) at which the secondary audio begins (default: secondaryVideoFrom ?? 0) */
  secondaryAudioFrom?: number;
  /** Center point for the leaf-growing background animation (default: { x: "50%", y: "40%" }) */
  leafCenter?: { x: string; y: string };
  /** Extra frames to append after the video ends (background + overlay keep playing) */
  extraFrames?: number;
  /** Frames at the end of the video to fade out visually (audio continues) */
  videoFadeOutFrames?: number;
  /** Preset zoom level for the host. Scale and vertical framing are defined in HOST_ZOOM_PRESETS. */
  hostZoom?: HostZoomLevel;
  /** Horizontal offset for the host as a CSS percentage string (e.g. "-10%", "15%"). */
  hostX?: string;
};
