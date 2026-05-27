export const VOX_MAGIC = "VOX ";
export const SUPPORTED_VOX_VERSION = 150;

const DEFAULT_LEVELS = [255, 204, 153, 102, 51, 0];
const DEFAULT_RAMPS = [238, 221, 187, 170, 136, 119, 85, 68, 34, 17];

export function parseVoxFile(source) {
  const view = toDataView(source);
  if (view.byteLength < 8) {
    throw new Error("VOX file is too small.");
  }

  const magic = readId(view, 0);
  if (magic !== VOX_MAGIC) {
    throw new Error("File is not a MagicaVoxel .vox file.");
  }

  const version = view.getInt32(4, true);
  if (version !== SUPPORTED_VOX_VERSION) {
    throw new Error(`Unsupported VOX version ${version}.`);
  }

  const state = {
    packModelCount: null,
    pendingSize: null,
    models: [],
    rgbaPalette: null,
  };

  let offset = 8;
  while (offset < view.byteLength) {
    offset = parseChunk(view, offset, view.byteLength, state);
  }

  if (state.models.length !== 1) {
    throw new Error(`Voxel Art supports single-model .vox files. Found ${state.models.length}.`);
  }

  if (state.packModelCount !== null && state.packModelCount !== 1) {
    throw new Error(`Voxel Art supports single-model .vox files. PACK declares ${state.packModelCount}.`);
  }

  const palette = state.rgbaPalette || createMagicaVoxelDefaultPalette();
  const model = state.models[0];
  const voxels = model.voxels.map((voxel) => ({
    ...voxel,
    rgba: { ...palette[voxel.colorIndex] },
  }));

  return {
    version,
    size: model.size,
    voxels,
    palette,
    hasCustomPalette: Boolean(state.rgbaPalette),
  };
}

export function createMagicaVoxelDefaultPalette() {
  const palette = [{ red: 0, green: 0, blue: 0, alpha: 0 }];

  for (const red of DEFAULT_LEVELS) {
    for (const green of DEFAULT_LEVELS) {
      for (const blue of DEFAULT_LEVELS) {
        if (red === 0 && green === 0 && blue === 0) continue;
        palette.push({ red, green, blue, alpha: 255 });
      }
    }
  }

  DEFAULT_RAMPS.forEach((red) => palette.push({ red, green: 0, blue: 0, alpha: 255 }));
  DEFAULT_RAMPS.forEach((green) => palette.push({ red: 0, green, blue: 0, alpha: 255 }));
  DEFAULT_RAMPS.forEach((blue) => palette.push({ red: 0, green: 0, blue, alpha: 255 }));
  DEFAULT_RAMPS.forEach((value) => palette.push({ red: value, green: value, blue: value, alpha: 255 }));

  return palette;
}

function parseChunk(view, offset, limit, state) {
  if (offset + 12 > limit) {
    throw new Error("VOX chunk header is truncated.");
  }

  const id = readId(view, offset);
  const contentSize = view.getUint32(offset + 4, true);
  const childrenSize = view.getUint32(offset + 8, true);
  const contentStart = offset + 12;
  const childrenStart = contentStart + contentSize;
  const nextOffset = childrenStart + childrenSize;

  if (nextOffset > limit) {
    throw new Error(`VOX chunk ${id} exceeds the file bounds.`);
  }

  parseChunkContent(id, view, contentStart, contentSize, state);

  let childOffset = childrenStart;
  while (childOffset < nextOffset) {
    childOffset = parseChunk(view, childOffset, nextOffset, state);
  }

  return nextOffset;
}

function parseChunkContent(id, view, offset, contentSize, state) {
  if (id === "PACK") {
    if (contentSize < 4) {
      throw new Error("PACK chunk is truncated.");
    }
    state.packModelCount = view.getInt32(offset, true);
    return;
  }

  if (id === "SIZE") {
    if (contentSize < 12) {
      throw new Error("SIZE chunk is truncated.");
    }

    state.pendingSize = {
      x: view.getInt32(offset, true),
      y: view.getInt32(offset + 4, true),
      z: view.getInt32(offset + 8, true),
    };
    validateSize(state.pendingSize);
    return;
  }

  if (id === "XYZI") {
    if (!state.pendingSize) {
      throw new Error("XYZI chunk appeared before SIZE.");
    }
    if (contentSize < 4) {
      throw new Error("XYZI chunk is truncated.");
    }

    const voxelCount = view.getUint32(offset, true);
    const expectedSize = 4 + voxelCount * 4;
    if (contentSize < expectedSize) {
      throw new Error("XYZI voxel data is truncated.");
    }

    const voxels = [];
    let voxelOffset = offset + 4;
    for (let index = 0; index < voxelCount; index++) {
      const voxel = {
        x: view.getUint8(voxelOffset),
        y: view.getUint8(voxelOffset + 1),
        z: view.getUint8(voxelOffset + 2),
        colorIndex: view.getUint8(voxelOffset + 3),
      };
      validateVoxel(voxel, state.pendingSize);
      voxels.push(voxel);
      voxelOffset += 4;
    }

    state.models.push({
      size: state.pendingSize,
      voxels,
    });
    state.pendingSize = null;
    return;
  }

  if (id === "RGBA") {
    if (contentSize < 1024) {
      throw new Error("RGBA palette chunk is truncated.");
    }

    const palette = [{ red: 0, green: 0, blue: 0, alpha: 0 }];
    for (let index = 0; index <= 254; index++) {
      const colorOffset = offset + index * 4;
      palette[index + 1] = {
        red: view.getUint8(colorOffset),
        green: view.getUint8(colorOffset + 1),
        blue: view.getUint8(colorOffset + 2),
        alpha: view.getUint8(colorOffset + 3),
      };
    }
    state.rgbaPalette = palette;
  }
}

function validateSize(size) {
  if (
    !Number.isInteger(size.x) ||
    !Number.isInteger(size.y) ||
    !Number.isInteger(size.z) ||
    size.x < 1 ||
    size.y < 1 ||
    size.z < 1
  ) {
    throw new Error("SIZE chunk contains invalid model dimensions.");
  }
}

function validateVoxel(voxel, size) {
  if (
    voxel.x >= size.x ||
    voxel.y >= size.y ||
    voxel.z >= size.z
  ) {
    throw new Error("XYZI chunk contains a voxel outside the model size.");
  }

  if (voxel.colorIndex < 1) {
    throw new Error("XYZI chunk contains an invalid color index.");
  }
}

function toDataView(source) {
  if (source instanceof DataView) {
    return source;
  }

  if (source instanceof ArrayBuffer) {
    return new DataView(source);
  }

  if (ArrayBuffer.isView(source)) {
    return new DataView(source.buffer, source.byteOffset, source.byteLength);
  }

  throw new Error("Expected an ArrayBuffer or typed array for VOX parsing.");
}

function readId(view, offset) {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3)
  );
}
