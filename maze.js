export class Maze {
  constructor(scene) {
    this.scene = scene;
    this.walls = [];
    this.allPoints = [];
    this.centerPoint = null;
    this.grid = [];
    this.defaultLength = 4;
    this.defaultWidth = 1;
    this.defaultHeight = 6;
  }

  generateMaze(itemLength = this.defaultLength, itemWidth = this.defaultWidth, itemHeight = this.defaultHeight, width, height = width) {
    this.clearMaze();

    // Initialize grid with cells
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
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
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

    // Origin Shift Algorithm
    const startCell = this.grid[0][0];
    startCell.isVisited = true;
    let currentCell = startCell;
    const stack = [startCell];

    while (stack.length > 0) {
      const unvisitedNeighbours = currentCell.neighbours.filter((n) => !n.isVisited);

      if (unvisitedNeighbours.length > 0) {
        // Choose a random unvisited neighbour
        const nextCell = unvisitedNeighbours[Math.floor(Math.random() * unvisitedNeighbours.length)];

        // Create bidirectional connection using Sets
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

    // Create walls based on connections
    const walls = [];
    const mazeWidth = width * itemLength;
    const mazeDepth = height * itemLength;
    const offsetX = -mazeWidth / 2;
    const offsetZ = -mazeDepth / 2;
    const offsetY = itemHeight / 2;

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
          walls.push({
            position: [worldX, offsetY, worldZ - itemLength / 2],
            rotation: Math.PI / 2,
            dimensions: [itemWidth, itemHeight, itemLength],
          });
        }
        if (!hasEast && x < width - 1) {
          walls.push({
            position: [worldX + itemLength / 2, offsetY, worldZ],
            rotation: 0,
            dimensions: [itemWidth, itemHeight, itemLength],
          });
        }
        if (!hasSouth && y < height - 1) {
          walls.push({
            position: [worldX, offsetY, worldZ + itemLength / 2],
            rotation: Math.PI / 2,
            dimensions: [itemWidth, itemHeight, itemLength],
          });
        }
        if (!hasWest && x > 0) {
          walls.push({
            position: [worldX - itemLength / 2, offsetY, worldZ],
            rotation: 0,
            dimensions: [itemWidth, itemHeight, itemLength],
          });
        }
      }
    }

    // Create outer walls as individual segments
    // North wall segments
    for (let x = 0; x < width; x++) {
      const worldX = x * itemLength + offsetX + itemLength / 2;
      walls.push({
        position: [worldX, offsetY, offsetZ],
        rotation: Math.PI / 2,
        dimensions: [itemWidth, itemHeight, itemLength],
      });
    }

    // South wall segments
    for (let x = 0; x < width; x++) {
      const worldX = x * itemLength + offsetX + itemLength / 2;
      walls.push({
        position: [worldX, offsetY, offsetZ + mazeDepth],
        rotation: Math.PI / 2,
        dimensions: [itemWidth, itemHeight, itemLength],
      });
    }

    // West wall segments
    for (let y = 0; y < height; y++) {
      const worldZ = y * itemLength + offsetZ + itemLength / 2;
      walls.push({
        position: [offsetX, offsetY, worldZ],
        rotation: 0,
        dimensions: [itemWidth, itemHeight, itemLength],
      });
    }

    // East wall segments
    for (let y = 0; y < height; y++) {
      const worldZ = y * itemLength + offsetZ + itemLength / 2;
      walls.push({
        position: [offsetX + mazeWidth, offsetY, worldZ],
        rotation: 0,
        dimensions: [itemWidth, itemHeight, itemLength],
      });
    }

    // Create wall meshes
    walls.forEach(({ position: [x, y, z], rotation, dimensions: [width, height, length] }) => {
      const wall = this.createWall(new THREE.Vector3(x, y, z), width, height, length, rotation);
      this.walls.push(wall);
      this.allPoints.push(wall);
    });

    // Add center marker
    this.centerPoint = new THREE.Vector3(0, 0, 0);
    const centerSphere = this.createSphere(this.centerPoint, 0x00ff00);
    this.scene.add(centerSphere);

    // Update wall count display
    const wallCountSpan = document.getElementById("generatedWallCount");
    if (wallCountSpan) {
      wallCountSpan.textContent = `Generated Walls: ${this.walls.length}`;
    }

    return this.allPoints;
  }

  isValidCell(grid, x, y) {
    return y >= 0 && y < grid.length && x >= 0 && x < grid[0].length;
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

  createSphere(position, color, size = 0.5) {
    const geometry = new THREE.SphereGeometry(size);
    const material = new THREE.MeshPhongMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    sphere.name = "centerSphere";
    return sphere;
  }

  clearMaze() {
    // Remove all walls and their children (like edges)
    this.walls.forEach((wall) => {
      if (wall.children.length > 0) {
        wall.children.forEach((child) => wall.remove(child));
      }
      this.scene.remove(wall);
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
    this.allPoints = [];

    // Remove center point if it exists
    if (this.centerPoint) {
      const centerSphere = this.scene.getObjectByName("centerSphere");
      if (centerSphere) {
        this.scene.remove(centerSphere);
      }
      this.centerPoint = null;
    }
  }

  highlightPoint(index) {
    if (this.allPoints[index]) {
      this.allPoints[index].material.color.setHex(0xdb63ff);
    }
  }

  resetPointColor(index) {
    if (this.allPoints[index]) {
      this.allPoints[index].material.color.setHex(0xff0000);
    }
  }
}
