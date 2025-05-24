export class Maze3D {
  constructor(scene) {
    this.scene = scene;
    this.walls = [];
    this.floors = [];
    this.allPoints = [];
    this.centerPoint = null;
    this.grid = [];
    this.defaultLength = 4;
    this.defaultWidth = 1;
    this.defaultHeight = 6;
    this.defaultFloorLength = 4;
    this.defaultFloorWidth = 4;
  }

  generateMaze3D(itemLength = this.defaultLength, itemWidth = this.defaultWidth, itemHeight = this.defaultHeight, floorLength = this.defaultFloorLength, floorWidth = this.defaultFloorWidth, width, height = width, floors = 2) {
    this.clearMaze();

    // Initialize 3D grid with cells
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
            [-1, 0, 0], // West
            [1, 0, 0], // East
            [0, -1, 0], // North
            [0, 1, 0], // South
            [0, 0, -1], // Down
            [0, 0, 1], // Up
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

    // 3D Maze Generation using modified depth-first search
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

        // Create bidirectional connection using Sets
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

    // Ensure all cells are connected by checking for isolated cells
    this.ensureFullConnectivity(width, height, floors);

    // Create walls and floors based on connections
    const mazeWidth = width * itemLength;
    const mazeDepth = height * itemLength;
    const offsetX = -mazeWidth / 2;
    const offsetZ = -mazeDepth / 2;

    // Helper function to create a unique key for a wall/floor
    const getObjectKey = (position, rotation, type) => {
      return `${type}_${position[0].toFixed(4)},${position[1].toFixed(4)},${position[2].toFixed(4)},${rotation.toFixed(4)}`;
    };

    // Use Maps to store unique walls and floors
    const uniqueWalls = new Map();
    const uniqueFloors = new Map();

    const addUniqueWall = (position, rotation, dimensions) => {
      const key = getObjectKey(position, rotation, "wall");
      if (!uniqueWalls.has(key)) {
        uniqueWalls.set(key, { position, rotation, dimensions, type: "wall" });
      }
    };

    const addUniqueFloor = (position, rotation, dimensions) => {
      const key = getObjectKey(position, rotation, "floor");
      if (!uniqueFloors.has(key)) {
        uniqueFloors.set(key, { position, rotation, dimensions, type: "floor" });
      }
    };

    // Generate walls and floors for each floor level
    for (let floor = 0; floor < floors; floor++) {
      const floorY = floor * itemHeight;
      const offsetY = floorY + itemHeight / 2;

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
            addUniqueWall([worldX, offsetY, worldZ - itemLength / 2], Math.PI / 2, [itemWidth, itemHeight, itemLength]);
          }
          if (!hasEast && x < width - 1) {
            addUniqueWall([worldX + itemLength / 2, offsetY, worldZ], 0, [itemWidth, itemHeight, itemLength]);
          }
          if (!hasSouth && y < height - 1) {
            addUniqueWall([worldX, offsetY, worldZ + itemLength / 2], Math.PI / 2, [itemWidth, itemHeight, itemLength]);
          }
          if (!hasWest && x > 0) {
            addUniqueWall([worldX - itemLength / 2, offsetY, worldZ], 0, [itemWidth, itemHeight, itemLength]);
          }

          // Check vertical connections (floors/ceilings)
          if (floor < floors - 1) {
            const hasUp = cell.connections.has(this.grid[floor + 1]?.[y]?.[x]);
            if (!hasUp) {
              // Add floor piece between floors to block vertical movement
              // Use the same positioning logic as the next floor's walls
              const nextFloorY = (floor + 1) * itemHeight;
              const nextFloorOffsetY = nextFloorY + itemHeight / 2;
              addUniqueFloor([worldX, nextFloorOffsetY, worldZ], 0, [floorLength, 1, floorWidth]);
            }
          }
        }
      }
    }

    // Create outer walls for each floor
    for (let floor = 0; floor < floors; floor++) {
      const floorY = floor * itemHeight;
      const offsetY = floorY + itemHeight / 2;

      // North wall segments
      for (let x = 0; x < width; x++) {
        const worldX = x * itemLength + offsetX + itemLength / 2;
        addUniqueWall([worldX, offsetY, offsetZ], Math.PI / 2, [itemWidth, itemHeight, itemLength]);
      }

      // South wall segments
      for (let x = 0; x < width; x++) {
        const worldX = x * itemLength + offsetX + itemLength / 2;
        addUniqueWall([worldX, offsetY, offsetZ + mazeDepth], Math.PI / 2, [itemWidth, itemHeight, itemLength]);
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

    // Add center marker
    this.centerPoint = new THREE.Vector3(0, 0, 0);
    const centerSphere = this.createSphere(this.centerPoint, 0x00ff00);
    this.scene.add(centerSphere);

    // Deduplicate points at the end
    const uniquePoints = new Map();
    this.allPoints.forEach((point) => {
      const key = `${point.position.x.toFixed(4)},${point.position.y.toFixed(4)},${point.position.z.toFixed(4)}`;
      uniquePoints.set(key, point);
    });
    this.allPoints = Array.from(uniquePoints.values());

    // Update count display
    const wallCountSpan = document.getElementById("generated3DWallCount");
    if (wallCountSpan) {
      wallCountSpan.textContent = `Generated Walls: ${this.walls.length}, Floors: ${this.floors.length} (Total Points: ${this.allPoints.length})`;
    }

    return this.allPoints;
  }

  ensureFullConnectivity(width, height, floors) {
    // Check if all cells are visited and connected
    for (let floor = 0; floor < floors; floor++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cell = this.grid[floor][y][x];
          if (!cell.isVisited) {
            // Find the nearest visited cell and connect to it
            this.connectIsolatedCell(cell, width, height, floors);
          }
        }
      }
    }
  }

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

  isValidCell3D(grid, x, y, floor) {
    return floor >= 0 && floor < grid.length && y >= 0 && y < grid[0].length && x >= 0 && x < grid[0][0].length;
  }

  createWall(position, width, height, length, rotation) {
    const geometry = new THREE.BoxGeometry(width, height, length);
    const material = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      flatShading: true,
      shininess: 0,
      emissive: 0x330000,
      specular: 0x331111,
    });

    const wall = new THREE.Mesh(geometry, material);
    wall.position.copy(position);
    wall.rotation.y = rotation;
    wall.userData = { type: "wall" };

    // Create edges
    const edges = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 2,
    });
    const edgesMesh = new THREE.LineSegments(edges, edgesMaterial);
    wall.add(edgesMesh);

    this.scene.add(wall);
    return wall;
  }

  createFloor(position, length, height, width, rotation) {
    const geometry = new THREE.BoxGeometry(length, height, width);
    const material = new THREE.MeshPhongMaterial({
      color: 0x0066ff, // Blue color for floors
      flatShading: true,
      shininess: 0,
      emissive: 0x001133,
      specular: 0x113333,
    });

    const floor = new THREE.Mesh(geometry, material);
    floor.position.copy(position);
    floor.rotation.y = rotation;
    floor.userData = { type: "floor" };

    // Create edges
    const edges = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x000044,
      linewidth: 2,
    });
    const edgesMesh = new THREE.LineSegments(edges, edgesMaterial);
    floor.add(edgesMesh);

    this.scene.add(floor);
    return floor;
  }

  createSphere(position, color, size = 0.5) {
    const geometry = new THREE.SphereGeometry(size);
    const material = new THREE.MeshPhongMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    sphere.name = "centerSphere3D";
    return sphere;
  }

  clearMaze() {
    // Remove all walls and their children
    this.walls.forEach((wall) => {
      if (wall.children.length > 0) {
        wall.children.forEach((child) => wall.remove(child));
      }
      this.scene.remove(wall);
    });

    // Remove all floors and their children
    this.floors.forEach((floor) => {
      if (floor.children.length > 0) {
        floor.children.forEach((child) => floor.remove(child));
      }
      this.scene.remove(floor);
    });

    // Remove all points
    this.allPoints.forEach((point) => {
      if (point.children.length > 0) {
        point.children.forEach((child) => point.remove(child));
      }
      this.scene.remove(point);
    });

    // Clear arrays
    this.walls = [];
    this.floors = [];
    this.allPoints = [];

    // Remove center point if it exists
    if (this.centerPoint) {
      const centerSphere = this.scene.getObjectByName("centerSphere3D");
      if (centerSphere) {
        this.scene.remove(centerSphere);
      }
      this.centerPoint = null;
    }
  }

  highlightPoint(index) {
    if (this.allPoints[index]) {
      const point = this.allPoints[index];
      if (point.userData.type === "wall") {
        point.material.color.setHex(0xdb63ff);
      } else if (point.userData.type === "floor") {
        point.material.color.setHex(0x63dbff);
      }
    }
  }

  resetPointColor(index) {
    if (this.allPoints[index]) {
      const point = this.allPoints[index];
      if (point.userData.type === "wall") {
        point.material.color.setHex(0xff0000);
      } else if (point.userData.type === "floor") {
        point.material.color.setHex(0x0066ff);
      }
    }
  }
}
