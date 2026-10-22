import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 70,
          background: "#FFC83D",
          color: "#0B2E21",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            height: 14,
            background: "repeating-linear-gradient(90deg,#E4402F 0 40px,#fff 40px 80px)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 38, fontWeight: 700 }}>SeePay</div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 72, fontWeight: 700, lineHeight: 1.02 }}>
            <div style={{ display: "flex" }}>Your shop.</div>
            <div style={{ display: "flex" }}>Your link. Your MoMo.</div>
          </div>
          <div style={{ display: "flex", fontSize: 27 }}>
            Instant MoMo storefronts for Ghanaian businesses.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 25, fontWeight: 600 }}>seepay.shop</div>
      </div>
    ),
    size,
  );
}
