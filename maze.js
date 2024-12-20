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

    // Create entrance on a random side
    const sides = ["north", "south", "east", "west"];
    const entranceSide = sides[Math.floor(Math.random() * sides.length)];
    const entrance = this.getRandomPositionOnSide(entranceSide, gridWidth, gridHeight);

    // Remove wall for entrance
    if (entrance.side === "west") grid[entrance.y][entrance.x].walls.west = false;
    else if (entrance.side === "east") grid[entrance.y][entrance.x].walls.east = false;
    else if (entrance.side === "north") grid[entrance.y][entrance.x].walls.north = false;
    else if (entrance.side === "south") grid[entrance.y][entrance.x].walls.south = false;

    // Connect entrance to the maze
    this.connectCell(grid, entrance.x, entrance.y);

    // Find the cell that creates the longest path from the entrance
    const { position: exit, distance } = this.findLongestPath(grid, entrance);
    console.log(`Found exit with path length: ${distance}`);

    // Remove wall for exit
    if (exit.side === "west") grid[exit.y][exit.x].walls.west = false;
    else if (exit.side === "east") grid[exit.y][exit.x].walls.east = false;
    else if (exit.side === "north") grid[exit.y][exit.x].walls.north = false;
    else if (exit.side === "south") grid[exit.y][exit.x].walls.south = false;

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

  findLongestPath(grid, entrance) {
    const distances = Array(grid.length)
      .fill()
      .map(() => Array(grid[0].length).fill(-1));
    const queue = [[entrance.x, entrance.y, 0]];
    let maxDistance = 0;
    let farthestCell = null;

    // BFS to find distances from entrance
    distances[entrance.y][entrance.x] = 0;
    while (queue.length > 0) {
      const [x, y, distance] = queue.shift();

      // Check all four directions
      const directions = [
        { dx: 0, dy: -1, wall: "north" },
        { dx: 1, dy: 0, wall: "east" },
        { dx: 0, dy: 1, wall: "south" },
        { dx: -1, dy: 0, wall: "west" },
      ];

      for (const { dx, dy, wall } of directions) {
        const newX = x + dx;
        const newY = y + dy;

        if (this.isValidCell(grid, newX, newY) && distances[newY][newX] === -1) {
          // Check if there's a path (no wall) between cells
          const canMove = (dx === 1 && !grid[y][x].walls.east) || (dx === -1 && !grid[y][x].walls.west) || (dy === 1 && !grid[y][x].walls.south) || (dy === -1 && !grid[y][x].walls.north);

          if (canMove) {
            distances[newY][newX] = distance + 1;
            queue.push([newX, newY, distance + 1]);

            // Check if this could be a valid exit position
            if (distance + 1 > maxDistance && this.isValidExitPosition(newX, newY, grid)) {
              maxDistance = distance + 1;
              farthestCell = { x: newX, y: newY };
            }
          }
        }
      }
    }

    // Determine which side the exit should be on
    const side = this.determineExitSide(farthestCell.x, farthestCell.y, grid);
    return {
      position: { ...farthestCell, side },
      distance: maxDistance,
    };
  }

  isValidExitPosition(x, y, grid) {
    // Position is valid if it's on the edge of the maze
    return x === 0 || x === grid[0].length - 1 || y === 0 || y === grid.length - 1;
  }

  determineExitSide(x, y, grid) {
    if (x === 0) return "west";
    if (x === grid[0].length - 1) return "east";
    if (y === 0) return "north";
    if (y === grid.length - 1) return "south";
    return "west"; // fallback, shouldn't happen
  }
}
