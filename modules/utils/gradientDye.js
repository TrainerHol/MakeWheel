import { PIXEL_ART_COLORS } from "./dyes.js";
import { mapGradientToPoints, parseGradientAngle } from "./gradientFill.js";

const LAYOUT_FURNITURE_KEYS = ["interiorFurniture", "exteriorFurniture"];

export function detectMakePlaceDesignKind(json) {
  if (!json || typeof json !== "object") {
    throw new Error("File must contain a MakePlace JSON object.");
  }

  if (LAYOUT_FURNITURE_KEYS.some((key) => Array.isArray(json[key]))) {
    return "layout";
  }

  if (isLocatedFurnitureItem(json) || Array.isArray(json.attachments)) {
    return "custom-design";
  }

  throw new Error("JSON must be a MakePlace layout or custom design with located furniture.");
}

export function collectLocatedFurniture(json) {
  const kind = detectMakePlaceDesignKind(json);
  const entries = [];

  if (kind === "layout") {
    LAYOUT_FURNITURE_KEYS.forEach((key) => {
      const furniture = json[key];
      if (!Array.isArray(furniture)) return;

      furniture.forEach((item, index) => {
        collectFurnitureItem(item, [key, index], entries);
      });
    });
  } else {
    collectFurnitureItem(json, [], entries);
  }

  return entries;
}

export function isGradientDyeTarget(item) {
  return isLocatedFurnitureItem(item);
}

export function applyGradientToDesign(json, {
  startColor = PIXEL_ART_COLORS[0],
  endColor = PIXEL_ART_COLORS.at(-1),
  yawDegrees = 0,
  pitchDegrees = 0,
  palette = PIXEL_ART_COLORS,
} = {}) {
  const kind = detectMakePlaceDesignKind(json);
  const sourceEntries = collectLocatedFurniture(json);
  const targetEntries = sourceEntries.filter((entry) => entry.isDyeTarget);
  const clonedDesign = cloneJson(json);

  const mappedTargets = mapGradientToEntries(targetEntries, {
    startColor,
    endColor,
    yawDegrees,
    pitchDegrees,
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
  };
}

export function mapGradientToEntries(entries, {
  startColor = PIXEL_ART_COLORS[0],
  endColor = PIXEL_ART_COLORS.at(-1),
  yawDegrees = 0,
  pitchDegrees = 0,
  palette = PIXEL_ART_COLORS,
} = {}) {
  const points = entries.map((entry) => ({
    x: entry.position.x,
    y: entry.position.y,
    z: entry.position.z,
  }));
  const mapped = mapGradientToPoints(points, {
    startColor,
    endColor,
    yawDegrees: parseGradientAngle(yawDegrees, 0),
    pitchDegrees: parseGradientAngle(pitchDegrees, 0),
    palette,
  });

  return entries.map((entry, index) => ({
    ...entry,
    color: mapped.points[index]?.color || startColor,
  }));
}

export function getDesignStats(json) {
  const entries = collectLocatedFurniture(json);
  const targetCount = entries.filter((entry) => entry.isDyeTarget).length;

  return {
    kind: detectMakePlaceDesignKind(json),
    totalCount: entries.length,
    targetCount,
    skippedCount: entries.length - targetCount,
  };
}

function collectFurnitureItem(item, path, entries) {
  if (!item || typeof item !== "object") return;

  if (isLocatedFurnitureItem(item)) {
    const location = item.transform.location;
    entries.push({
      item,
      path,
      name: item.name || "Furniture",
      itemId: item.itemId,
      location: [...location],
      position: {
        x: Number(location[0]),
        y: Number(location[1]),
        z: Number(location[2]),
      },
      isDyeTarget: isGradientDyeTarget(item),
    });
  }

  if (!Array.isArray(item.attachments)) return;
  item.attachments.forEach((attachment, index) => {
    collectFurnitureItem(attachment, [...path, "attachments", index], entries);
  });
}

function isLocatedFurnitureItem(item) {
  if (!item || typeof item !== "object") return false;
  const location = item.transform?.location;
  return (
    Array.isArray(location) &&
    location.length >= 3 &&
    location.slice(0, 3).every((value) => Number.isFinite(Number(value)))
  );
}

function getByPath(root, path) {
  return path.reduce((current, segment) => current?.[segment], root);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
