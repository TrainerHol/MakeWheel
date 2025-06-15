import { BaseShape } from '../base/BaseShape.js';
import { COLORS, DEFAULTS } from '../utils/constants.js';

/**
 * Room generator with interactive drawing grid
 * Allows user to draw room layouts and generates optimized floors and walls
 */
export class Room extends BaseShape {
  constructor(scene, camera = null) {
    super(scene);
    this.shapeType = 'room';
    this.camera = camera;
    
    // Room-specific properties
    this.gridSize = 10; // Grid size in units
    this.gridDivisions = 20; // Number of grid divisions
    this.drawingGrid = null;
    this.selectedCells = new Set(); // Track selected cells
    this.isDrawingMode = false;
    this.floorOptimizationSize = { width: 8, length: 4 }; // Default floor tile size
    
    // Raycaster for mouse interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Store hidden objects during drawing mode
    this.hiddenObjects = [];
    
    // Drawing grid visual elements
    this.gridCells = [];
    this.selectedCellMeshes = [];
    
    // Mouse event handlers (initialized as null)
    this.boundMouseClick = null;
    this.boundMouseMove = null;
    
    // Generated elements
    this.walls = [];
    this.floors = [];
    
    // Default parameters
    this.defaultWallLength = DEFAULTS.ROOM.WALL_LENGTH;
    this.defaultWallWidth = DEFAULTS.ROOM.WALL_WIDTH;
    this.defaultWallHeight = DEFAULTS.ROOM.WALL_HEIGHT;
    this.defaultFloorLength = DEFAULTS.ROOM.FLOOR_LENGTH;
    this.defaultFloorWidth = DEFAULTS.ROOM.FLOOR_WIDTH;
  }

  /**
   * Validates input parameters for room generation
   */
  validateInput(params) {
    const {
      wallLength = this.defaultWallLength,
      wallWidth = this.defaultWallWidth,
      wallHeight = this.defaultWallHeight,
      floorLength = this.defaultFloorLength,
      floorWidth = this.defaultFloorWidth
    } = params;

    if (wallLength < 1 || wallLength > 20) {
      return { valid: false, error: "Wall length must be between 1 and 20" };
    }
    if (wallWidth < 1 || wallWidth > 10) {
      return { valid: false, error: "Wall width must be between 1 and 10" };
    }
    if (wallHeight < 1 || wallHeight > 20) {
      return { valid: false, error: "Wall height must be between 1 and 20" };
    }
    if (floorLength < 1 || floorLength > 20) {
      return { valid: false, error: "Floor length must be between 1 and 20" };
    }
    if (floorWidth < 1 || floorWidth > 20) {
      return { valid: false, error: "Floor width must be between 1 and 20" };
    }

    return { valid: true, error: null };
  }

  /**
   * Creates the interactive drawing grid
   */
  createDrawingGrid(wallLength) {
    console.log('🟢 createDrawingGrid() called with wallLength:', wallLength);
    
    try {
      // Clean up any existing drawing grid
      if (this.drawingGrid) {
        console.log('🟢 Cleaning up existing drawing grid...');
        this.clearSelectedCellMeshes();
        this.scene.remove(this.drawingGrid);
        this.drawingGrid = null;
      }

      console.log('🟢 Creating new drawing grid...');
      this.drawingGrid = new THREE.Group();
      this.gridCells = [];
      
      // Calculate grid parameters based on wall length
      this.gridSize = wallLength * this.gridDivisions;
      const cellSize = wallLength;
      const halfGrid = this.gridSize / 2;
      
      console.log('🟢 Grid parameters: gridSize=', this.gridSize, 'cellSize=', cellSize, 'gridDivisions=', this.gridDivisions);
      
      // Create individual grid cells for interaction
      let cellCount = 0;
      for (let x = 0; x < this.gridDivisions; x++) {
        this.gridCells[x] = [];
        for (let z = 0; z < this.gridDivisions; z++) {
          const cellGeometry = new THREE.PlaneGeometry(cellSize, cellSize);
          const cellMaterial = new THREE.MeshBasicMaterial({ 
            color: COLORS.GRID_CELL,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
          });
          
          const cell = new THREE.Mesh(cellGeometry, cellMaterial);
          cell.rotation.x = -Math.PI / 2; // Lay flat on ground
          cell.position.set(
            (x * cellSize) - halfGrid + (cellSize / 2),
            0.01, // Slightly above ground
            (z * cellSize) - halfGrid + (cellSize / 2)
          );
          
          // Store grid coordinates for later use
          cell.userData = { gridX: x, gridZ: z };
          
          this.drawingGrid.add(cell);
          this.gridCells[x][z] = cell;
          cellCount++;
        }
      }
      
      console.log('🟢 Created', cellCount, 'grid cells');
      
      // Create grid lines for visual reference
      console.log('🟢 Creating grid helper...');
      const gridHelper = new THREE.GridHelper(this.gridSize, this.gridDivisions, COLORS.GRID_LINE, COLORS.GRID_LINE);
      this.drawingGrid.add(gridHelper);
      
      console.log('🟢 Adding drawing grid to scene...');
      this.scene.add(this.drawingGrid);
      
      console.log('🟢 Drawing grid children count:', this.drawingGrid.children.length);
      console.log('🟢 createDrawingGrid() completed successfully');
    } catch (error) {
      console.log('❌ Error in createDrawingGrid():', error);
      throw error;
    }
  }

