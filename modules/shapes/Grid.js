import { BaseShape } from '../base/BaseShape.js';
import { COLORS, DEFAULTS } from '../utils/constants.js';

/**
 * Generates grid patterns with points arranged in rows and columns
 */
export class Grid extends BaseShape {
  constructor(scene) {
    super(scene);
    this.shapeType = 'grid';
  }

  /**
   * Generates a grid of points
   * @param {Object} params - Generation parameters
   */
  generate(params) {
    const {
      centerPoint = new THREE.Vector3(DEFAULTS.SPIRAL.CENTER.x, DEFAULTS.SPIRAL.CENTER.y, DEFAULTS.SPIRAL.CENTER.z),
      rows = DEFAULTS.GRID.ROWS,
      columns = DEFAULTS.GRID.COLUMNS,
      spacing = DEFAULTS.GRID.SPACING,
      stepAmount = DEFAULTS.GRID.STEP_AMOUNT,
      floors = DEFAULTS.GRID.FLOORS
    } = params;

    this.clearPoints();

    // Create center point
    this.centerPoint = this.createSphere(centerPoint, COLORS.CENTER);

    // Calculate grid dimensions
    const halfWidth = ((columns - 1) * spacing) / 2;
    const halfHeight = ((rows - 1) * spacing) / 2;

    // Generate a random starting corner
    const startRow = Math.random() < 0.5 ? 0 : rows - 1;
    const startCol = Math.random() < 0.5 ? 0 : columns - 1;
    const path = this.generateGridPath(rows, columns, floors, [startRow, startCol, 0]);
    const points = [];

    let lastPoint = null;
    for (let i = 0; i < path.length; i++) {
      const [row, col, floor] = path[i];

      const x = centerPoint.x - halfWidth + col * spacing;
      const y = centerPoint.y + i * stepAmount - (floor >= 1 ? floor * stepAmount : 0);
      const z = centerPoint.z - halfHeight + row * spacing;

      const point = new THREE.Vector3(x, y, z);

      // Check if this point is at the same x,z coordinate as the last point
      if (lastPoint && lastPoint.x === point.x && lastPoint.z === point.z) {
        // If it is, we're starting a new floor. Update the y-coordinate of the last point
        lastPoint.y = point.y;
      } else {
        // Otherwise, add the new point
        points.push(point);
        lastPoint = point;
      }
    }

    // Create spheres for each point
    points.forEach((point) => {
      const sphere = this.createSphere(point, COLORS.POINT);
      this.allPoints.push(sphere);
    });

    // Add lines to connect points along the path
    for (let i = 1; i < points.length; i++) {
      this.createLine(points[i - 1], points[i], COLORS.TEXT);
    }
  }

  /**
   * Generates a path through the grid that visits all cells
   * @param {number} rows - Number of rows
   * @param {number} columns - Number of columns
   * @param {number} floors - Number of floors
   * @param {Array} startPoint - Starting position [row, col, floor]
   * @returns {Array} Path through the grid
   */
  generateGridPath(rows, columns, floors, startPoint = null) {
    const totalCells = rows * columns * floors;
    const path = [];
    const visited = new Set();

    let current = startPoint || [0, 0, 0];

    const directions = [
      [0, 1, 0],   // Right
      [1, 0, 0],   // Down
      [0, -1, 0],  // Left
      [-1, 0, 0],  // Up
    ];

    while (path.length < totalCells) {
      path.push(current);
      visited.add(`${current[0]},${current[1]},${current[2]}`);

      // Find the next unvisited neighbor
      let nextCell = null;
      for (const [dx, dy, dz] of directions) {
        const next = [
          Math.min(Math.max(current[0] + dx, 0), rows - 1),
          Math.min(Math.max(current[1] + dy, 0), columns - 1),
          current[2]
        ];
        if (!visited.has(`${next[0]},${next[1]},${next[2]}`)) {
          nextCell = next;
          break;
        }
      }

      if (nextCell) {
        current = nextCell;
      } else {
        // Move to the next floor if all cells on the current floor are visited
        if (current[2] < floors - 1) {
          // Use the last point of the current floor as the start point for the next floor
          current = [current[0], current[1], current[2] + 1];
        } else {
          break; // All cells visited
        }
      }
    }

    return path;
  }

  /**
   * Validates grid generation parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result
   */
  validateInput(params) {
    const { rows, columns, spacing, stepAmount, floors } = params;

    if (rows < 2 || rows > 20) {
      return { valid: false, error: 'Rows must be between 2 and 20' };
    }

    if (columns < 2 || columns > 20) {
      return { valid: false, error: 'Columns must be between 2 and 20' };
    }

    if (spacing <= 0 || spacing > 50) {
      return { valid: false, error: 'Spacing must be between 0 and 50' };
    }

    if (stepAmount <= 0 || stepAmount > 50) {
      return { valid: false, error: 'Step amount must be between 0 and 50' };
    }

    if (floors < 1 || floors > 10) {
      return { valid: false, error: 'Floors must be between 1 and 10' };
    }

    return { valid: true, error: null };
  }
}