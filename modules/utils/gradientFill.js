import { PIXEL_ART_COLORS } from "./dyes.js";
import { findNearestPerceptualPaletteColor, hexToRgb } from "./colorMapping.js";

const PROJECTION_EPSILON = 0.000001;

export function applyGradientToPixelGrid(grid, {
  startColor,
  endColor,
  angleDegrees = 0,
  palette = PIXEL_ART_COLORS,
} = {}) {
  const filledPixels = [];
  grid.forEach((rowPixels, row) => {
    rowPixels.forEach((pixel, col) => {
      if (!pixel) return;
      filledPixels.push({ row, col });
    });
  });

  if (filledPixels.length < 1) {
    return {
      grid,
      changed: false,
      filledCount: 0,
    };
  }

  const direction = get2dDirection(angleDegrees);
  const sortedPixels = filledPixels.map((pixel) => ({
    ...pixel,
    projection: pixel.col * direction.x + pixel.row * direction.y,
  })).sort(comparePixelProjectionEntries);
  const projectionGroups = groupProjectionEntries(sortedPixels);
  const ramp = getEvenGradientRamp(startColor, endColor, projectionGroups.length, palette);
  const nextGrid = grid.map((rowPixels) => [...rowPixels]);
  let assignedCount = 0;

  projectionGroups.forEach((group) => {
    const color = getEvenGradientColor(assignedCount + group.length / 2, sortedPixels.length, ramp);
    group.forEach((pixel) => {
      nextGrid[pixel.row][pixel.col] = color;
    });
    assignedCount += group.length;
  });

  return {
    grid: nextGrid,
    changed: true,
    filledCount: filledPixels.length,
  };
}

export function mapGradientToVoxels(voxels, {
  startColor,
  endColor,
  yawDegrees = 0,
  pitchDegrees = 0,
  palette = PIXEL_ART_COLORS,
} = {}) {
  if (voxels.length < 1) {
    return {
      voxels: [],
      changed: false,
      filledCount: 0,
    };
  }

  const direction = get3dDirection(yawDegrees, pitchDegrees);
  const sortedVoxels = voxels.map((voxel) => ({
    voxel,
    projection: voxel.x * direction.x + voxel.y * direction.y + voxel.z * direction.z,
  })).sort(compareVoxelProjectionEntries);
  const projectionGroups = groupProjectionEntries(sortedVoxels);
  const ramp = getEvenGradientRamp(startColor, endColor, projectionGroups.length, palette);
  const nextVoxels = [];
  let assignedCount = 0;

  projectionGroups.forEach((group) => {
    const color = getEvenGradientColor(assignedCount + group.length / 2, sortedVoxels.length, ramp);
    group.forEach(({ voxel }) => {
      nextVoxels.push({
        ...voxel,
        color,
        sourceColor: null,
      });
    });
    assignedCount += group.length;
  });

  return {
    voxels: nextVoxels,
    changed: true,
    filledCount: voxels.length,
  };
}

export function mapGradientToPoints(points, {
  startColor,
  endColor,
  yawDegrees = 0,
  pitchDegrees = 0,
  palette = PIXEL_ART_COLORS,
} = {}) {
  if (points.length < 1) {
    return {
      points: [],
      changed: false,
      filledCount: 0,
    };
  }

  const direction = get3dDirection(yawDegrees, pitchDegrees);
  const sortedPoints = points.map((point, index) => ({
    point,
    index,
    projection: point.x * direction.x + point.y * direction.y + point.z * direction.z,
  })).sort(comparePointProjectionEntries);
  const projectionGroups = groupProjectionEntries(sortedPoints);
  const ramp = getEvenGradientRamp(startColor, endColor, projectionGroups.length, palette);
  const nextPoints = new Array(points.length);
  let assignedCount = 0;

  projectionGroups.forEach((group) => {
    const color = getEvenGradientColor(assignedCount + group.length / 2, sortedPoints.length, ramp);
    group.forEach(({ point, index }) => {
      nextPoints[index] = {
        ...point,
        color,
      };
    });
    assignedCount += group.length;
  });

  return {
    points: nextPoints,
    changed: true,
    filledCount: points.length,
  };
}