  /**
   * Enters drawing mode - hides existing objects and shows drawing grid
   */
  enterDrawingMode(wallLength) {
    console.log('🟢 Room.enterDrawingMode() called with wallLength:', wallLength);
    
    try {
      console.log('🟢 Setting isDrawingMode = true');
      this.isDrawingMode = true;
      
      // Hide all existing objects except the drawing grid and keep track of what to restore
      console.log('🟢 Hiding existing objects...');
      this.hiddenObjects = [];
      let hiddenCount = 0;
      this.scene.traverse((object) => {
        if (object !== this.drawingGrid && object.visible) {
          // Hide all objects but track their type for proper restoration
          if (object.type === 'Mesh' || object.type === 'Line' || object.type === 'Group' || object.type === 'GridHelper') {
            this.hiddenObjects.push({
              object: object,
              wasVisible: object.visible
            });
            object.visible = false;
            hiddenCount++;
          }
        }
      });
      console.log('🟢 Hidden', hiddenCount, 'objects');
      
      // Create and show drawing grid
      console.log('🟢 Creating drawing grid...');
      this.createDrawingGrid(wallLength);
      console.log('🟢 Drawing grid created');
      
      // Restore any previously selected cells
      console.log('🟢 Restoring selected cells...');
      this.restoreSelectedCells();
      console.log('🟢 Selected cells restored');
      
      // Add mouse event listeners
      console.log('🟢 Adding mouse listeners...');
      this.addMouseListeners();
      console.log('🟢 Mouse listeners added');
      
      // Update button text to match state
      console.log('🟢 Updating button text...');
      this.updateButtonText();
      console.log('🟢 Button text updated');
      
      console.log('🟢 Room.enterDrawingMode() completed successfully');
    } catch (error) {
      console.log('❌ Error in Room.enterDrawingMode():', error);
      throw error;
    }
  }

  /**
   * Exits drawing mode - shows hidden objects and hides drawing grid
   */
  exitDrawingMode() {
    console.log('🔴 Room.exitDrawingMode() called');
    console.log('🔴 Current isDrawingMode:', this.isDrawingMode);
    console.log('🔴 Selected cells count:', this.selectedCells.size);
    
    try {
      // CRITICAL: Remove mouse listeners FIRST to prevent interference
      console.log('🔴 Removing mouse listeners...');
      this.removeMouseListeners();
      
      // CRITICAL: Set state immediately
      console.log('🔴 Setting isDrawingMode = false');
      this.isDrawingMode = false;
      
      // CRITICAL: Force complete drawing grid cleanup
      console.log('🔴 Force removing drawing grid...');
      this.forceRemoveDrawingGrid();
      
      // Restore hidden objects
      console.log('🔴 Restoring', this.hiddenObjects.length, 'hidden objects...');
      let restoredCount = 0;
      this.hiddenObjects.forEach(item => {
        if (item.object && item.wasVisible) {
          item.object.visible = true;
          restoredCount++;
        }
      });
      console.log('🔴 Restored', restoredCount, 'objects');
      this.hiddenObjects = [];
      
      // Force normal grid to be visible
      console.log('🔴 Force restoring normal grid...');
      this.forceRestoreNormalGrid();
      
      // Update button text
      console.log('🔴 Updating button text...');
      this.updateButtonText();
      
      // Auto-generate if we have selected cells
      if (this.selectedCells.size > 0) {
        console.log('🔴 Auto-generating with', this.selectedCells.size, 'selected cells');
        try {
          const params = this.getGenerationParameters();
          console.log('🔴 Generation parameters:', params);
          this.generate(params);
          
          // Update the count display
          const wallCount = this.walls ? this.walls.length : 0;
          const floorCount = this.floors ? this.floors.length : 0;
          console.log('🔴 Generated walls:', wallCount, 'floors:', floorCount);
          const countElement = document.getElementById('generatedRoomCount');
          if (countElement) {
            countElement.textContent = `Generated Points: ${this.allPoints.length} (Walls: ${wallCount}, Floors: ${floorCount})`;
            countElement.style.fontWeight = 'bold';
            countElement.style.color = '#2196F3';
            countElement.style.marginTop = '10px';
          }
        } catch (error) {
          console.error('❌ Auto-generation failed:', error.message);
          alert(`Auto-generation failed: ${error.message}`);
        }
      } else {
        console.log('🔴 No selected cells, skipping auto-generation');
      }
      
      console.log('🔴 Room.exitDrawingMode() completed successfully');
    } catch (error) {
      console.error('❌ Error in Room.exitDrawingMode():', error);
      alert(`Error exiting drawing mode: ${error.message}`);
    }
  }

