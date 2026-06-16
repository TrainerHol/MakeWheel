export function createRandomGenerator(seed = "") {
  const normalizedSeed = String(seed ?? "").trim();
  if (!normalizedSeed) {
    return Math.random;
  }

  let state = 2166136261;
  for (let index = 0; index < normalizedSeed.length; index++) {
    state ^= normalizedSeed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSignedOffset(amount, random = Math.random) {
  return (random() * 2 - 1) * amount;
}

export function applyRandomDisplacementToVectors(vectors, {
  enabled = false,
  amount = 0,
  seed = "",
} = {}) {
  const displacement = Number(amount);
  if (!enabled || !Number.isFinite(displacement) || displacement <= 0) {
    return vectors;
  }

  const random = createRandomGenerator(seed);
  vectors.forEach((vector) => {
    vector.x += randomSignedOffset(displacement, random);
    vector.y += randomSignedOffset(displacement, random);
    vector.z += randomSignedOffset(displacement, random);
  });

  return vectors;
}

export function applyRandomDisplacementToMeshes(meshes, options = {}) {
  const positions = meshes.map((mesh) => mesh.position).filter(Boolean);
  applyRandomDisplacementToVectors(positions, options);
  return meshes;
}
