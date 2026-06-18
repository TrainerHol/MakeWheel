import {
  PIXEL_ART_COLORS,
  getRandomColorDyePalette,
} from "./dyes.js";
import {
  collectLocatedFurniture,
  detectMakePlaceDesignKind,
} from "./gradientDye.js";
import { createRandomGenerator } from "./randomization.js";

export function applyRandomColorsToDesign(json, {
  includeSpecialDyes = false,
  seed = "",
  palette = PIXEL_ART_COLORS,
} = {}) {
  const kind = detectMakePlaceDesignKind(json);
  const sourceEntries = collectLocatedFurniture(json);
  const targetEntries = sourceEntries.filter((entry) => entry.isDyeTarget);
  const clonedDesign = cloneJson(json);
  const mappedTargets = mapRandomColorsToEntries(targetEntries, {
    includeSpecialDyes,
    seed,
    palette,
  });

  mappedTargets.forEach((mappedEntry) => {
    const targetItem = getByPath(clonedDesign, mappedEntry.path);
    if (!targetItem) return;
    targetItem.properties = {
      ...(targetItem.properties || {}),
      color: mappedEntry.color.hex,
    };
  });

  return {
    design: clonedDesign,
    kind,
    entries: sourceEntries,
    totalCount: sourceEntries.length,
    targetCount: targetEntries.length,
    skippedCount: sourceEntries.length - targetEntries.length,
    changedCount: mappedTargets.length,
    paletteCount: getRandomColorDyePalette({ includeSpecialDyes, palette }).length,
  };
}

export function mapRandomColorsToEntries(entries, {
  includeSpecialDyes = false,
  seed = "",
  palette = PIXEL_ART_COLORS,
} = {}) {
  const colors = getRandomColorDyePalette({ includeSpecialDyes, palette });
  if (colors.length < 1) {
    throw new Error("No dye colors are available for the selected random color options.");
  }

  const random = createRandomGenerator(seed);
  return entries.map((entry) => ({
    ...entry,
    color: colors[getRandomIndex(colors.length, random)],
  }));
}

function getRandomIndex(length, random) {
  return Math.min(Math.floor(random() * length), length - 1);
}

function getByPath(root, path) {
  return path.reduce((current, segment) => current?.[segment], root);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