export function get2dDirection(angleDegrees) {
  const radians = degreesToRadians(angleDegrees);
  return {
    x: Math.cos(radians),
    y: Math.sin(radians),
  };
}

export function get3dDirection(yawDegrees, pitchDegrees) {
  const yaw = degreesToRadians(yawDegrees);
  const pitch = degreesToRadians(pitchDegrees);
  const horizontal = Math.cos(pitch);
  return {
    x: horizontal * Math.cos(yaw),
    y: horizontal * Math.sin(yaw),
    z: Math.sin(pitch),
  };
}

export function getGradientPaletteColor(startColor, endColor, t, palette = PIXEL_ART_COLORS) {
  const startRgb = hexToRgb((startColor || palette[0]).hex);
  const endRgb = hexToRgb((endColor || palette[0]).hex);
  return findNearestPerceptualPaletteColor(
    interpolateChannel(startRgb.red, endRgb.red, t),
    interpolateChannel(startRgb.green, endRgb.green, t),
    interpolateChannel(startRgb.blue, endRgb.blue, t),
    palette
  );
}

export function getEvenGradientRamp(startColor, endColor, itemCount, palette = PIXEL_ART_COLORS) {
  const normalizedStart = getPaletteColor(startColor, palette);
  const normalizedEnd = getPaletteColor(endColor, palette);
  const ramp = [];
  const sampleCount = Math.max(2, Math.min(512, Math.max(itemCount * 4, palette.length * 2)));

  addUniqueColor(ramp, normalizedStart);
  for (let index = 1; index < sampleCount - 1; index += 1) {
    addUniqueColor(
      ramp,
      getGradientPaletteColor(normalizedStart, normalizedEnd, index / (sampleCount - 1), palette)
    );
  }
  addUniqueColor(ramp, normalizedEnd);

  if (itemCount > 0 && ramp.length > itemCount) {
    return sampleRampByCount(ramp, itemCount);
  }
  return ramp;
}

export function getEvenGradientColor(position, itemCount, ramp) {
  if (!ramp.length) return { ...PIXEL_ART_COLORS[0] };
  if (itemCount <= 1) return { ...ramp[0] };

  const rampIndex = Math.min(
    ramp.length - 1,
    Math.floor((position * ramp.length) / itemCount)
  );
  return { ...ramp[rampIndex] };
}

export function parseGradientAngle(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function comparePixelProjectionEntries(left, right) {
  return (
    left.projection - right.projection ||
    left.row - right.row ||
    left.col - right.col
  );
}

function compareVoxelProjectionEntries(left, right) {
  return (
    left.projection - right.projection ||
    left.voxel.z - right.voxel.z ||
    left.voxel.y - right.voxel.y ||
    left.voxel.x - right.voxel.x
  );
}

function comparePointProjectionEntries(left, right) {
  return (
    left.projection - right.projection ||
    left.point.z - right.point.z ||
    left.point.y - right.point.y ||
    left.point.x - right.point.x ||
    left.index - right.index
  );
}

function groupProjectionEntries(entries) {
  const groups = [];

  entries.forEach((entry) => {
    const group = groups[groups.length - 1];
    if (
      group &&
      Math.abs(entry.projection - group[0].projection) <= PROJECTION_EPSILON
    ) {
      group.push(entry);
      return;
    }

    groups.push([entry]);
  });

  return groups;
}

function addUniqueColor(ramp, color) {
  if (!color || ramp.some((existing) => existing.id === color.id)) return;
  ramp.push({ ...color });
}

function sampleRampByCount(ramp, count) {
  if (count <= 1) return [{ ...ramp[0] }];

  return Array.from({ length: count }, (_, index) => {
    const rampIndex = Math.round((index * (ramp.length - 1)) / (count - 1));
    return { ...ramp[rampIndex] };
  });
}

function getPaletteColor(color, palette) {
  return palette.find((candidate) =>
    candidate.id === color?.id ||
    candidate.hex === color?.hex
  ) || color || palette[0];
}

function interpolateChannel(start, end, t) {
  return Math.round(start + (end - start) * t);
}

function degreesToRadians(degrees) {
  return (parseGradientAngle(degrees) * Math.PI) / 180;
}
