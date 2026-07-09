import { ImageResponse } from "next/og";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export default function Icon() {
  return new ImageResponse(
    <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0E1A", borderRadius: 14 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='44' height='36' viewBox='0 0 44 36' fill='none'><circle cx='22' cy='16' r='13' fill='%23F5D680' opacity='0.18'/><line x1='8' y1='35' x2='5' y2='4' stroke='%23EDF0F8' stroke-width='2.2' stroke-linecap='round' opacity='0.75'/><line x1='36' y1='35' x2='39' y2='4' stroke='%23EDF0F8' stroke-width='2.2' stroke-linecap='round' opacity='0.75'/><path d='M5 4 C 10 16, 13 16, 16 8 S 19 16, 22 16 S 25 8, 28 8 S 31 16, 34 16 S 37 8, 39 4' stroke='%23E3B341' stroke-width='2.8' stroke-linecap='round' fill='none'/></svg>"
        width={44}
        height={36}
        alt="Filament"
        style={{ display: "block" }}
      />
    </div>,
    { ...size }
  );
}
