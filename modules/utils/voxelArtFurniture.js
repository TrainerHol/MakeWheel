import { toCustomDesignSpacing } from "./pixelArtFurniture.js";

export const CUSTOM_VOXEL_FURNITURE_ID = "custom-voxel-furniture";

export const VOXEL_ART_FURNITURE = [
  createVoxelArtFurniture({
    id: "shipping-crate",
    name: "Shipping Crate",
    itemId: 8796,
    layoutXSpacing: 70,
    layoutDepthSpacing: 70,
    layoutHeightSpacing: 70,
    supportsEdgeRotation: false,
  }),
  createVoxelArtFurniture({
    id: "white-rectangular-partition",
    name: "White Rectangular Partition",
    itemId: 24514,
    layoutXSpacing: 400,
    layoutDepthSpacing: 400,
    layoutHeightSpacing: 300,
    supportsEdgeRotation: true,
  }),
];

export function createVoxelArtFurniture({
  id = CUSTOM_VOXEL_FURNITURE_ID,
  name,
  itemId,
  layoutXSpacing,
  layoutDepthSpacing,
  layoutHeightSpacing,
  supportsEdgeRotation = true,
}) {
  return {
    id,
    name,
    itemId,
    layoutXSpacing,
    layoutDepthSpacing,
    layoutHeightSpacing,
    customDesignXSpacing: toCustomDesignSpacing(layoutXSpacing),
    customDesignDepthSpacing: toCustomDesignSpacing(layoutDepthSpacing),
    customDesignHeightSpacing: toCustomDesignSpacing(layoutHeightSpacing),
    supportsEdgeRotation,
    rotation: [0, 0, 0, 1],
    scale: [1, 1, 1],
  };
}

export function getVoxelArtFurniture(furnitureId) {
  return VOXEL_ART_FURNITURE.find((furniture) => furniture.id === furnitureId) || VOXEL_ART_FURNITURE[0];
}

export { toCustomDesignSpacing };
