// utils/flags.ts
const ALLOWED_WIDTHS = [20, 40, 80, 160, 320, 640, 1280, 2560];

function nearestAllowed(size: number) {
  return ALLOWED_WIDTHS.reduce((a, b) =>
    Math.abs(b - size) < Math.abs(a - b) ? b : a
  );
}

export const getFlagUrl = (iso?: string, size: number = 20) =>
  iso ? `https://flagcdn.com/w${nearestAllowed(size)}/${iso.toLowerCase()}.png` : "";