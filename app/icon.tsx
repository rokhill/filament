import { ImageResponse } from "next/og";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export default function Icon() {
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64' fill='none'>  <rect width='64' height='64' rx='14' fill='%230A0E1A'/>  <circle cx='32' cy='28' r='18' fill='%23F5D680' opacity='0.13'/>  <line x1='22' y1='52' x2='16' y2='16' stroke='%23EDF0F8' stroke-width='2.2' stroke-linecap='round' opacity='0.75'/>  <line x1='42' y1='52' x2='48' y2='16' stroke='%23EDF0F8' stroke-width='2.2' stroke-linecap='round' opacity='0.75'/>  <path d='M16 16 C 21 28, 24 28, 27 19 S 30 28, 32 28 S 35 19, 37 19 S 40 28, 43 28 S 46 19, 48 16'     stroke='%23E3B341' stroke-width='3' stroke-linecap='round' fill='none'/> </svg>" width={64} height={64} alt="Filament" />,
    { ...size }
  );
}
