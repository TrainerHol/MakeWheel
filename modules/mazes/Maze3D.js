import { BaseMaze } from '../base/BaseMaze.js';
import { COLORS, DEFAULTS, MATH } from '../utils/constants.js';

/**
 * Generates 3D mazes with multiple floors using depth-first search algorithm
 */
export class Maze3D extends BaseMaze {
  constructor(scene) {
    super(scene);
    this.floors = [];
    this.defaultLength = DEFAULTS.MAZE.CELL_LENGTH;
    this.defaultWidth = DEFAULTS.MAZE.WALL_WIDTH;
    this.defaultHeight = DEFAULTS.MAZE.WALL_HEIGHT;
    this.defaultFloorLength = DEFAULTS.MAZE_3D.FLOOR_LENGTH;
    this.defaultFloorWidth = DEFAULTS.MAZE_3D.FLOOR_WIDTH;
  }

  /**
   * Generates a 3D maze with multiple floors
   * @param {Object} params - Generation parameters
   * @returns {Array} Array of generated points
   */
  generate(params) {
    const {
      itemLength = this.defaultLength,
      itemWidth = this.defaultWidth,
      itemHeight = this.defaultHeight,
      floorLength = this.defaultFloorLength,
      floorWidth = this.defaultFloorWidth,
      width = DEFAULTS.MAZE_3D.GRID_WIDTH,
      height = width,
      floors = DEFAULTS.MAZE_3D.FLOORS
    } = params;

    this.clearMaze();

    // Initialize 3D grid
    this.initializeGrid3D(width, height, floors);

    // Generate maze using 3D depth-first search
    this.generateMazePaths3D(width, height, floors);

    // Ensure full connectivity
    this.ensureFullConnectivity(width, height, floors);

    // Create walls and floors
    this.createMazeElements(itemLength, itemWidth, itemHeight, floorLength, floorWidth, width, height, floors);

    // Add center marker
    this.centerPoint = new THREE.Vector3(0, 0, 0);
    const centerSphere = this.createSphere(this.centerPoint, COLORS.CENTER);
    this.scene.add(centerSphere);

    // Deduplicate elements
    this.deduplicateElements();

    return this.allPoints;
  }

