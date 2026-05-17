import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Microphone body */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
        >
          {/* Mic capsule */}
          <rect
            x="9"
            y="2"
            width="6"
            height="11"
            rx="3"
            fill="#22d3ee"
          />
          {/* Mic stand arc */}
          <path
            d="M5 10a7 7 0 0 0 14 0"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Mic stand pole */}
          <line
            x1="12"
            y1="17"
            x2="12"
            y2="21"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Mic base */}
          <line
            x1="9"
            y1="21"
            x2="15"
            y2="21"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Glow dot */}
          <circle cx="19" cy="5" r="2" fill="#a855f7" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
