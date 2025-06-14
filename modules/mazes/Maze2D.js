import { BaseMaze } from '../base/BaseMaze.js';
import { COLORS, DEFAULTS, MATH } from '../utils/constants.js';

/**
 * Generates 2D mazes using depth-first search algorithm
 */
export class Maze2D extends BaseMaze {
  constructor(scene) {
    super(scene);
    this.defaultLength = DEFAULTS.MAZE.CELL_LENGTH;
    this.defaultWidth = DEFAULTS.MAZE.WALL_WIDTH;
    this.defaultHeight = DEFAULTS.MAZE.WALL_HEIGHT;
  }

  /**
   * Generates a 2D maze
   * @param {Object} params - Generation parameters
   * @returns {Array} Array of generated points
   */
  generate(params) {
    const {
      itemLength = this.defaultLength,
      itemWidth = this.defaultWidth,
      itemHeight = this.defaultHeight,
      width = DEFAULTS.MAZE.GRID_WIDTH,
      height = width
    } = params;

    this.clearMaze();

    // Initialize grid with cells
    this.initializeGrid(width, height);

    // Generate maze using depth-first search
    this.generateMazePaths();

    // Create walls based on connections
    this.createMazeWalls(itemLength, itemWidth, itemHeight, width, height);

    // Add center marker
    this.centerPoint = new THREE.Vector3(0, 0, 0);
    const centerSphere = this.createSphere(this.centerPoint, COLORS.CENTER);
    this.scene.add(centerSphere);

    // Deduplicate elements
    this.deduplicateElements();

    return this.allPoints;
  }

