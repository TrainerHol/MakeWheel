// Color constants used throughout the application
export const COLORS = {
  // Point colors
  POINT: 0xff0000,        // Red
  CENTER: 0x00ff00,       // Green
  SEGMENT: 0xffff00,      // Yellow
  HIGHLIGHT: 0xdb63ff,    // Purple
  
  // Maze colors
  WALL: 0xff0000,         // Red
  WALL_EMISSIVE: 0x330000,
  WALL_SPECULAR: 0x331111,
  FLOOR: 0x0066ff,        // Blue
  FLOOR_EMISSIVE: 0x001133,
  FLOOR_SPECULAR: 0x113333,
  
  // UI colors
  AXIS_X: 0xff0000,       // Red
  AXIS_Y: 0x00ff00,       // Green
  AXIS_Z: 0x0000ff,       // Blue
  TEXT: 0xffffff,         // White
  EDGE: 0x000000,         // Black
  FLOOR_EDGE: 0x000044,   // Dark blue
  
  // Room colors
  GRID_CELL: 0x888888,    // Gray
  GRID_LINE: 0x444444,    // Dark gray
  SELECTED_CELL: 0x00ff00, // Green
  FLOOR_POINT: 0x0066ff,  // Blue
  WALL_POINT: 0xff0000,   // Red
  CENTER_POINT: 0x00ff00  // Green
};

// Size constants
export const SIZES = {
  // Sphere sizes
  DEFAULT_SPHERE: 1,
  SMALL_SPHERE: 0.5,
  CENTER_SPHERE: 0.5,
  
  // Scene elements
  AXIS_LENGTH: 60,
  AXIS_WIDTH: 2,
  GRID_SIZE: 100,
  GRID_DIVISIONS: 10,
  
  // Text
  TEXT_SIZE: 3,
  TEXT_HEIGHT: 0.1,
  TEXT_OFFSET: 2,
  
  // Default shape parameters
  DEFAULT_SEGMENTS: 50,
  DEFAULT_TURNS: 2,
  DEFAULT_RADIUS: 25
};

// Scaling constants
export const SCALING = {
  MAKEPLACE_MULTIPLIER: 100,  // Conversion factor for MakePlace format
  CAMERA_DISTANCE: 100,        // Default camera distance
  ZOOM_FACTOR: 0.1,           // Mouse wheel zoom sensitivity
  ROTATION_FACTOR: 1          // Mouse drag rotation sensitivity
};

// Default values for shapes
export const DEFAULTS = {
  // Wheel
  WHEEL: {
    POINT1: { x: 25, y: 0, z: 0 },
    POINT2: { x: -25, y: 0, z: 0 },
    REPETITIONS: 12,
    SEGMENTS: 0
  },
  
  // Spiral
  SPIRAL: {
    CENTER: { x: 0, y: 0, z: 0 },
    START: { x: 25, y: 0, z: 0 },
    SEGMENTS: 50,
    TURNS: 2,
    DIRECTION: 'clockwise'
  },
  
  // Conical Spiral
  CONICAL_SPIRAL: {
    SEGMENTS: 25,
    HEIGHT: 30,
    ORIENTATION: 'upright',
    START_POINT: 'center'
  },
  
  // Spherical Spiral
  SPHERICAL_SPIRAL: {
    RADIUS: 25,
    START_ANGLE: 0,
    END_ANGLE: 180
  },
  
  // Grid
  GRID: {
    ROWS: 3,
    COLUMNS: 3,
    SPACING: 4,
    STEP_AMOUNT: 2,
    FLOORS: 1
  },
  
  // Maze
  MAZE: {
    CELL_LENGTH: 4,
    WALL_WIDTH: 1,
    WALL_HEIGHT: 6,
    GRID_WIDTH: 5,
    GRID_HEIGHT: 5
  },
  
  // 3D Maze
  MAZE_3D: {
    FLOOR_LENGTH: 4,
    FLOOR_WIDTH: 4,
    GRID_WIDTH: 3,
    GRID_HEIGHT: 3,
    FLOORS: 2,
    MAX_FLOORS: 10
  },
  
  // Cylinder Spiral
  CYLINDER_SPIRAL: {
    RADIUS: 5,
    HEIGHT: 10,
    SEGMENTS: 36
  },
  
  // Room
  ROOM: {
    WALL_LENGTH: 4,
    WALL_WIDTH: 1,
    WALL_HEIGHT: 6,
    FLOOR_LENGTH: 4,
    FLOOR_WIDTH: 4
  }
};

// Animation and interaction constants
export const ANIMATION = {
  STEP_SIZE: 0.01,           // Step size for spiral calculations
  LINE_WIDTH: 2,             // Width for edge lines
  PRECISION: 4               // Decimal precision for coordinate comparison
};

// File handling constants
export const FILE = {
  JSON_INDENT: 2,            // Spaces for JSON formatting
  COORDINATE_PRECISION: 2,   // Decimal places for coordinate display
  MAKEPLACE_PRECISION: 0     // Decimal places for MakePlace format (integers)
};

// Mathematical constants
export const MATH = {
  TWO_PI: 2 * Math.PI,
  HALF_PI: Math.PI / 2,
  EPSILON: 0.0001           // Small value for float comparisons
};