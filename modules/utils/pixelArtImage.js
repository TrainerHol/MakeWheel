import { PIXEL_ART_COLORS } from "./dyes.js";

export const IMAGE_IMPORT_MAX_SIZE = 24;
export const IMAGE_IMPORT_ALPHA_THRESHOLD = 128;
export const IMAGE_BACKGROUND_TOLERANCE = 36;

export function getImageImportSize(sourceWidth, sourceHeight, maxSize = IMAGE_IMPORT_MAX_SIZE) {
  if (!Number.isFinite(sourceWidth) || !Number.isFinite(sourceHeight) || sourceWidth < 1 || sourceHeight < 1) {
    throw new Error("Image dimensions must be positive numbers");
  }

  if (sourceWidth <= maxSize && sourceHeight <= maxSize) {
    return {
      width: Math.round(sourceWidth),
      height: Math.round(sourceHeight),
    };
  }

  const scale = maxSize / Math.max(sourceWidth, sourceHeight);
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

export function imageDataToPixelGrid(
  imageData,
  palette = PIXEL_ART_COLORS,
  alphaThreshold = IMAGE_IMPORT_ALPHA_THRESHOLD,
  options = {}
) {
  const { width, height, data } = imageData;
  const grid = [];
  const backgroundMask = options.removeBackground
    ? createBackgroundMask(imageData, alphaThreshold, options.backgroundTolerance)
    : null;

  for (let row = 0; row < height; row++) {
    const gridRow = [];
    for (let col = 0; col < width; col++) {
      const offset = (row * width + col) * 4;
      const alpha = data[offset + 3];

      if (alpha < alphaThreshold || backgroundMask?.[row * width + col]) {
        gridRow.push(null);
      } else {
        gridRow.push(findNearestPaletteColor(
          data[offset],
          data[offset + 1],
          data[offset + 2],
          palette
        ));
      }
    }
    grid.push(gridRow);
  }

  return grid;
}

export function createBackgroundMask(
  imageData,
  alphaThreshold = IMAGE_IMPORT_ALPHA_THRESHOLD,
  tolerance = IMAGE_BACKGROUND_TOLERANCE
) {
  const { width, height, data } = imageData;
  const candidates = getCornerBackgroundCandidates(imageData, alphaThreshold);
  const mask = new Uint8Array(width * height);
  const queue = [];

  if (candidates.length === 0) {
    return mask;
  }

  const enqueue = (row, col) => {
    if (row < 0 || row >= height || col < 0 || col >= width) return;

    const index = row * width + col;
    if (mask[index]) return;

    if (isTransparentPixel(data, index, alphaThreshold) || pixelMatchesAnyCandidate(data, index, candidates, tolerance)) {
      mask[index] = 1;
      queue.push([row, col]);
    }
  };

  for (let col = 0; col < width; col++) {
    enqueue(0, col);
    enqueue(height - 1, col);
  }

  for (let row = 1; row < height - 1; row++) {
    enqueue(row, 0);
    enqueue(row, width - 1);
  }

  while (queue.length > 0) {
    const [row, col] = queue.shift();
    enqueue(row - 1, col);
    enqueue(row + 1, col);
    enqueue(row, col - 1);
    enqueue(row, col + 1);
  }

  return mask;
}

export function getCornerBackgroundCandidates(imageData, alphaThreshold = IMAGE_IMPORT_ALPHA_THRESHOLD) {
  const { width, height, data } = imageData;
  const cornerIndexes = [
    0,
    width - 1,
    (height - 1) * width,
    height * width - 1,
  ];
  const uniqueCandidates = new Map();

  cornerIndexes.forEach((index) => {
    if (isTransparentPixel(data, index, alphaThreshold)) return;

    const color = getPixelRgb(data, index);
    uniqueCandidates.set(`${color.red},${color.green},${color.blue}`, color);
  });

  return Array.from(uniqueCandidates.values());
}

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

export function hexToRgb(hex) {
  const normalized = hex.replace("#", "").slice(0, 6);
  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function isTransparentPixel(data, index, alphaThreshold) {
  return data[index * 4 + 3] < alphaThreshold;
}

function getPixelRgb(data, index) {
  const offset = index * 4;
  return {
    red: data[offset],
    green: data[offset + 1],
    blue: data[offset + 2],
  };
}

function pixelMatchesAnyCandidate(data, index, candidates, tolerance) {
  const color = getPixelRgb(data, index);
  const maxDistance = tolerance ** 2 * 3;

  return candidates.some((candidate) => {
    const distance =
      (color.red - candidate.red) ** 2 +
      (color.green - candidate.green) ** 2 +
      (color.blue - candidate.blue) ** 2;

    return distance <= maxDistance;
  });
}
