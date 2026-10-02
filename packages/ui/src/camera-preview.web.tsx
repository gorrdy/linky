import type { CameraPreviewProps } from "./camera-preview";

/** Fills its `MediaFrame` with a live camera picture. */
export function CameraPreview({
  videoRef,
  mirrored = false,
}: CameraPreviewProps) {
  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        // Chrome does not clip video layers to a rounded overflow parent.
        borderRadius: "inherit",
        transform: mirrored ? "scaleX(-1)" : undefined,
      }}
    />
  );
}