  /**
   * Forces complete removal of drawing grid with thorough cleanup
   */
  forceRemoveDrawingGrid() {
    console.log('🔴 forceRemoveDrawingGrid() called');
    
    try {
      // Clear selected cell meshes first
      console.log('🔴 Clearing selected cell meshes...');
      this.clearSelectedCellMeshes();
      
      if (this.drawingGrid) {
        console.log('🔴 Drawing grid exists, children count:', this.drawingGrid.children.length);
        
        // Dispose of all geometries and materials in the drawing grid
        console.log('🔴 Disposing geometries and materials...');
        let disposedCount = 0;
        this.drawingGrid.traverse((child) => {
          if (child.geometry) {
            child.geometry.dispose();
            disposedCount++;
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        console.log('🔴 Disposed', disposedCount, 'geometries/materials');
        
        // Remove all children
        console.log('🔴 Removing all children...');
        while (this.drawingGrid.children.length > 0) {
          const child = this.drawingGrid.children[0];
          this.drawingGrid.remove(child);
        }
        console.log('🔴 All children removed, remaining:', this.drawingGrid.children.length);
        
        // Remove from scene
        console.log('🔴 Removing drawing grid from scene...');
        this.scene.remove(this.drawingGrid);
        this.drawingGrid = null;
        console.log('🔴 Drawing grid set to null');
      } else {
        console.log('🔴 No drawing grid to remove');
      }
      
      // Clear all drawing-related arrays
      console.log('🔴 Clearing arrays...');
      this.gridCells = [];
      this.selectedCellMeshes = [];
      
      console.log('🔴 forceRemoveDrawingGrid() completed');
    } catch (error) {
      console.log('❌ Error in forceRemoveDrawingGrid():', error);
      throw error;
    }
  }

  /**
   * Forces normal grid to be visible
   */
  forceRestoreNormalGrid() {
    console.log('🔴 forceRestoreNormalGrid() called');
    
    try {
      // Ensure the main planeVisualization is visible
      const planeViz = this.scene.getObjectByName('planeVisualization');
      if (planeViz) {
        planeViz.visible = true;
        console.log('🔴 PlaneVisualization restored, visible:', planeViz.visible);
      } else {
        console.log('❌ PlaneVisualization not found');
      }
      
      // Make sure all normal GridHelper objects are visible
      let gridHelperCount = 0;
      this.scene.traverse((object) => {
        if (object.type === 'GridHelper') {
          object.visible = true;
          gridHelperCount++;
          console.log('🔴 GridHelper restored, visible:', object.visible);
        }
      });
      console.log('🔴 Total GridHelpers restored:', gridHelperCount);
      
      console.log('🔴 forceRestoreNormalGrid() completed');
    } catch (error) {
      console.log('❌ Error in forceRestoreNormalGrid():', error);
      throw error;
    }
  }

  /**
   * Adds mouse event listeners for grid interaction
   */
  addMouseListeners() {
    console.log('🔴 addMouseListeners() called');
    
    // Remove any existing listeners first
    this.removeMouseListeners();
    
    // Create new bound functions
    this.boundMouseClick = (event) => this.onMouseClick(event);
    this.boundMouseMove = (event) => this.onMouseMove(event);
    
    console.log('🔴 Adding event listeners to window...');
    window.addEventListener('click', this.boundMouseClick);
    window.addEventListener('mousemove', this.boundMouseMove);
    console.log('🔴 Mouse listeners added successfully');
  }

  /**
   * Removes mouse event listeners
   */
  removeMouseListeners() {
    console.log('🔴 removeMouseListeners() called');
    
    if (this.boundMouseClick) {
      console.log('🔴 Removing click listener');
      window.removeEventListener('click', this.boundMouseClick);
      this.boundMouseClick = null;
    }
    if (this.boundMouseMove) {
      console.log('🔴 Removing move listener');
      window.removeEventListener('mousemove', this.boundMouseMove);
      this.boundMouseMove = null;
    }
    console.log('🔴 Mouse listeners removed');
  }

  /**
   * Handles mouse clicks on the drawing grid
   */
  onMouseClick(event) {
    if (!this.isDrawingMode || !this.camera) return;
    
    this.updateMousePosition(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersects = this.raycaster.intersectObjects(this.gridCells.flat());
    if (intersects.length > 0) {
      const clickedCell = intersects[0].object;
      const cellKey = `${clickedCell.userData.gridX},${clickedCell.userData.gridZ}`;
      
      if (this.selectedCells.has(cellKey)) {
        // Deselect cell
        this.selectedCells.delete(cellKey);
        this.removeSelectedCellVisual(clickedCell);
      } else {
        // Select cell
        this.selectedCells.add(cellKey);
        this.addSelectedCellVisual(clickedCell);
      }
    }
  }

  /**
   * Handles mouse movement for hover effects
   */
  onMouseMove(event) {
    if (!this.isDrawingMode || !this.camera) return;
    
    this.updateMousePosition(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersects = this.raycaster.intersectObjects(this.gridCells.flat());
    
    // Reset all cells to default opacity
    this.gridCells.flat().forEach(cell => {
      const cellKey = `${cell.userData.gridX},${cell.userData.gridZ}`;
      if (!this.selectedCells.has(cellKey)) {
        cell.material.opacity = 0.1;
      }
    });
    
    // Highlight hovered cell
    if (intersects.length > 0) {
      const hoveredCell = intersects[0].object;
      const cellKey = `${hoveredCell.userData.gridX},${hoveredCell.userData.gridZ}`;
      if (!this.selectedCells.has(cellKey)) {
        hoveredCell.material.opacity = 0.3;
      }
    }
  }

  /**
   * Updates mouse position for raycasting
   */
  updateMousePosition(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  /**
   * Adds visual indication for selected cell
   */
  addSelectedCellVisual(cell) {
    const geometry = new THREE.PlaneGeometry(
      cell.geometry.parameters.width * 0.9,
      cell.geometry.parameters.height * 0.9
    );
    const material = new THREE.MeshBasicMaterial({ 
      color: COLORS.SELECTED_CELL,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const selectedMesh = new THREE.Mesh(geometry, material);
    selectedMesh.rotation.x = -Math.PI / 2;
    selectedMesh.position.copy(cell.position);
    selectedMesh.position.y += 0.01; // Slightly above cell
    
    this.drawingGrid.add(selectedMesh);
    this.selectedCellMeshes.push(selectedMesh);
  }

  /**
   * Removes visual indication for deselected cell
   */
  removeSelectedCellVisual(cell) {
    const cellPosition = cell.position;
    const meshToRemove = this.selectedCellMeshes.find(mesh => 
      Math.abs(mesh.position.x - cellPosition.x) < 0.1 &&
      Math.abs(mesh.position.z - cellPosition.z) < 0.1
    );
    
    if (meshToRemove) {
      this.drawingGrid.remove(meshToRemove);
      this.selectedCellMeshes = this.selectedCellMeshes.filter(mesh => mesh !== meshToRemove);
    }
  }

  /**
   * Clears all selected cell visual indicators
   */
  clearSelectedCellMeshes() {
    this.selectedCellMeshes.forEach(mesh => {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
    });
    this.selectedCellMeshes = [];
  }

  /**
   * Restores visual indicators for previously selected cells
   */
  restoreSelectedCells() {
    if (!this.drawingGrid || !this.gridCells.length) return;
    
    this.selectedCells.forEach(cellKey => {
      const [x, z] = cellKey.split(',').map(Number);
      if (this.gridCells[x] && this.gridCells[x][z]) {
        this.addSelectedCellVisual(this.gridCells[x][z]);
      }
    });
  }

  /**
   * Gets generation parameters from UI inputs
   */
  getGenerationParameters() {
    return {
      wallLength: parseInt(document.getElementById("roomWallLength").value) || this.defaultWallLength,
      wallWidth: parseInt(document.getElementById("roomWallWidth").value) || this.defaultWallWidth,
      wallHeight: parseInt(document.getElementById("roomWallHeight").value) || this.defaultWallHeight,
      floorLength: parseInt(document.getElementById("roomFloorLength").value) || this.defaultFloorLength,
      floorWidth: parseInt(document.getElementById("roomFloorWidth").value) || this.defaultFloorWidth
    };
  }

  /**
   * Generates rooms from selected cells
   */
  generate(params) {
    const validation = this.validateInput(params);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    if (this.selectedCells.size === 0) {
      throw new Error("No cells selected. Please enter drawing mode and select cells first.");
    }

    const {
      wallLength = this.defaultWallLength,
      wallWidth = this.defaultWallWidth,
      wallHeight = this.defaultWallHeight,
      floorLength = this.defaultFloorLength,
      floorWidth = this.defaultFloorWidth
    } = params;

    this.clearPoints();
    this.clearGeneratedElements();

    // Convert selected cells to room layout
    const roomLayout = this.convertSelectedCellsToLayout();
    
    // Find all disconnected islands
    const islands = this.findDisconnectedIslands(roomLayout);
    
    // Process each island separately
    islands.forEach(island => {
      // Generate optimized floors for this island
      this.generateOptimizedFloors(island, floorLength, floorWidth, wallLength);
      
      // Generate perimeter walls around this island
      this.generatePerimeterWalls(island, wallLength, wallWidth, wallHeight);
    });
    
    // Create center point
    this.centerPoint = this.createSphere(new THREE.Vector3(0, 0, 0), COLORS.CENTER_POINT);
    
    return this.allPoints;
  }

  /**
   * Converts selected grid cells to a room layout structure
   */
  convertSelectedCellsToLayout() {
    const layout = [];
    this.selectedCells.forEach(cellKey => {
      const [x, z] = cellKey.split(',').map(Number);
      layout.push({ x, z });
    });
    return layout;
  }

  /**
   * Finds all disconnected islands/regions in the selected cells
   * Uses flood fill algorithm to identify separate regions
   */
  findDisconnectedIslands(roomLayout) {
    const grid = new Set(roomLayout.map(cell => `${cell.x},${cell.z}`));
    const visited = new Set();
    const islands = [];
    
    roomLayout.forEach(cell => {
      const cellKey = `${cell.x},${cell.z}`;
      if (!visited.has(cellKey)) {
        // Start a new island
        const island = [];
        const queue = [cell];
        
        // Flood fill to find all connected cells
        while (queue.length > 0) {
          const current = queue.shift();
          const currentKey = `${current.x},${current.z}`;
          
          if (visited.has(currentKey)) continue;
          
          visited.add(currentKey);
          island.push(current);
          
          // Check all 4 neighbors
          const neighbors = [
            { x: current.x + 1, z: current.z },
            { x: current.x - 1, z: current.z },
            { x: current.x, z: current.z + 1 },
            { x: current.x, z: current.z - 1 }
          ];
          
          neighbors.forEach(neighbor => {
            const neighborKey = `${neighbor.x},${neighbor.z}`;
            if (grid.has(neighborKey) && !visited.has(neighborKey)) {
              queue.push(neighbor);
            }
          });
        }
        
        islands.push(island);
      }
    });
    
    return islands;
  }

  /**
   * Generates optimized floor tiles using actual floor pieces
   */
  generateOptimizedFloors(roomLayout, floorLength, floorWidth, wallLength) {
    // For each selected cell, determine how many floor pieces we need
    roomLayout.forEach(cell => {
      const { x, z } = cell;
      
      // Calculate the world position for this grid cell
      const cellWorldX = (x * wallLength) - (this.gridSize / 2) + (wallLength / 2);
      const cellWorldZ = (z * wallLength) - (this.gridSize / 2) + (wallLength / 2);
      
      // Determine how many floor pieces fit in this cell
      // wallLength is the size of one grid cell
      const piecesX = Math.ceil(wallLength / floorLength);
      const piecesZ = Math.ceil(wallLength / floorWidth);
      
      // Place floor pieces to cover this cell
      for (let px = 0; px < piecesX; px++) {
        for (let pz = 0; pz < piecesZ; pz++) {
          // Calculate position for this floor piece within the cell
          const offsetX = (px * floorLength) - (wallLength / 2) + (floorLength / 2);
          const offsetZ = (pz * floorWidth) - (wallLength / 2) + (floorWidth / 2);
          
          const floorX = cellWorldX + offsetX;
          const floorZ = cellWorldZ + offsetZ;
          
          // Create actual floor piece (not stretched)
          const floorMesh = this.createFloorMesh(
            new THREE.Vector3(floorX, 0, floorZ),
            floorLength,
            0.2, // Small height for floor
            floorWidth
          );
          
          this.floors.push(floorMesh);
        }
      }
    });
  }

  /**
   * DEPRECATED - No longer used, keeping for potential future optimization
   * Optimizes floor layout to minimize number of floor pieces
   * Goal: Use fewest floor pieces by trying different orientations and sizes
   */
  optimizeFloorLayout_DEPRECATED(roomLayout, targetWidth, targetLength) {
    const grid = new Set(roomLayout.map(cell => `${cell.x},${cell.z}`));
    const rectangles = [];
    const processed = new Set();
    
    // Convert target dimensions for both orientations
    const floorOptions = [
      { width: targetWidth, height: targetLength, name: 'normal' },
      { width: targetLength, height: targetWidth, name: 'rotated' }
    ];
    
    // Sort cells to process largest areas first
    const sortedCells = roomLayout.sort((a, b) => {
      const aKey = `${a.x},${a.z}`;
      const bKey = `${b.x},${b.z}`;
      return aKey.localeCompare(bKey);
    });
    
    sortedCells.forEach(cell => {
      const key = `${cell.x},${cell.z}`;
      if (processed.has(key)) return;
      
      // Try both orientations of the target floor size, prefer larger pieces
      let bestRect = null;
      let bestScore = 0;
      
      floorOptions.forEach(option => {
        const rect = this.findLargestRectangle(cell.x, cell.z, grid, processed, option.width, option.height);
        if (rect) {
          const score = rect.width * rect.height; // Prefer larger area coverage
          if (score > bestScore) {
            bestScore = score;
            bestRect = rect;
          }
        }
      });
      
      // If we couldn't fit the target size, try smaller rectangles
      if (!bestRect) {
        bestRect = this.findLargestRectangle(cell.x, cell.z, grid, processed, targetWidth, targetLength);
      }
      
      if (bestRect) {
        rectangles.push(bestRect);
        
        // Mark all cells in this rectangle as processed
        for (let x = bestRect.x; x < bestRect.x + bestRect.width; x++) {
          for (let z = bestRect.z; z < bestRect.z + bestRect.height; z++) {
            processed.add(`${x},${z}`);
          }
        }
      }
    });
    
    return rectangles;
  }

  /**
   * Finds the largest rectangle that can fit starting from a given position
   */
  findLargestRectangle(startX, startZ, grid, processed, targetWidth, targetLength) {
    let bestRect = null;
    let bestScore = 0;
    
    // Try different rectangle sizes, prioritizing target dimensions
    const maxWidth = Math.min(targetWidth * 2, this.gridDivisions - startX);
    const maxHeight = Math.min(targetLength * 2, this.gridDivisions - startZ);
    
    for (let width = 1; width <= maxWidth; width++) {
      for (let height = 1; height <= maxHeight; height++) {
        if (this.isRectangleValid(startX, startZ, width, height, grid, processed)) {
          // Score based on how close to target dimensions and total area
          const dimensionScore = this.scoreDimensions(width, height, targetWidth, targetLength);
          const areaScore = width * height;
          const totalScore = dimensionScore * areaScore;
          
          if (totalScore > bestScore) {
            bestScore = totalScore;
            bestRect = { x: startX, z: startZ, width, height };
          }
        }
      }
    }
    
    return bestRect;
  }

  /**
   * Checks if a rectangle can be placed at the given position
   */
  isRectangleValid(x, z, width, height, grid, processed) {
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < height; dz++) {
        const cellKey = `${x + dx},${z + dz}`;
        if (!grid.has(cellKey) || processed.has(cellKey)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Scores rectangle dimensions based on how close they are to target
   */
  scoreDimensions(width, height, targetWidth, targetLength) {
    const widthDiff = Math.abs(width - targetWidth);
    const heightDiff = Math.abs(height - targetLength);
    return 1 / (1 + widthDiff + heightDiff);
  }

  /**
   * Generates walls around the perimeter of the room layout
   * Creates individual wall pieces for each edge
   */
  generatePerimeterWalls(roomLayout, wallLength, wallWidth, wallHeight) {
    const grid = new Set(roomLayout.map(cell => `${cell.x},${cell.z}`));
    
    roomLayout.forEach(cell => {
      const { x, z } = cell;
      
      // Check all four edges of this cell
      const edges = [
        { dx: 0, dz: -1, wallX: 0, wallZ: -0.5, rotation: Math.PI / 2 }, // North wall (horizontal)
        { dx: 0, dz: 1, wallX: 0, wallZ: 0.5, rotation: Math.PI / 2 },   // South wall (horizontal)
        { dx: 1, dz: 0, wallX: 0.5, wallZ: 0, rotation: 0 }, // East wall (vertical)
        { dx: -1, dz: 0, wallX: -0.5, wallZ: 0, rotation: 0 }  // West wall (vertical)
      ];
      
      edges.forEach(edge => {
        const neighborKey = `${x + edge.dx},${z + edge.dz}`;
        if (!grid.has(neighborKey)) {
          // This edge needs a wall
          const worldX = (x * wallLength) - (this.gridSize / 2) + (wallLength / 2) + (edge.wallX * wallLength);
          const worldZ = (z * wallLength) - (this.gridSize / 2) + (wallLength / 2) + (edge.wallZ * wallLength);
          
          const wallMesh = this.createWallMesh(
            new THREE.Vector3(worldX, 0, worldZ),
            wallWidth,
            wallHeight,
            wallLength,
            edge.rotation
          );
          
          this.walls.push(wallMesh);
        }
      });
    });
  }

  /**
   * DEPRECATED - No longer used after switching to individual walls
   * Finds all edges that form the perimeter of the selected area
   */
  findPerimeterEdges_DEPRECATED(grid, roomLayout) {
    const edges = [];
    
    roomLayout.forEach(cell => {
      const { x, z } = cell;
      
      // Check all four edges of this cell
      const edgeChecks = [
        { edge: 'north', neighborX: x, neighborZ: z - 1, edgeX: x, edgeZ: z - 0.5 },
        { edge: 'south', neighborX: x, neighborZ: z + 1, edgeX: x, edgeZ: z + 0.5 },
        { edge: 'east', neighborX: x + 1, neighborZ: z, edgeX: x + 0.5, edgeZ: z },
        { edge: 'west', neighborX: x - 1, neighborZ: z, edgeX: x - 0.5, edgeZ: z }
      ];
      
      edgeChecks.forEach(check => {
        const neighborKey = `${check.neighborX},${check.neighborZ}`;
        if (!grid.has(neighborKey)) {
          // This edge is on the perimeter
          edges.push({
            edge: check.edge,
            x: check.edgeX,
            z: check.edgeZ,
            orientation: (check.edge === 'north' || check.edge === 'south') ? 'horizontal' : 'vertical'
          });
        }
      });
    });
    
    return edges;
  }

  /**
   * DEPRECATED - No longer used after switching to individual walls
   * Groups consecutive edges into wall segments to minimize wall count
   */
  groupEdgesIntoSegments_DEPRECATED(edges, wallLength) {
    const segments = [];
    const processed = new Set();
    
    edges.forEach(edge => {
      const edgeKey = `${edge.x},${edge.z},${edge.orientation}`;
      if (processed.has(edgeKey)) return;
      
      // Start a new segment
      const segment = {
        orientation: edge.orientation,
        edges: [edge],
        length: 1
      };
      
      processed.add(edgeKey);
      
      // Try to extend the segment in both directions
      this.extendSegment(segment, edges, processed);
      
      // Calculate world position (center of the segment)
      const centerX = segment.edges.reduce((sum, e) => sum + e.x, 0) / segment.edges.length;
      const centerZ = segment.edges.reduce((sum, e) => sum + e.z, 0) / segment.edges.length;
      
      // Fix offset by adjusting for grid center properly
      segment.worldX = (centerX * wallLength) - (this.gridSize / 2) + (wallLength / 2);
      segment.worldZ = (centerZ * wallLength) - (this.gridSize / 2) + (wallLength / 2);
      
      segments.push(segment);
    });
    
    return segments;
  }

  /**
   * DEPRECATED - No longer used after switching to individual walls
   * Extends a wall segment by finding consecutive edges
   */
  extendSegment_DEPRECATED(segment, allEdges, processed) {
    let extended = true;
    
    while (extended) {
      extended = false;
      
      // Get the current segment bounds
      const firstEdge = segment.edges[0];
      const lastEdge = segment.edges[segment.edges.length - 1];
      
      // Try to extend in both directions
      const extensionCandidates = allEdges.filter(edge => {
        const edgeKey = `${edge.x},${edge.z},${edge.orientation}`;
        if (processed.has(edgeKey) || edge.orientation !== segment.orientation) {
          return false;
        }
        
        // Check if this edge is adjacent to either end of the segment
        if (segment.orientation === 'horizontal') {
          return (edge.z === firstEdge.z && Math.abs(edge.x - firstEdge.x) === 1) ||
                 (edge.z === lastEdge.z && Math.abs(edge.x - lastEdge.x) === 1);
        } else {
          return (edge.x === firstEdge.x && Math.abs(edge.z - firstEdge.z) === 1) ||
                 (edge.x === lastEdge.x && Math.abs(edge.z - lastEdge.z) === 1);
        }
      });
      
      extensionCandidates.forEach(candidate => {
        const candidateKey = `${candidate.x},${candidate.z},${candidate.orientation}`;
        segment.edges.push(candidate);
        segment.length = segment.edges.length;
        processed.add(candidateKey);
        extended = true;
      });
    }
    
    // Sort edges in the segment for consistent positioning
    if (segment.orientation === 'horizontal') {
      segment.edges.sort((a, b) => a.x - b.x);
    } else {
      segment.edges.sort((a, b) => a.z - b.z);
    }
  }

  /**
   * Clears generated walls and floors
   */
  clearGeneratedElements() {
    // Remove wall meshes from scene
    this.walls.forEach((wall) => {
      if (wall.children.length > 0) {
        wall.children.forEach((child) => wall.remove(child));
      }
      this.scene.remove(wall);
    });
    
    // Remove floor meshes from scene
    this.floors.forEach((floor) => {
      if (floor.children.length > 0) {
        floor.children.forEach((child) => floor.remove(child));
      }
      this.scene.remove(floor);
    });
    
    this.walls = [];
    this.floors = [];
  }

  /**
   * Gets original point color based on point type
   */
  getOriginalPointColor(index) {
    // Determine point type based on position in allPoints array
    if (index < this.floors.length) {
      return COLORS.FLOOR_POINT;
    } else {
      return COLORS.WALL_POINT;
    }
  }

  /**
   * Creates a 3D wall mesh like in the maze system
   */
  createWallMesh(position, width, height, length, rotation) {
    const geometry = new THREE.BoxGeometry(width, height, length);
    const material = new THREE.MeshPhongMaterial({
      color: COLORS.WALL,
      flatShading: true,
      shininess: 0,
      emissive: COLORS.WALL_EMISSIVE,
      specular: COLORS.WALL_SPECULAR,
    });

    const wall = new THREE.Mesh(geometry, material);
    wall.position.copy(position);
    wall.rotation.y = rotation;
    wall.userData = { 
      type: 'wall',
      rotationY: rotation 
    };

    // Create edges
    const edges = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: COLORS.EDGE,
      linewidth: 2,
    });
    const edgesMesh = new THREE.LineSegments(edges, edgesMaterial);
    wall.add(edgesMesh);

    this.scene.add(wall);
    this.allPoints.push(wall);
    return wall;
  }

  /**
   * Creates a 3D floor mesh like in the maze system
   */
  createFloorMesh(position, length, height, width) {
    const geometry = new THREE.BoxGeometry(length, height, width);
    const material = new THREE.MeshPhongMaterial({
      color: COLORS.FLOOR,
      flatShading: true,
      shininess: 0,
      emissive: COLORS.FLOOR_EMISSIVE,
      specular: COLORS.FLOOR_SPECULAR,
    });

    const floor = new THREE.Mesh(geometry, material);
    floor.position.copy(position);
    floor.userData = { type: 'floor' };

    // Create edges
    const edges = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: COLORS.FLOOR_EDGE,
      linewidth: 2,
    });
    const edgesMesh = new THREE.LineSegments(edges, edgesMaterial);
    floor.add(edgesMesh);

    this.scene.add(floor);
    this.allPoints.push(floor);
    return floor;
  }

  /**
   * Updates button text to match the current room state
   */
  updateButtonText() {
    console.log('🔴 updateButtonText() called, isDrawingMode:', this.isDrawingMode);
    
    const button = document.getElementById("roomDrawingModeBtn");
    if (button) {
      const newText = this.isDrawingMode ? "Exit Drawing Mode" : "Enter Drawing Mode";
      console.log('🔴 Setting button text to:', newText);
      button.textContent = newText;
    } else {
      console.log('❌ Button roomDrawingModeBtn not found');
    }
  }

  /**
   * Ensures the room is in the correct initial state
   */
  ensureCorrectInitialState() {
    console.log('Ensuring correct initial state...');
    
    // Force room to correct initial state
    this.isDrawingMode = false;
    
    // Remove mouse listeners first
    this.removeMouseListeners();
    
    // Force complete drawing grid cleanup
    this.forceRemoveDrawingGrid();
    
    // Clear all state
    this.hiddenObjects = [];
    
    // Force normal grid to be visible
    this.forceRestoreNormalGrid();
    
    // Update button to match state
    this.updateButtonText();
    
    console.log('Initial state restored');
  }

  /**
   * Clears all room elements including drawing grid
   */
  clearPoints() {
    super.clearPoints();
    
    // Ensure correct initial state
    this.ensureCorrectInitialState();
    
    this.clearGeneratedElements();
  }
}