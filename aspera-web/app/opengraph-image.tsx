import { ImageResponse } from "next/og";

// Social link preview for the landing page. Renders the breathing-orb motif +
// wordmark on warm off-black, using the design tokens (no external asset/font —
// the orb is the hero; Satori's default sans is fine for the wordmark).

export const alt = "Aspera — an agent for your digital habits";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a09",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(215,210,198,0.22) 0%, transparent 62%)",
          }}
        />
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 42% 36%, #34322e, #16150f 78%)",
            boxShadow:
              "inset 0 2px 24px rgba(255,255,255,0.06), inset 0 -16px 44px rgba(0,0,0,0.45)",
          }}
        />
        <div
          style={{
            marginTop: 54,
            fontSize: 28,
            letterSpacing: 16,
            color: "#76726b",
            textTransform: "uppercase",
          }}
        >
          Ad astra per aspera
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 86,
            fontWeight: 500,
            color: "#f2efe8",
            letterSpacing: 4,
          }}
        >
          aspera
        </div>
      </div>
    ),
    { ...size },
  );
}
