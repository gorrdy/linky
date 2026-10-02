import type { Ref } from "react";

export interface CameraPreviewProps {
  /** Receives the `<video>` element that plays a `getUserMedia` stream. */
  videoRef?: Ref<HTMLVideoElement> | undefined;
  /** Mirrors the picture, for front-camera selfies. */
  mirrored?: boolean | undefined;
}

/** Camera streams are a web API; native apps render their camera module in `MediaFrame` instead. */
export const CameraPreview: (props: CameraPreviewProps) => null = () => null;
