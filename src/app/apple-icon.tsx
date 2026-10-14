import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// The FloorPlan mark: four rooms of a floor plan, one lit.
export default function AppleIcon() {
  const room = (left: number, top: number, background: string) => (
    <div style={{ position: "absolute", left, top, width: 46, height: 46, background }} />
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0a0a0a" }}>
        {room(39, 39, "#e8743b")}
        {room(95, 39, "rgba(255,255,255,0.92)")}
        {room(39, 95, "rgba(255,255,255,0.92)")}
        {room(95, 95, "rgba(255,255,255,0.35)")}
      </div>
    ),
    size,
  );
}
