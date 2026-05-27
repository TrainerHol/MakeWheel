import { PIXEL_ART_COLORS } from "./dyes.js";

export const PRESERVE_SHADING_DEFAULT_OPTIONS = {
  maxAlternativeDistance: 38,
  maxAlternativeDelta: 18,
};

export function findNearestPaletteColor(red, green, blue, palette = PIXEL_ART_COLORS) {
  let closestColor = palette[0];
  let closestDistance = Number.POSITIVE_INFINITY;

  palette.forEach((color) => {
    const rgb = hexToRgb(color.hex);
    const distance =
      (red - rgb.red) ** 2 +
      (green - rgb.green) ** 2 +
      (blue - rgb.blue) ** 2;

    if (distance < closestDistance) {
      closestDistance = distance;
      closestColor = color;
    }
  });

  return { ...closestColor };
}

export function findNearestPerceptualPaletteColor(red, green, blue, palette = PIXEL_ART_COLORS) {
  return getPaletteCandidates({ red, green, blue }, palette)[0].color;
}

export function mapSourceColorsToPalette(sourceColors, palette = PIXEL_ART_COLORS, options = {}) {
  const settings = {
    ...PRESERVE_SHADING_DEFAULT_OPTIONS,
    ...options,
  };
  const uniqueSources = dedupeSourceColors(sourceColors);
  const entries = uniqueSources.map((source) => {
    const candidates = getPaletteCandidates(source, palette);
    return {
      source,
      key: rgbKey(source),
      candidates,
      nearest: candidates[0],
    };
  });
  const entriesByNearest = new Map();

  entries.forEach((entry) => {
    const paletteId = entry.nearest.color.id;
    if (!entriesByNearest.has(paletteId)) {
      entriesByNearest.set(paletteId, []);
    }
    entriesByNearest.get(paletteId).push(entry);
  });

  const usedPaletteIds = new Set();
  const mappedColors = new Map();
  const groups = [...entriesByNearest.values()].sort((left, right) => {
    const leftDistance = Math.min(...left.map((entry) => entry.nearest.distance));
    const rightDistance = Math.min(...right.map((entry) => entry.nearest.distance));
    return leftDistance - rightDistance;
  });

  groups.forEach((group) => {
    group.sort((left, right) => left.nearest.distance - right.nearest.distance);

    const primary = group[0];
    mappedColors.set(primary.key, { ...primary.nearest.color });
    usedPaletteIds.add(primary.nearest.color.id);

    group.slice(1).forEach((entry) => {
      const alternate = entry.candidates.find((candidate) =>
        !usedPaletteIds.has(candidate.color.id) &&
        isAcceptableAlternative(candidate.distance, entry.nearest.distance, settings)
      );

      if (alternate) {
        mappedColors.set(entry.key, { ...alternate.color });
        usedPaletteIds.add(alternate.color.id);
      } else {
        mappedColors.set(entry.key, { ...entry.nearest.color });
      }
    });
  });

  return mappedColors;
}

export function getPaletteCandidates(sourceColor, palette = PIXEL_ART_COLORS) {
  const sourceLab = rgbToLab(sourceColor.red, sourceColor.green, sourceColor.blue);

  return palette
    .map((color) => {
      const rgb = hexToRgb(color.hex);
      const lab = rgbToLab(rgb.red, rgb.green, rgb.blue);
      return {
        color: { ...color },
        distance: labDistance(sourceLab, lab),
      };
    })
    .sort((left, right) => left.distance - right.distance);
}

export function hexToRgb(hex) {
  const normalized = hex.replace("#", "").slice(0, 6);
  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function rgbKey(color) {
  return `${color.red},${color.green},${color.blue}`;
}

function isAcceptableAlternative(candidateDistance, nearestDistance, settings) {
  return (
    candidateDistance <= settings.maxAlternativeDistance &&
    candidateDistance <= nearestDistance + settings.maxAlternativeDelta
  );
}

function dedupeSourceColors(sourceColors) {
  const unique = new Map();

  sourceColors.forEach((source) => {
    if (!source || !Number.isFinite(source.red) || !Number.isFinite(source.green) || !Number.isFinite(source.blue)) {
      return;
    }
    unique.set(rgbKey(source), {
      red: source.red,
      green: source.green,
      blue: source.blue,
    });
  });

  return [...unique.values()];
}

function rgbToLab(red, green, blue) {
  const xyz = rgbToXyz(red, green, blue);
  const white = {
    x: 0.95047,
    y: 1,
    z: 1.08883,
  };

  const x = labPivot(xyz.x / white.x);
  const y = labPivot(xyz.y / white.y);
  const z = labPivot(xyz.z / white.z);

  return {
    lightness: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
  };
}

function rgbToXyz(red, green, blue) {
  const r = srgbToLinear(red / 255);
  const g = srgbToLinear(green / 255);
  const b = srgbToLinear(blue / 255);

  return {
    x: r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    y: r * 0.2126729 + g * 0.7151522 + b * 0.072175,
    z: r * 0.0193339 + g * 0.119192 + b * 0.9503041,
  };
}

function srgbToLinear(value) {
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function labPivot(value) {
  return value > 0.008856
    ? Math.cbrt(value)
    : 7.787037 * value + 16 / 116;
}

function labDistance(left, right) {
  return Math.hypot(
    left.lightness - right.lightness,
    left.a - right.a,
    left.b - right.b
  );
}
