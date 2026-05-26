export const CUSTOM_DESIGN_COORDINATE_SCALE = 0.64;

// MakePlace custom designs import positions at 100/64 of layout space; exporting
// at 64/100 keeps a 400-unit reference-grid step from appearing as 625 in-game.
export function toCustomDesignSpacing(layoutSpacing) {
  return Number((layoutSpacing * CUSTOM_DESIGN_COORDINATE_SCALE).toFixed(4));
}

export const PIXEL_ART_FURNITURE = [
  {
    id: "white-rectangular-partition",
    name: "White Rectangular Partition",
    itemId: 24514,
    layout: "vertical-xz",
    layoutColumnSpacing: 400,
    layoutRowSpacing: 300,
    customDesignColumnSpacing: toCustomDesignSpacing(400),
    customDesignRowSpacing: toCustomDesignSpacing(300),
    fixedCoordinate: 0,
    rotation: [0, 0, 0, 1],
    scale: [1, 1, 1],
  },
  {
    id: "shipping-crate",
    name: "Shipping Crate (Vertical)",
    itemId: 8796,
    layout: "vertical-xz",
    layoutColumnSpacing: 70,
    layoutRowSpacing: 70,
    customDesignColumnSpacing: toCustomDesignSpacing(70),
    customDesignRowSpacing: toCustomDesignSpacing(70),
    fixedCoordinate: 0,
    rotation: [0, 0, 0, 1],
    scale: [1, 1, 1],
  },
  {
    id: "shipping-crate-horizontal",
    name: "Shipping Crate (Horizontal)",
    itemId: 8796,
    layout: "floor-xy",
    layoutColumnSpacing: 70,
    layoutRowSpacing: 70,
    customDesignColumnSpacing: toCustomDesignSpacing(70),
    customDesignRowSpacing: toCustomDesignSpacing(70),
    fixedCoordinate: 0,
    rotation: [0, 0, 0, 1],
    scale: [1, 1, 1],
  },
  {
    id: "combed-wool-rug",
    name: "Combed Wool Rug",
    itemId: 15976,
    layout: "floor-xy",
    layoutColumnSpacing: 400,
    layoutRowSpacing: 400,
    customDesignColumnSpacing: toCustomDesignSpacing(400),
    customDesignRowSpacing: toCustomDesignSpacing(400),
    fixedCoordinate: 0,
    rotation: [0, 0, 0, 1],
    scale: [1, 1, 1],
  },
  {
    id: "flooring-mat",
    name: "Flooring Mat",
    itemId: 28134,
    layout: "floor-xy",
    layoutColumnSpacing: 400,
    layoutRowSpacing: 400,
    customDesignColumnSpacing: toCustomDesignSpacing(400),
    customDesignRowSpacing: toCustomDesignSpacing(400),
    fixedCoordinate: 0,
    rotation: [0, 0, 0, 1],
    scale: [1, 1, 1],
  },
  {
    id: "wooden-loft",
    name: "Wooden Loft",
    itemId: 24511,
    layout: "floor-xy",
    layoutColumnSpacing: 400,
    layoutRowSpacing: 400,
    customDesignColumnSpacing: toCustomDesignSpacing(400),
    customDesignRowSpacing: toCustomDesignSpacing(400),
    fixedCoordinate: 0,
    rotation: [0, 0, 0, 1],
    scale: [1, 1, 1],
  },
];

export function getPixelArtFurniture(furnitureId) {
  return PIXEL_ART_FURNITURE.find((furniture) => furniture.id === furnitureId) || PIXEL_ART_FURNITURE[0];
}