  /**
   * Initializes the 3D grid with cells
   * @param {number} width - Grid width
   * @param {number} height - Grid height
   * @param {number} floors - Number of floors
   */
  initializeGrid3D(width, height, floors) {
    this.grid = Array(floors)
      .fill()
      .map((_, floor) =>
        Array(height)
          .fill()
          .map((_, y) =>
            Array(width)
              .fill()
              .map((_, x) => ({
                pos: { x, y, floor },
                connections: new Set(),
                neighbours: [],
                isVisited: false,
              }))
          )
      );

    // Setup neighbours for each cell (6 directions: N, S, E, W, Up, Down)
    for (let floor = 0; floor < floors; floor++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cell = this.grid[floor][y][x];
          const offsets = [
            [-1, 0, 0],  // West
            [1, 0, 0],   // East
            [0, -1, 0],  // North
            [0, 1, 0],   // South
            [0, 0, -1],  // Down
            [0, 0, 1],   // Up
          ];

          cell.neighbours = offsets
            .map(([dx, dy, dz]) => {
              const newX = x + dx;
              const newY = y + dy;
              const newFloor = floor + dz;
              return this.isValidCell3D(this.grid, newX, newY, newFloor) ? this.grid[newFloor][newY][newX] : null;
            })
            .filter((n) => n !== null);
        }
      }
    }
  }

  /**
   * Generates maze paths using 3D depth-first search
   * @param {number} width - Grid width
   * @param {number} height - Grid height
   * @param {number} floors - Number of floors
   */
  generateMazePaths3D(width, height, floors) {
    const startCell = this.grid[0][0][0];
    startCell.isVisited = true;
    let currentCell = startCell;
    const stack = [startCell];
    let visitedCount = 1;
    const totalCells = width * height * floors;

    while (stack.length > 0 && visitedCount < totalCells) {
      const unvisitedNeighbours = currentCell.neighbours.filter((n) => !n.isVisited);

      if (unvisitedNeighbours.length > 0) {
        // Choose a random unvisited neighbour
        const nextCell = unvisitedNeighbours[Math.floor(Math.random() * unvisitedNeighbours.length)];

        // Create bidirectional connection
        currentCell.connections.add(nextCell);
        nextCell.connections.add(currentCell);

        // Mark as visited and move to next cell
        nextCell.isVisited = true;
        visitedCount++;
        stack.push(nextCell);
        currentCell = nextCell;
      } else {
        // Backtrack
        currentCell = stack.pop();
      }
    }
  }

  /**
   * Ensures all cells are connected in the maze
   * @param {number} width - Grid width
   * @param {number} height - Grid height
   * @param {number} floors - Number of floors
   */
  ensureFullConnectivity(width, height, floors) {
    for (let floor = 0; floor < floors; floor++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cell = this.grid[floor][y][x];
          if (!cell.isVisited) {
            this.connectIsolatedCell(cell, width, height, floors);
          }
        }
      }
    }
  }

  /**
   * Connects an isolated cell to the nearest visited cell
   * @param {Object} isolatedCell - The isolated cell
   * @param {number} width - Grid width
   * @param {number} height - Grid height
   * @param {number} floors - Number of floors
   */
  connectIsolatedCell(isolatedCell, width, height, floors) {
    const { x, y, floor } = isolatedCell.pos;
    let minDistance = Infinity;
    let nearestCell = null;

    // Find the nearest visited cell
    for (let f = 0; f < floors; f++) {
      for (let h = 0; h < height; h++) {
        for (let w = 0; w < width; w++) {
          const cell = this.grid[f][h][w];
          if (cell.isVisited) {
            const distance = Math.abs(x - w) + Math.abs(y - h) + Math.abs(floor - f);
            if (distance < minDistance) {
              minDistance = distance;
              nearestCell = cell;
            }
          }
        }
      }
    }

    // Connect to the nearest cell
    if (nearestCell) {
      isolatedCell.connections.add(nearestCell);
      nearestCell.connections.add(isolatedCell);
      isolatedCell.isVisited = true;
    }
  }

  /**
   * Creates walls and floors for the maze
   */
  createMazeElements(itemLength, itemWidth, itemHeight, floorLength, floorWidth, width, height, floors) {
    const mazeWidth = width * itemLength;
    const mazeDepth = height * itemLength;
    const offsetX = -mazeWidth / 2;
    const offsetZ = -mazeDepth / 2;

    // Use Maps to store unique walls and floors
    const uniqueWalls = new Map();
    const uniqueFloors = new Map();

    const addUniqueWall = (position, rotation, dimensions) => {
      const key = this.getElementKey(position, rotation, 'wall');
      if (!uniqueWalls.has(key)) {
        uniqueWalls.set(key, { position, rotation, dimensions, type: 'wall' });
      }
    };

    const addUniqueFloor = (position, rotation, dimensions) => {
      const key = this.getElementKey(position, rotation, 'floor');
      if (!uniqueFloors.has(key)) {
        uniqueFloors.set(key, { position, rotation, dimensions, type: 'floor' });
      }
    };

    // Generate walls and floors for each floor level
    for (let floor = 0; floor < floors; floor++) {
      const floorY = floor * itemHeight;
      const offsetY = floorY + itemHeight / 2;

      // Create internal walls
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cell = this.grid[floor][y][x];
          const worldX = x * itemLength + offsetX + itemLength / 2;
          const worldZ = y * itemLength + offsetZ + itemLength / 2;

          // Check horizontal connections (walls)
          const hasNorth = cell.connections.has(this.grid[floor][y - 1]?.[x]);
          const hasEast = cell.connections.has(this.grid[floor][y]?.[x + 1]);
          const hasSouth = cell.connections.has(this.grid[floor][y + 1]?.[x]);
          const hasWest = cell.connections.has(this.grid[floor][y]?.[x - 1]);

          // Add walls where there are no horizontal connections
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

          // Check vertical connections (floors/ceilings)
          if (floor < floors - 1) {
            const hasUp = cell.connections.has(this.grid[floor + 1]?.[y]?.[x]);
            if (!hasUp) {
              // Add floor piece between floors
              const nextFloorY = (floor + 1) * itemHeight;
              const nextFloorOffsetY = nextFloorY + itemHeight / 2;
              addUniqueFloor([worldX, nextFloorOffsetY, worldZ], 0, [floorLength, 1, floorWidth]);
            }
          }
        }
      }

      // Create outer walls for this floor
      this.createOuterWalls3D(width, height, itemLength, itemWidth, itemHeight, offsetX, offsetY, offsetZ, mazeWidth, mazeDepth, addUniqueWall);
    }

    // Create wall meshes from unique walls
    uniqueWalls.forEach(({ position: [x, y, z], rotation, dimensions: [width, height, length] }) => {
      const wall = this.createWall(new THREE.Vector3(x, y, z), width, height, length, rotation);
      this.walls.push(wall);
      this.allPoints.push(wall);
    });

    // Create floor meshes from unique floors
    uniqueFloors.forEach(({ position: [x, y, z], rotation, dimensions: [length, height, width] }) => {
      const floor = this.createFloor(new THREE.Vector3(x, y, z), length, height, width, rotation);
      this.floors.push(floor);
      this.allPoints.push(floor);
    });
  }

  /**
   * Creates outer walls for a floor
   */
  createOuterWalls3D(width, height, itemLength, itemWidth, itemHeight, offsetX, offsetY, offsetZ, mazeWidth, mazeDepth, addUniqueWall) {
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
   * Creates a floor piece
   * @param {THREE.Vector3} position - Floor position
   * @param {number} length - Floor length
   * @param {number} height - Floor thickness
   * @param {number} width - Floor width
   * @param {number} rotation - Y-axis rotation
   * @returns {THREE.Mesh} The created floor mesh
   */
  createFloor(position, length, height, width, rotation) {
    const colors = {
      main: COLORS.FLOOR,
      emissive: COLORS.FLOOR_EMISSIVE,
      specular: COLORS.FLOOR_SPECULAR,
      edge: COLORS.FLOOR_EDGE
    };

    const geometry = new THREE.BoxGeometry(length, height, width);
    const material = new THREE.MeshPhongMaterial({
      color: colors.main,
      flatShading: true,
      shininess: 0,
      emissive: colors.emissive,
      specular: colors.specular,
    });

    const floor = new THREE.Mesh(geometry, material);
    floor.position.copy(position);
    floor.rotation.y = rotation;
    floor.userData = { type: 'floor' };

    // Create edges
    const edges = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: colors.edge,
      linewidth: 2,
    });
    const edgesMesh = new THREE.LineSegments(edges, edgesMaterial);
    floor.add(edgesMesh);

    this.scene.add(floor);
    return floor;
  }

  /**
   * Clears 3D maze-specific elements
   */
  clearMaze() {
    // Clear floors array
    this.floors.forEach((floor) => {
      if (floor.children.length > 0) {
        floor.children.forEach((child) => floor.remove(child));
      }
      this.scene.remove(floor);
    });
    this.floors = [];

    // Call parent clear method
    super.clearMaze();
  }

  /**
   * Gets the name for the center sphere
   * @returns {string} Center sphere name
   */
  getCenterSphereName() {
    return 'centerSphere3D';
  }

  /**
   * Gets the highlight color for a maze element
   * @param {THREE.Mesh} element - The element
   * @returns {number} Hex color value
   */
  getHighlightColor(element) {
    if (element.userData.type === 'floor') {
      return 0x63dbff; // Light blue for floors
    }
    return COLORS.HIGHLIGHT;
  }

  /**
   * Gets the original color for a maze element
   * @param {THREE.Mesh} element - The element
   * @returns {number} Hex color value
   */
  getOriginalColor(element) {
    if (element.userData.type === 'floor') {
      return COLORS.FLOOR;
    }
    return COLORS.WALL;
  }

  /**
   * Validates if a 3D cell position is within bounds
   * @param {Array} grid - The 3D grid
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} floor - Floor level
   * @returns {boolean} True if valid
   */
  isValidCell3D(grid, x, y, floor) {
    return floor >= 0 && floor < grid.length && 
           y >= 0 && y < grid[0].length && 
           x >= 0 && x < grid[0][0].length;
  }

  /**
   * Validates 3D maze generation parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result
   */
  validateInput(params) {
    const { itemLength, itemWidth, itemHeight, floorLength, floorWidth, width, height, floors } = params;

    if (itemLength <= 0 || itemLength > 20) {
      return { valid: false, error: 'Cell length must be between 0 and 20' };
    }

    if (itemWidth <= 0 || itemWidth > 10) {
      return { valid: false, error: 'Wall width must be between 0 and 10' };
    }

    if (itemHeight <= 0 || itemHeight > 20) {
      return { valid: false, error: 'Wall height must be between 0 and 20' };
    }

    if (floorLength <= 0 || floorLength > 20) {
      return { valid: false, error: 'Floor length must be between 0 and 20' };
    }

    if (floorWidth <= 0 || floorWidth > 20) {
      return { valid: false, error: 'Floor width must be between 0 and 20' };
    }

    if (width < 2 || width > 20) {
      return { valid: false, error: 'Grid width must be between 2 and 20' };
    }

    if (height < 2 || height > 20) {
      return { valid: false, error: 'Grid height must be between 2 and 20' };
    }

    if (floors < 2 || floors > DEFAULTS.MAZE_3D.MAX_FLOORS) {
      return { valid: false, error: `Floors must be between 2 and ${DEFAULTS.MAZE_3D.MAX_FLOORS}` };
    }

    return { valid: true, error: null };
  }

  /**
   * Gets the number of floors
   * @returns {number} Floor count
   */
  getFloorCount() {
    return this.floors.length;
  }
}