  /**
   * Initializes the grid with cells
   * @param {number} width - Grid width
   * @param {number} height - Grid height
   */
  initializeGrid(width, height) {
    this.grid = Array(height)
      .fill()
      .map((_, y) =>
        Array(width)
          .fill()
          .map((_, x) => ({
            pos: { x, y },
            connections: new Set(),
            neighbours: [],
            isVisited: false,
          }))
      );

    // Setup neighbours for each cell
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = this.grid[y][x];
        const offsets = [
          [-1, 0], // Left
          [1, 0],  // Right
          [0, -1], // Up
          [0, 1],  // Down
        ];

        cell.neighbours = offsets
          .map(([dx, dy]) => {
            const newX = x + dx;
            const newY = y + dy;
            return this.isValidCell(this.grid, newX, newY) ? this.grid[newY][newX] : null;
          })
          .filter((n) => n !== null);
      }
    }
  }

  /**
   * Generates maze paths using depth-first search
   */
  generateMazePaths() {
    const startCell = this.grid[0][0];
    startCell.isVisited = true;
    let currentCell = startCell;
    const stack = [startCell];

    while (stack.length > 0) {
      const unvisitedNeighbours = currentCell.neighbours.filter((n) => !n.isVisited);

      if (unvisitedNeighbours.length > 0) {
        // Choose a random unvisited neighbour
        const nextCell = unvisitedNeighbours[Math.floor(Math.random() * unvisitedNeighbours.length)];

        // Create bidirectional connection
        currentCell.connections.add(nextCell);
        nextCell.connections.add(currentCell);

        // Mark as visited and move to next cell
        nextCell.isVisited = true;
        stack.push(nextCell);
        currentCell = nextCell;
      } else {
        // Backtrack
        currentCell = stack.pop();
      }
    }
  }

  /**
   * Creates walls for the maze based on cell connections
   * @param {number} itemLength - Cell length
   * @param {number} itemWidth - Wall width
   * @param {number} itemHeight - Wall height
   * @param {number} width - Grid width
   * @param {number} height - Grid height
   */
  createMazeWalls(itemLength, itemWidth, itemHeight, width, height) {
    const mazeWidth = width * itemLength;
    const mazeDepth = height * itemLength;
    const offsetX = -mazeWidth / 2;
    const offsetZ = -mazeDepth / 2;
    const offsetY = itemHeight / 2;

    // Use a Map to store unique walls
    const uniqueWalls = new Map();

    const addUniqueWall = (position, rotation, dimensions) => {
      const key = this.getElementKey(position, rotation);
      if (!uniqueWalls.has(key)) {
        uniqueWalls.set(key, { position, rotation, dimensions });
      }
    };

    // Create internal walls
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = this.grid[y][x];
        const worldX = x * itemLength + offsetX + itemLength / 2;
        const worldZ = y * itemLength + offsetZ + itemLength / 2;

        // Add walls where there are no connections
        const hasNorth = cell.connections.has(this.grid[y - 1]?.[x]);
        const hasEast = cell.connections.has(this.grid[y]?.[x + 1]);
        const hasSouth = cell.connections.has(this.grid[y + 1]?.[x]);
        const hasWest = cell.connections.has(this.grid[y]?.[x - 1]);

        if (!hasNorth && y > 0) {
          addUniqueWall([worldX, offsetY, worldZ - itemLength / 2], MATH.HALF_PI, [itemWidth, itemHeight, itemLength]);
        }
        if (!hasEast && x < width - 1) {
          addUniqueWall([worldX + itemLength / 2, offsetY, worldZ], 0, [itemWidth, itemHeight, itemLength]);
        }
        if (!hasSouth && y < height - 1) {
          addUniqueWall([worldX, offsetY, worldZ + itemLength / 2], MATH.HALF_PI, [itemWidth, itemHeight, itemLength]);
        }
        if (!hasWest && x > 0) {
          addUniqueWall([worldX - itemLength / 2, offsetY, worldZ], 0, [itemWidth, itemHeight, itemLength]);
        }
      }
    }

    // Create outer walls
    this.createOuterWalls(width, height, itemLength, itemWidth, itemHeight, offsetX, offsetY, offsetZ, mazeWidth, mazeDepth, addUniqueWall);

    // Create wall meshes from unique walls
    uniqueWalls.forEach(({ position: [x, y, z], rotation, dimensions: [width, height, length] }) => {
      const wall = this.createWall(new THREE.Vector3(x, y, z), width, height, length, rotation);
      this.walls.push(wall);
      this.allPoints.push(wall);
    });
  }

  /**
   * Creates the outer walls of the maze
   */
  createOuterWalls(width, height, itemLength, itemWidth, itemHeight, offsetX, offsetY, offsetZ, mazeWidth, mazeDepth, addUniqueWall) {
    // North wall segments
    for (let x = 0; x < width; x++) {
      const worldX = x * itemLength + offsetX + itemLength / 2;
      addUniqueWall([worldX, offsetY, offsetZ], MATH.HALF_PI, [itemWidth, itemHeight, itemLength]);
    }

    // South wall segments
    for (let x = 0; x < width; x++) {
      const worldX = x * itemLength + offsetX + itemLength / 2;
      addUniqueWall([worldX, offsetY, offsetZ + mazeDepth], MATH.HALF_PI, [itemWidth, itemHeight, itemLength]);
    }

    // West wall segments
    for (let y = 0; y < height; y++) {
      const worldZ = y * itemLength + offsetZ + itemLength / 2;
      addUniqueWall([offsetX, offsetY, worldZ], 0, [itemWidth, itemHeight, itemLength]);
    }

    // East wall segments
    for (let y = 0; y < height; y++) {
      const worldZ = y * itemLength + offsetZ + itemLength / 2;
      addUniqueWall([offsetX + mazeWidth, offsetY, worldZ], 0, [itemWidth, itemHeight, itemLength]);
    }
  }

  /**
   * Gets the original color for a maze element
   * @param {THREE.Mesh} element - The element
   * @returns {number} Hex color value
   */
  getOriginalColor(element) {
    return COLORS.WALL;
  }

  /**
   * Validates maze generation parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result
   */
  validateInput(params) {
    const { itemLength, itemWidth, itemHeight, width, height } = params;

    if (itemLength <= 0 || itemLength > 20) {
      return { valid: false, error: 'Cell length must be between 0 and 20' };
    }

    if (itemWidth <= 0 || itemWidth > 10) {
      return { valid: false, error: 'Wall width must be between 0 and 10' };
    }

    if (itemHeight <= 0 || itemHeight > 20) {
      return { valid: false, error: 'Wall height must be between 0 and 20' };
    }

    if (width < 2 || width > 50) {
      return { valid: false, error: 'Grid width must be between 2 and 50' };
    }

    if (height < 2 || height > 50) {
      return { valid: false, error: 'Grid height must be between 2 and 50' };
    }

    return { valid: true, error: null };
  }
}