import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "KaraQueue — Free Karaoke Online";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0f",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow blobs */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -120,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Mic icon */}
        <div
          style={{
            fontSize: 96,
            marginBottom: 24,
            display: "flex",
          }}
        >
          🎤
        </div>

        {/* Logo */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: "#00d4ff",
            letterSpacing: "-2px",
            textShadow: "0 0 40px rgba(0,212,255,0.6)",
            display: "flex",
          }}
        >
          KaraQueue
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: "#94a3b8",
            marginTop: 16,
            letterSpacing: "0.5px",
            display: "flex",
          }}
        >
          Free Online Karaoke — Powered by YouTube
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 48,
          }}
        >
          {["No signup", "Free forever", "Any song"].map((label) => (
            <div
              key={label}
              style={{
                background: "rgba(0,212,255,0.08)",
                border: "1px solid rgba(0,212,255,0.25)",
                borderRadius: 999,
                padding: "10px 28px",
                fontSize: 22,
                color: "#67e8f9",
                display: "flex",
              }}
            >
              ✓ {label}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 20,
            color: "#334155",
            display: "flex",
          }}
        >
          karaqueue.party
        </div>
      </div>
    ),
    size
  );
}
