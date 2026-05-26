import { getPixelArtFurniture } from "./pixelArtFurniture.js";

export function createEmptyPixelGrid(width = 8, height = 8) {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => null));
}

export function resizePixelGrid(grid, width, height) {
  const nextGrid = createEmptyPixelGrid(width, height);
  const previousHeight = grid.length;
  const previousWidth = previousHeight > 0 ? grid[0].length : 0;
  const copyHeight = Math.min(previousHeight, height);
  const copyWidth = Math.min(previousWidth, width);

  for (let row = 0; row < copyHeight; row++) {
    for (let col = 0; col < copyWidth; col++) {
      nextGrid[row][col] = grid[row][col];
    }
  }

  return nextGrid;
}

export function clonePixelGrid(grid) {
  return grid.map((row) => row.map((pixel) => (pixel ? { ...pixel } : null)));
}

export function countFilledPixels(grid) {
  return grid.reduce(
    (total, row) => total + row.filter((pixel) => Boolean(pixel)).length,
    0
  );
}

export function getPixelLocation(row, col, width, height, furniture) {
  const x = (col - (width - 1) / 2) * furniture.customDesignColumnSpacing;
  const rowOffset = furniture.layout === "floor-xy"
    ? row - (height - 1) / 2
    : (height - 1) / 2 - row;
  const rowCoordinate = rowOffset * furniture.customDesignRowSpacing;

  if (furniture.layout === "floor-xy") {
    return [roundCoordinate(x), roundCoordinate(rowCoordinate), furniture.fixedCoordinate];
  }

  return [roundCoordinate(x), furniture.fixedCoordinate, roundCoordinate(rowCoordinate)];
}

export function getRootPixel(grid, width, height) {
  const centerRow = (height - 1) / 2;
  const centerCol = (width - 1) / 2;
  let rootPixel = null;

  grid.forEach((rowPixels, row) => {
    rowPixels.forEach((pixel, col) => {
      if (!pixel) return;

      const distance = Math.hypot(row - centerRow, col - centerCol);
      if (
        !rootPixel ||
        distance < rootPixel.distance ||
        (distance === rootPixel.distance && row < rootPixel.row) ||
        (distance === rootPixel.distance && row === rootPixel.row && col < rootPixel.col)
      ) {
        rootPixel = {
          row,
          col,
          pixel,
          distance,
        };
      }
    });
  });

  return rootPixel;
}

function createFurnitureEntry(pixel, furniture, location) {
  return {
    itemId: furniture.itemId,
    name: furniture.name,
    transform: {
      location,
      rotation: [...furniture.rotation],
      scale: [...furniture.scale],
    },
    properties: {
      color: pixel.hex,
    },
  };
}

export function createPixelArtDesign({
  grid,
  width,
  height,
  furnitureId,
  furniture: customFurniture,
  designName = "Pixel Art",
}) {
  const furniture = customFurniture || getPixelArtFurniture(furnitureId);
  const rootPixel = getRootPixel(grid, width, height);
  if (!rootPixel) {
    throw new Error("Pixel art design needs at least one filled pixel.");
  }

  const rootLocation = getPixelLocation(rootPixel.row, rootPixel.col, width, height, furniture);
  const rootEntry = createFurnitureEntry(rootPixel.pixel, furniture, rootLocation);
  const attachments = [];

  grid.forEach((rowPixels, row) => {
    rowPixels.forEach((pixel, col) => {
      if (!pixel) return;
      if (row === rootPixel.row && col === rootPixel.col) return;

      const location = getPixelLocation(row, col, width, height, furniture);
      attachments.push(createFurnitureEntry(pixel, furniture, location));
    });
  });

  return {
    ...rootEntry,
    name: designName.trim() || "Pixel Art",
    properties: {
      ...rootEntry.properties,
      designName: `${width}x${height} Pixel Art`,
      furnitureType: furniture.name,
    },
    attachments,
  };
}

function roundCoordinate(value) {
  return Number.isInteger(value) ? value : Number(value.toFixed(4));
}
