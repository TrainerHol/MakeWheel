import { PIXEL_ART_COLORS } from "./dyes.js";
import { findNearestPaletteColor } from "./colorMapping.js";
import { getVoxelArtFurniture } from "./voxelArtFurniture.js";

const VOXEL_ALPHA_THRESHOLD = 128;
const NEIGHBOR_OFFSETS = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

const EDGE_YAWS = {
  front: 0,
  right: Math.PI / 2,
  back: Math.PI,
  left: -Math.PI / 2,
};

export function createVoxelArtDesign({
  model,
  furnitureId,
  furniture: customFurniture,
  designName = "Voxel Art",
  removeHiddenVoxels = true,
  rotateClosestToEdge = false,
}) {
  const furniture = customFurniture || getVoxelArtFurniture(furnitureId);
  const summary = summarizeVoxelExport(model, { removeHiddenVoxels });
  const visibleVoxels = summary.visibleVoxels;

  if (visibleVoxels.length < 1) {
    throw new Error("Voxel art design needs at least one visible voxel.");
  }

  const bounds = getVoxelBounds(visibleVoxels);
  const rootVoxel = getRootVoxel(visibleVoxels, model.size);
  const rootEntry = createFurnitureEntry(
    rootVoxel,
    model.size,
    furniture,
    bounds,
    rotateClosestToEdge
  );
  const attachments = [];

  visibleVoxels.forEach((voxel) => {
    if (voxel === rootVoxel) return;
    attachments.push(createFurnitureEntry(
      voxel,
      model.size,
      furniture,
      bounds,
      rotateClosestToEdge
    ));
  });

  return {
    ...rootEntry,
    name: designName.trim() || "Voxel Art",
    properties: {
      ...rootEntry.properties,
      designName: `${model.size.x}x${model.size.y}x${model.size.z} Voxel Art`,
      furnitureType: furniture.name,
      sourceVoxelCount: summary.totalVoxels,
      exportedVoxelCount: summary.exportedVoxelCount,
      skippedHiddenVoxelCount: summary.skippedHiddenVoxelCount,
    },
    attachments,
  };
}

export function summarizeVoxelExport(model, { removeHiddenVoxels = true } = {}) {
  validateVoxelModel(model);

  const solidVoxels = model.voxels.filter(isOpaqueVoxel);
  const visibleVoxels = removeHiddenVoxels
    ? removeHiddenVoxelsFromList(solidVoxels, model.size)
    : solidVoxels;

  return {
    size: { ...model.size },
    totalVoxels: model.voxels.length,
    solidVoxelCount: solidVoxels.length,
    exportedVoxelCount: visibleVoxels.length,
    skippedHiddenVoxelCount: solidVoxels.length - visibleVoxels.length,
    visibleVoxels,
  };
}

export function removeHiddenVoxelsFromList(voxels, size) {
  const occupied = new Set(voxels.map(getVoxelKey));
  const exteriorAir = findExteriorAir(size, occupied);

  return voxels.filter((voxel) =>
    NEIGHBOR_OFFSETS.some(([dx, dy, dz]) =>
      exteriorAir.has(createVoxelKey(voxel.x + dx, voxel.y + dy, voxel.z + dz))
    )
  );
}

export function findExteriorAir(size, occupied) {
  const bounds = {
    minX: -1,
    maxX: size.x,
    minY: -1,
    maxY: size.y,
    minZ: -1,
    maxZ: size.z,
  };
  const exterior = new Set();
  const queue = [[bounds.minX, bounds.minY, bounds.minZ]];
  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const [x, y, z] = queue[queueIndex];
    queueIndex += 1;
    const key = createVoxelKey(x, y, z);
    if (exterior.has(key) || occupied.has(key)) continue;
    if (
      x < bounds.minX ||
      x > bounds.maxX ||
      y < bounds.minY ||
      y > bounds.maxY ||
      z < bounds.minZ ||
      z > bounds.maxZ
    ) {
      continue;
    }

    exterior.add(key);
    NEIGHBOR_OFFSETS.forEach(([dx, dy, dz]) => {
      queue.push([x + dx, y + dy, z + dz]);
    });
  }

  return exterior;
}

