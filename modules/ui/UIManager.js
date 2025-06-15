import { ShapeControllers } from './ShapeControllers.js';
import { FileHandlers } from './FileHandlers.js';
import { CoordinatesDisplay } from './CoordinatesDisplay.js';
import { CameraControls } from './CameraControls.js';

/**
 * Main UI coordinator that manages all UI components
 */
export class UIManager {
  constructor(wheel, sceneManager, maze, maze3d) {
    this.wheel = wheel;
    this.sceneManager = sceneManager;
    this.maze = maze;
    this.maze3d = maze3d;
    this.shapeType = "wheel";

    // Initialize sub-components
    this.shapeControllers = new ShapeControllers(wheel, maze, maze3d, wheel.roomShape);
    this.fileHandlers = new FileHandlers();
    this.coordinatesDisplay = new CoordinatesDisplay(wheel, maze, maze3d);
    this.cameraControls = new CameraControls(sceneManager);
  }

  /**
   * Initialize all UI components and event listeners
   */
  init() {
    this.setupEventListeners();
    this.cameraControls.init();
    
    // Connect camera controls to scene manager
    this.sceneManager.setCameraControls(this.cameraControls);
    
    this.updateUIForShape();
  }

  /**
   * Setup all event listeners for UI interactions
   */
  setupEventListeners() {
    // Shape generation
    document.getElementById("generateBtn").addEventListener("click", () => {
      this.generateShape();
    });

    // Shape type selection
    document.getElementById("shapeType").addEventListener("change", (e) => {
      this.shapeType = e.target.value;
      this.updateUIForShape();
      this.clearShapes();
    });

    // Camera controls
    document.getElementById("resetCamera").addEventListener("click", () => {
      this.resetCameraToShape();
    });

    // Room drawing mode button - handle mode switching
    const roomDrawingModeBtn = document.getElementById("roomDrawingModeBtn");
    if (roomDrawingModeBtn) {
      console.log('🟢 UIManager: Setting up room drawing mode button listener');
      roomDrawingModeBtn.addEventListener("click", () => {
        console.log('🟢 UIManager: Room drawing mode button clicked');
        
        // Check current state and call appropriate method
        if (this.wheel.roomShape && this.wheel.roomShape.isDrawingMode) {
          console.log('🟢 UIManager: Currently in drawing mode, exiting...');
          this.shapeControllers.exitRoomDrawingMode();
        } else {
          console.log('🟢 UIManager: Not in drawing mode, entering...');
          this.shapeControllers.enterRoomDrawingMode();
        }
      });
    } else {
      console.log('❌ UIManager: roomDrawingModeBtn not found');
    }

    // Room floor file upload (in MakePlace JSON Processing section)
    const roomFloorFileInput = document.getElementById("roomFloorFileInput");
    if (roomFloorFileInput) {
      roomFloorFileInput.addEventListener("change", (e) => {
        this.fileHandlers.handleRoomFloorFileUpload(e);
      });
    }

    // MakePlace format toggle
    document.getElementById("makePlaceFormat").addEventListener("change", (e) => {
      this.coordinatesDisplay.setMakePlaceFormat(e.target.checked);
      this.coordinatesDisplay.updateCoordinatesList(this.shapeType);
    });

    // Plane angle changes (for real-time updates if needed)
    const planeAngleInput = document.getElementById("planeAngle");
    if (planeAngleInput) {
      planeAngleInput.addEventListener("change", () => {
        if (this.shapeType === "wheel") {
          this.generateShape();
        }
      });
    }

    // File operations
    document.getElementById("jsonFileInput").addEventListener("change", (e) => {
      this.fileHandlers.handleFileUpload(e);
    });

    document.getElementById("floorFileInput").addEventListener("change", (e) => {
      this.fileHandlers.handleFloorFileUpload(e);
    });

    document.getElementById("processDesignBtn").addEventListener("click", () => {
      this.processDesign();
    });

    document.getElementById("downloadBtn").addEventListener("click", () => {
      this.downloadProcessedJSON();
    });
  }

