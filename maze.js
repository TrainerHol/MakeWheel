export class Maze {
  constructor(scene) {
    this.scene = scene;
    this.walls = [];
    this.allPoints = [];
    this.centerPoint = null;

    this.defaultLength = 4;
    this.defaultWidth = 1;
    this.defaultHeight = 6;
  }

  generateMaze(itemLength = this.defaultLength, itemWidth = this.defaultWidth, itemHeight = this.defaultHeight, maxWalls) {
    this.clearMaze();

    // Calculate grid size based on maxWalls
    // Each cell can have up to 2 walls (north and west), so divide by 2
    const baseSize = Math.floor(Math.sqrt(maxWalls / 2));
    const gridWidth = baseSize;
    const gridHeight = baseSize;

    console.log(`Grid size: ${gridWidth}x${gridHeight}`);

    // Initialize grid
    let grid = Array(gridHeight)
      .fill()
      .map(() =>
        Array(gridWidth)
          .fill()
          .map(() => ({
            visited: false,
            walls: {
              north: true,
              south: true,
              east: true,
              west: true,
            },
          }))
      );

    // Start from a random position
    const startX = Math.floor(Math.random() * gridWidth);
    const startY = Math.floor(Math.random() * gridHeight);

    // Generate maze using DFS with wall removal
    this.generatePath(grid, startX, startY);

    // Create entrance and exit on random sides
    const sides = ["north", "south", "east", "west"];
    const [entranceSide, exitSide] = this.getRandomDifferentSides(sides);

    const entrance = this.getRandomPositionOnSide(entranceSide, gridWidth, gridHeight);
    let exit;
    do {
      exit = this.getRandomPositionOnSide(exitSide, gridWidth, gridHeight);
    } while (this.arePositionsOpposite(entrance, exit, gridWidth, gridHeight));

    // Remove walls for entrance and exit
    if (entrance.side === "west") grid[entrance.y][entrance.x].walls.west = false;
    else if (entrance.side === "east") grid[entrance.y][entrance.x].walls.east = false;
    else if (entrance.side === "north") grid[entrance.y][entrance.x].walls.north = false;
    else if (entrance.side === "south") grid[entrance.y][entrance.x].walls.south = false;

    if (exit.side === "west") grid[exit.y][exit.x].walls.west = false;
    else if (exit.side === "east") grid[exit.y][exit.x].walls.east = false;
    else if (exit.side === "north") grid[exit.y][exit.x].walls.north = false;
    else if (exit.side === "south") grid[exit.y][exit.x].walls.south = false;

    // Connect entrance and exit to their neighbors
    this.connectCell(grid, entrance.x, entrance.y);
    this.connectCell(grid, exit.x, exit.y);

    // Convert grid to walls
    const walls = [];
    let wallCount = 0;

    // Calculate offsets to center the maze
    const mazeWidth = gridWidth * itemLength;
    const mazeDepth = gridHeight * itemLength;
    const offsetX = -mazeWidth / 2;
    const offsetZ = -mazeDepth / 2;
    const offsetY = itemHeight / 2;

    // Create walls based on grid
    for (let y = 0; y < gridHeight && wallCount < maxWalls; y++) {
      for (let x = 0; x < gridWidth && wallCount < maxWalls; x++) {
        const cell = grid[y][x];
        const worldX = x * itemLength + offsetX;
        const worldZ = y * itemLength + offsetZ;

        // Add walls only where needed
        if (cell.walls.north && wallCount < maxWalls) {
          walls.push({
            position: [worldX, offsetY, worldZ - itemLength / 2],
            rotation: Math.PI / 2,
            dimensions: [itemWidth, itemHeight, itemLength],
          });
          wallCount++;
        }

        if (cell.walls.west && wallCount < maxWalls) {
          walls.push({
            position: [worldX - itemLength / 2, offsetY, worldZ],
            rotation: 0,
            dimensions: [itemWidth, itemHeight, itemLength],
          });
          wallCount++;
        }

        // Add east wall only for last column
        if (x === gridWidth - 1 && cell.walls.east && wallCount < maxWalls) {
          walls.push({
            position: [worldX + itemLength / 2, offsetY, worldZ],
            rotation: 0,
            dimensions: [itemWidth, itemHeight, itemLength],
          });
          wallCount++;
        }

        // Add south wall only for last row
        if (y === gridHeight - 1 && cell.walls.south && wallCount < maxWalls) {
          walls.push({
            position: [worldX, offsetY, worldZ + itemLength / 2],
            rotation: Math.PI / 2,
            dimensions: [itemWidth, itemHeight, itemLength],
          });
          wallCount++;
        }
      }
    }

    console.log(`Generated ${wallCount} walls`);

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

    return this.allPoints;
  }

  generatePath(grid, x, y) {
    const directions = [
      [0, -1], // North
      [1, 0], // East
      [0, 1], // South
      [-1, 0], // West
    ];

    grid[y][x].visited = true;

    // Randomize directions
    directions.sort(() => Math.random() - 0.5);

    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;

      if (this.isValidCell(grid, newX, newY) && !grid[newY][newX].visited) {
        // Remove walls between current and next cell
        if (dx === 1) {
          grid[y][x].walls.east = false;
          grid[newY][newX].walls.west = false;
        } else if (dx === -1) {
          grid[y][x].walls.west = false;
          grid[newY][newX].walls.east = false;
        } else if (dy === 1) {
          grid[y][x].walls.south = false;
          grid[newY][newX].walls.north = false;
        } else if (dy === -1) {
          grid[y][x].walls.north = false;
          grid[newY][newX].walls.south = false;
        }

        this.generatePath(grid, newX, newY);
      }
    }
  }

  connectCell(grid, x, y) {
    if (!grid[y][x].visited) {
      const directions = [
        [0, -1], // North
        [1, 0], // East
        [0, 1], // South
        [-1, 0], // West
      ];

      for (const [dx, dy] of directions) {
        const newX = x + dx;
        const newY = y + dy;

        if (this.isValidCell(grid, newX, newY) && grid[newY][newX].visited) {
          // Connect to the first visited neighbor we find
          if (dx === 1) {
            grid[y][x].walls.east = false;
            grid[newY][newX].walls.west = false;
          } else if (dx === -1) {
            grid[y][x].walls.west = false;
            grid[newY][newX].walls.east = false;
          } else if (dy === 1) {
            grid[y][x].walls.south = false;
            grid[newY][newX].walls.north = false;
          } else if (dy === -1) {
            grid[y][x].walls.north = false;
            grid[newY][newX].walls.south = false;
          }
          grid[y][x].visited = true;
          break;
        }
      }
    }
  }

  isValidCell(grid, x, y) {
    return y >= 0 && y < grid.length && x >= 0 && x < grid[0].length;
  }

  createWall(position, width, height, length, rotation) {
    // Create main wall mesh
    const geometry = new THREE.BoxGeometry(width, height, length);
    const material = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      flatShading: true,
      shininess: 0,
      emissive: 0x330000, // Slight glow
      specular: 0x331111, // Slight highlight
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
    return sphere;
  }

  clearMaze() {
    this.walls.forEach((wall) => this.scene.remove(wall));
    this.allPoints.forEach((point) => this.scene.remove(point));
    this.walls = [];
    this.allPoints = [];
    if (this.centerPoint) {
      this.scene.remove(this.centerPoint);
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

  getRandomDifferentSides(sides) {
    const firstIndex = Math.floor(Math.random() * sides.length);
    const firstSide = sides[firstIndex];
    sides.splice(firstIndex, 1);
    const secondIndex = Math.floor(Math.random() * sides.length);
    const secondSide = sides[secondIndex];
    return [firstSide, secondSide];
  }

  getRandomPositionOnSide(side, width, height) {
    switch (side) {
      case "north":
        return { x: Math.floor(Math.random() * width), y: 0, side };
      case "south":
        return { x: Math.floor(Math.random() * width), y: height - 1, side };
      case "west":
        return { x: 0, y: Math.floor(Math.random() * height), side };
      case "east":
        return { x: width - 1, y: Math.floor(Math.random() * height), side };
    }
  }

  arePositionsOpposite(pos1, pos2, width, height) {
    // Prevent entrance and exit from being directly opposite
    if (pos1.side === "north" && pos2.side === "south" && pos1.x === pos2.x) return true;
    if (pos1.side === "south" && pos2.side === "north" && pos1.x === pos2.x) return true;
    if (pos1.side === "east" && pos2.side === "west" && pos1.y === pos2.y) return true;
    if (pos1.side === "west" && pos2.side === "east" && pos1.y === pos2.y) return true;
    return false;
  }
}
