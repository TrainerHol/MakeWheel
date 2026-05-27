import { PIXEL_ART_COLORS } from "./dyes.js";
import {
  findNearestPaletteColor,
  hexToRgb,
  mapSourceColorsToPalette,
  rgbKey,
} from "./colorMapping.js";

export const DEFAULT_VOXEL_DIMENSION = 8;
export const MAX_VOXEL_DIMENSION = 32;
export const DEFAULT_VOXEL_SIZE = {
  x: DEFAULT_VOXEL_DIMENSION,
  y: DEFAULT_VOXEL_DIMENSION,
  z: DEFAULT_VOXEL_DIMENSION,
};

export function createEmptyVoxelModel(size = DEFAULT_VOXEL_SIZE) {
  return {
    size: normalizeVoxelSize(size),
    voxels: new Map(),
  };
}

export function createVoxelModelFromParsedVox(parsedModel, options = {}) {
  if (
    parsedModel.size.x > MAX_VOXEL_DIMENSION ||
    parsedModel.size.y > MAX_VOXEL_DIMENSION ||
    parsedModel.size.z > MAX_VOXEL_DIMENSION
  ) {
    throw new Error(`Voxel editor supports models up to ${MAX_VOXEL_DIMENSION} x ${MAX_VOXEL_DIMENSION} x ${MAX_VOXEL_DIMENSION}.`);
  }

  const size = normalizeVoxelSize(parsedModel.size);
  const preserveShading = options.preserveShading !== false;
  const visibleVoxels = parsedModel.voxels.filter((voxel) => (voxel.rgba?.alpha ?? 255) >= 128);
  const mappedColors = preserveShading
    ? mapSourceColorsToPalette(
      visibleVoxels.map((voxel) => ({
        red: voxel.rgba.red,
        green: voxel.rgba.green,
        blue: voxel.rgba.blue,
      })),
      options.palette || PIXEL_ART_COLORS
    )
    : null;
  const model = createEmptyVoxelModel(size);

  visibleVoxels.forEach((voxel) => {
    const sourceColor = {
      red: voxel.rgba.red,
      green: voxel.rgba.green,
      blue: voxel.rgba.blue,
      alpha: voxel.rgba.alpha ?? 255,
    };
    const dye = mappedColors?.get(rgbKey(sourceColor)) ||
      findNearestPaletteColor(sourceColor.red, sourceColor.green, sourceColor.blue, options.palette || PIXEL_ART_COLORS);

    model.voxels.set(getVoxelKey(voxel), createVoxel({
      x: voxel.x,
      y: voxel.y,
      z: voxel.z,
      color: dye,
      sourceColor,
      colorIndex: voxel.colorIndex,
    }));
  });

  return model;
}

export function cloneVoxelModel(model) {
  const nextModel = createEmptyVoxelModel(model.size);
  model.voxels.forEach((voxel) => {
    nextModel.voxels.set(getVoxelKey(voxel), createVoxel(voxel));
  });
  return nextModel;
}

export function resizeVoxelModel(model, size) {
  const nextModel = createEmptyVoxelModel(size);

  model.voxels.forEach((voxel) => {
    if (isVoxelWithinBounds(voxel, nextModel.size)) {
      nextModel.voxels.set(getVoxelKey(voxel), createVoxel(voxel));
    }
  });

  return nextModel;
}

export function setVoxel(model, voxel) {
  if (!isVoxelWithinBounds(voxel, model.size)) {
    return false;
  }

  model.voxels.set(getVoxelKey(voxel), createVoxel(voxel));
  return true;
}

export function deleteVoxel(model, coordinates) {
  return model.voxels.delete(getVoxelKey(coordinates));
}

export function getVoxel(model, coordinates) {
  return model.voxels.get(getVoxelKey(coordinates)) || null;
}

export function countVoxels(model) {
  return model.voxels.size;
}

export function getVoxelArray(model) {
  return [...model.voxels.values()].sort((left, right) =>
    left.z - right.z ||
    left.y - right.y ||
    left.x - right.x
  );
}

export function voxelModelToExportModel(model) {
  return {
    size: { ...model.size },
    voxels: getVoxelArray(model).map((voxel) => ({
      x: voxel.x,
      y: voxel.y,
      z: voxel.z,
      colorIndex: voxel.colorIndex ?? 1,
      rgba: {
        ...dyeToRgba(voxel.color),
        alpha: 255,
      },
      color: { ...voxel.color },
      sourceColor: voxel.sourceColor ? { ...voxel.sourceColor } : null,
    })),
  };
}

export function createVoxel({
  x,
  y,
  z,
  color = PIXEL_ART_COLORS[0],
  sourceColor,
  colorIndex,
}) {
  const dyeColor = { ...color };
  const rgb = sourceColor || dyeToRgba(dyeColor);

  return {
    x: Number(x),
    y: Number(y),
    z: Number(z),
    color: dyeColor,
    sourceColor: {
      red: rgb.red,
      green: rgb.green,
      blue: rgb.blue,
      alpha: rgb.alpha ?? 255,
    },
    colorIndex,
  };
}

export function normalizeVoxelSize(size) {
  return {
    x: normalizeVoxelDimension(size.x),
    y: normalizeVoxelDimension(size.y),
    z: normalizeVoxelDimension(size.z),
  };
}

export function normalizeVoxelDimension(value, fallback = DEFAULT_VOXEL_DIMENSION) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), MAX_VOXEL_DIMENSION);
}

export function isVoxelWithinBounds(voxel, size) {
  return (
    Number.isInteger(voxel.x) &&
    Number.isInteger(voxel.y) &&
    Number.isInteger(voxel.z) &&
    voxel.x >= 0 &&
    voxel.y >= 0 &&
    voxel.z >= 0 &&
    voxel.x < size.x &&
    voxel.y < size.y &&
    voxel.z < size.z
  );
}

export function getVoxelKey(voxel) {
  return `${voxel.x},${voxel.y},${voxel.z}`;
}

export function dyeToRgba(color) {
  const rgb = hexToRgb(color.hex);
  return {
    red: rgb.red,
    green: rgb.green,
    blue: rgb.blue,
    alpha: 255,
  };
}