  /**
   * Generate the currently selected shape type
   */
  generateShape() {
    let success = false;

    try {
      switch (this.shapeType) {
        case "wheel":
          success = this.shapeControllers.generateWheel();
          break;
        case "spiral":
          success = this.shapeControllers.generateSpiral();
          break;
        case "conicalSpiral":
          success = this.shapeControllers.generateConicalSpiral();
          break;
        case "sphericalSpiral":
          success = this.shapeControllers.generateSphericalSpiral();
          break;
        case "grid":
          success = this.shapeControllers.generateGrid();
          break;
        case "maze":
          success = this.shapeControllers.generateMaze();
          break;
        case "maze3d":
          success = this.shapeControllers.generateMaze3D();
          break;
        case "cylinderSpiral":
          success = this.shapeControllers.generateCylinderSpiral();
          break;
        case "room":
          success = this.shapeControllers.generateRoom();
          break;
        default:
          console.warn(`Unknown shape type: ${this.shapeType}`);
          return;
      }

      if (success) {
        this.coordinatesDisplay.updateCoordinatesList(this.shapeType);
        // Camera position is preserved - use the Reset Camera button if needed
      }
    } catch (error) {
      console.error("Error generating shape:", error);
      alert(`Error generating ${this.shapeType}: ${error.message}`);
    }
  }

  /**
   * Clear all shapes and UI state
   */
  clearShapes() {
    this.wheel.clearPoints();
    this.maze.clearMaze();
    if (this.maze3d) {
      this.maze3d.clearMaze();
    }
    this.coordinatesDisplay.clear();
    // Don't reset file handlers - preserve uploaded designs and Process Design button
  }

  /**
   * Update UI visibility based on selected shape type
   */
  updateUIForShape() {
    this.shapeControllers.updateUIForShape(this.shapeType);
    this.coordinatesDisplay.clear();
    
    // Hide/show generate button based on shape type
    const generateBtn = document.getElementById("generateBtn");
    if (generateBtn) {
      generateBtn.style.display = this.shapeType === "room" ? "none" : "block";
    }
  }

  /**
   * Reset camera to focus on the current shape
   */
  resetCameraToShape() {
    this.cameraControls.resetCameraToShape(
      this.shapeType,
      this.wheel,
      this.maze,
      this.maze3d
    );
  }

  /**
   * Process the uploaded design with generated points
   */
  processDesign() {
    const success = this.fileHandlers.processDesign(
      this.shapeType,
      this.wheel,
      this.maze,
      this.maze3d
    );

    if (success) {
      console.log("Design processed successfully");
    }
  }

  /**
   * Download the processed JSON design
   */
  downloadProcessedJSON() {
    this.fileHandlers.downloadProcessedJSON(this.shapeType);
  }

  /**
   * Get current shape type
   */
  getShapeType() {
    return this.shapeType;
  }

  /**
   * Set shape type programmatically
   */
  setShapeType(shapeType) {
    this.shapeType = shapeType;
    const shapeSelect = document.getElementById("shapeType");
    if (shapeSelect) {
      shapeSelect.value = shapeType;
    }
    this.updateUIForShape();
  }

  /**
   * Export coordinates in various formats
   */
  exportCoordinates(format = 'csv') {
    switch (format) {
      case 'csv':
        this.coordinatesDisplay.exportAsCSV(this.shapeType);
        break;
      default:
        console.warn(`Export format '${format}' not supported`);
    }
  }

  /**
   * Get statistics about the current shape
   */
  getShapeStats() {
    const points = this.coordinatesDisplay.getPointsForShape(this.shapeType);
    if (!points || points.length === 0) {
      return null;
    }

    const boundingBox = this.cameraControls.calculateBoundingBox(points);
    const size = {
      x: boundingBox.max.x - boundingBox.min.x,
      y: boundingBox.max.y - boundingBox.min.y,
      z: boundingBox.max.z - boundingBox.min.z
    };

    return {
      pointCount: points.length,
      boundingBox,
      size,
      center: {
        x: (boundingBox.min.x + boundingBox.max.x) / 2,
        y: (boundingBox.min.y + boundingBox.max.y) / 2,
        z: (boundingBox.min.z + boundingBox.max.z) / 2
      }
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.cameraControls.destroy();
    this.clearShapes();
  }
}