export function getVoxelLocation(voxel, size, furniture) {
  const x = (voxel.x - (size.x - 1) / 2) * furniture.customDesignXSpacing;
  const depth = (voxel.y - (size.y - 1) / 2) * furniture.customDesignDepthSpacing;
  const height = (voxel.z - (size.z - 1) / 2) * furniture.customDesignHeightSpacing;

  return [
    roundCoordinate(x),
    roundCoordinate(depth),
    roundCoordinate(height),
  ];
}

export function getClosestEdgeYaw(voxel, bounds) {
  const distances = [
    { edge: "front", distance: voxel.y - bounds.minY },
    { edge: "right", distance: bounds.maxX - voxel.x },
    { edge: "back", distance: bounds.maxY - voxel.y },
    { edge: "left", distance: voxel.x - bounds.minX },
  ];

  distances.sort((left, right) => left.distance - right.distance);
  return EDGE_YAWS[distances[0].edge];
}

export function yawToQuaternion(angle) {
  return [
    0,
    0,
    roundQuaternion(Math.sin(angle / 2)),
    roundQuaternion(Math.cos(angle / 2)),
  ];
}

export function getRootVoxel(voxels, size) {
  const center = {
    x: (size.x - 1) / 2,
    y: (size.y - 1) / 2,
    z: (size.z - 1) / 2,
  };
  let rootVoxel = null;

  voxels.forEach((voxel) => {
    const distance = Math.hypot(
      voxel.x - center.x,
      voxel.y - center.y,
      voxel.z - center.z
    );

    if (
      !rootVoxel ||
      distance < rootVoxel.distance ||
      (distance === rootVoxel.distance && voxel.z < rootVoxel.voxel.z) ||
      (distance === rootVoxel.distance && voxel.z === rootVoxel.voxel.z && voxel.y < rootVoxel.voxel.y) ||
      (distance === rootVoxel.distance && voxel.z === rootVoxel.voxel.z && voxel.y === rootVoxel.voxel.y && voxel.x < rootVoxel.voxel.x)
    ) {
      rootVoxel = { voxel, distance };
    }
  });

  return rootVoxel?.voxel || null;
}

export function getVoxelBounds(voxels) {
  return voxels.reduce(
    (bounds, voxel) => ({
      minX: Math.min(bounds.minX, voxel.x),
      maxX: Math.max(bounds.maxX, voxel.x),
      minY: Math.min(bounds.minY, voxel.y),
      maxY: Math.max(bounds.maxY, voxel.y),
      minZ: Math.min(bounds.minZ, voxel.z),
      maxZ: Math.max(bounds.maxZ, voxel.z),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
      minZ: Number.POSITIVE_INFINITY,
      maxZ: Number.NEGATIVE_INFINITY,
    }
  );
}

function createFurnitureEntry(voxel, size, furniture, bounds, rotateClosestToEdge) {
  const dye = voxel.color
    ? { ...voxel.color }
    : findNearestPaletteColor(
      voxel.rgba.red,
      voxel.rgba.green,
      voxel.rgba.blue,
      PIXEL_ART_COLORS
    );
  const shouldRotate = rotateClosestToEdge && furniture.supportsEdgeRotation;

  return {
    itemId: furniture.itemId,
    name: furniture.name,
    transform: {
      location: getVoxelLocation(voxel, size, furniture),
      rotation: shouldRotate
        ? yawToQuaternion(getClosestEdgeYaw(voxel, bounds))
        : [...furniture.rotation],
      scale: [...furniture.scale],
    },
    properties: {
      color: dye.hex,
    },
  };
}

function validateVoxelModel(model) {
  if (!model?.size || !Array.isArray(model.voxels)) {
    throw new Error("A parsed voxel model is required.");
  }
}

function isOpaqueVoxel(voxel) {
  return (voxel.rgba?.alpha ?? 255) >= VOXEL_ALPHA_THRESHOLD;
}

function getVoxelKey(voxel) {
  return createVoxelKey(voxel.x, voxel.y, voxel.z);
}

function createVoxelKey(x, y, z) {
  return `${x},${y},${z}`;
}

function roundCoordinate(value) {
  return Number.isInteger(value) ? value : Number(value.toFixed(4));
}

function roundQuaternion(value) {
  if (Math.abs(value) < 0.0000001) return 0;
  return Number.isInteger(value) ? value : Number(value.toFixed(6));
}
