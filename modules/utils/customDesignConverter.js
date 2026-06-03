const LAYOUT_FURNITURE_KEYS = ["interiorFurniture", "exteriorFurniture"];

export const DEFAULT_LAYOUT_SHELL = {
  lightLevel: 1,
  houseSize: "Small",
  interiorFixture: [
    {
      level: "",
      type: "District",
      name: "Mist",
      itemId: 0,
      color: "",
    },
    {
      level: "Basement",
      type: "Wall",
      name: "Storm Blue Interior Wall",
      itemId: 33248,
      color: "",
    },
    {
      level: "Basement",
      type: "Floor",
      name: "Glade Flooring",
      itemId: 6459,
      color: "",
    },
    {
      level: "Ground Floor",
      type: "Light",
      name: "Crystal Chandelier",
      itemId: 16013,
      color: "",
    },
    {
      level: "Ground Floor",
      type: "Floor",
      name: "Glade Flooring",
      itemId: 6459,
      color: "",
    },
    {
      level: "Ground Floor",
      type: "Wall",
      name: "Storm Blue Interior Wall",
      itemId: 33248,
      color: "",
    },
    {
      level: "Basement",
      type: "Light",
      name: "Crystal Chandelier",
      itemId: 16013,
      color: "",
    },
  ],
  exteriorScale: 100,
  exteriorFixture: [
    {
      level: "",
      type: "Window",
      name: "Riviera Arched Window",
      itemId: 6401,
      color: "",
    },
    {
      level: "",
      type: "Door",
      name: "Riviera Wooden Door",
      itemId: 6410,
      color: "BB9F7000",
    },
  ],
  exteriorFurniture: [],
  metaData: {
    version: 144,
  },
  interiorScale: 100,
  interiorFurniture: [],
  properties: {},
};

export function detectMakePlaceDesignKind(json) {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new Error("File must contain a MakePlace JSON object.");
  }

  if (LAYOUT_FURNITURE_KEYS.some((key) => Array.isArray(json[key]))) {
    return "layout";
  }

  if (isFurnitureItem(json) || Array.isArray(json.attachments)) {
    return "custom-design";
  }

  throw new Error("JSON must be a MakePlace layout or custom design.");
}

export function convertMakePlaceDesign(json) {
  const sourceKind = detectMakePlaceDesignKind(json);
  const converted = sourceKind === "layout"
    ? convertLayoutToCustomDesign(json)
    : convertCustomDesignToLayout(json);

  return {
    sourceKind,
    targetKind: sourceKind === "layout" ? "custom-design" : "layout",
    converted,
    summary: summarizeConvertedDesign(json),
  };
}

export function convertLayoutToCustomDesign(layout) {
  detectExpectedKind(layout, "layout");

  const sourceFurniture = getLayoutFurnitureSource(layout);
  if (sourceFurniture.length < 1) {
    throw new Error("Layout has no interior or exterior furniture to convert.");
  }

  const [rootSource, ...otherRoots] = sourceFurniture;
  const root = cloneJson(rootSource);
  root.attachments = Array.isArray(root.attachments) ? root.attachments : [];
  root.attachments.push(...otherRoots.map((item) => cloneJson(item)));
  return root;
}

export function convertCustomDesignToLayout(customDesign) {
  detectExpectedKind(customDesign, "custom-design");

  const interiorFurniture = getCustomDesignInteriorRoots(customDesign);
  if (interiorFurniture.length < 1) {
    throw new Error("Custom design has no furniture entries to convert.");
  }

  return {
    ...cloneJson(DEFAULT_LAYOUT_SHELL),
    interiorFurniture,
  };
}

export function summarizeConvertedDesign(json) {
  const sourceKind = detectMakePlaceDesignKind(json);
  if (sourceKind === "layout") {
    const sourceFurniture = getLayoutFurnitureSource(json);
    const sourceArea = getLayoutFurnitureSourceName(json);
    return {
      sourceKind,
      targetKind: "custom-design",
      sourceArea,
      rootCount: sourceFurniture.length,
      itemCount: countFurnitureItems(sourceFurniture),
      directionLabel: "Layout -> Custom Design",
    };
  }

  const interiorFurniture = getCustomDesignInteriorRoots(json);
  return {
    sourceKind,
    targetKind: "layout",
    sourceArea: "custom-design",
    rootCount: interiorFurniture.length,
    itemCount: countFurnitureItems(interiorFurniture),
    directionLabel: "Custom Design -> Layout",
  };
}

export function countFurnitureItems(items) {
  return items.reduce((total, item) => total + countFurnitureTree(item), 0);
}

function detectExpectedKind(json, expectedKind) {
  const kind = detectMakePlaceDesignKind(json);
  if (kind !== expectedKind) {
    throw new Error(`Expected ${expectedKind}, got ${kind}.`);
  }
}

function getLayoutFurnitureSource(layout) {
  if (Array.isArray(layout.interiorFurniture) && layout.interiorFurniture.length > 0) {
    return layout.interiorFurniture;
  }
  if (Array.isArray(layout.exteriorFurniture) && layout.exteriorFurniture.length > 0) {
    return layout.exteriorFurniture;
  }
  return [];
}

function getLayoutFurnitureSourceName(layout) {
  if (Array.isArray(layout.interiorFurniture) && layout.interiorFurniture.length > 0) {
    return "interiorFurniture";
  }
  if (Array.isArray(layout.exteriorFurniture) && layout.exteriorFurniture.length > 0) {
    return "exteriorFurniture";
  }
  return "none";
}

function getCustomDesignInteriorRoots(customDesign) {
  if (isFurnitureItem(customDesign)) {
    return [cloneJson(customDesign)];
  }
  if (Array.isArray(customDesign.attachments)) {
    return customDesign.attachments.map((item) => cloneJson(item));
  }
  return [];
}

function countFurnitureTree(item) {
  if (!item || typeof item !== "object") return 0;
  return 1 + (item.attachments || []).reduce((total, child) => total + countFurnitureTree(child), 0);
}

function isFurnitureItem(item) {
  return Boolean(item && typeof item === "object" && item.transform);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
