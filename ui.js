import { UIManager } from './modules/ui/UIManager.js';

/**
 * Main UI class that serves as a compatibility wrapper for the modular UI system
 * This maintains backward compatibility while using the new modular architecture
 */
export class UI {
  constructor(wheel, sceneManager, maze, maze3d) {
    // Initialize the modular UI manager
    this.uiManager = new UIManager(wheel, sceneManager, maze, maze3d);
    
    // Legacy properties for backward compatibility
    this.wheel = wheel;
    this.sceneManager = sceneManager;
    this.maze = maze;
    this.maze3d = maze3d;
    this.shapeType = "wheel";
  }

  /**
   * Initialize the UI system
   */
  init() {
    this.uiManager.init();
  }

  /**
   * Legacy method: Generate shape based on current type
   */
  generateShape() {
    this.uiManager.generateShape();
  }

  /**
   * Legacy method: Generate wheel points
   */
  generatePoints() {
    if (this.uiManager.shapeControllers.generateWheel()) {
      this.uiManager.coordinatesDisplay.updateCoordinatesList("wheel");
    }
  }

  /**
   * Legacy method: Generate spiral
   */
  generateSpiral() {
    if (this.uiManager.shapeControllers.generateSpiral()) {
      this.uiManager.coordinatesDisplay.updateCoordinatesList("spiral");
    }
  }

  /**
   * Legacy method: Generate conical spiral
   */
  generateConicalSpiral() {
    if (this.uiManager.shapeControllers.generateConicalSpiral()) {
      this.uiManager.coordinatesDisplay.updateCoordinatesList("conicalSpiral");
    }
  }

  /**
   * Legacy method: Generate spherical spiral
   */
  generateSphericalSpiral() {
    if (this.uiManager.shapeControllers.generateSphericalSpiral()) {
      this.uiManager.coordinatesDisplay.updateCoordinatesList("sphericalSpiral");
    }
  }

  /**
   * Legacy method: Generate grid
   */
  generateGrid() {
    if (this.uiManager.shapeControllers.generateGrid()) {
      this.uiManager.coordinatesDisplay.updateCoordinatesList("grid");
    }
  }

  /**
   * Legacy method: Generate cylinder spiral
   */
  generateCylinderSpiralUI() {
    if (this.uiManager.shapeControllers.generateCylinderSpiral()) {
      this.uiManager.coordinatesDisplay.updateCoordinatesList("cylinderSpiral");
    }
  }

  /**
   * Legacy method: Generate maze
   */
  generateMaze() {
    if (this.uiManager.shapeControllers.generateMaze()) {
      this.uiManager.coordinatesDisplay.updateCoordinatesList("maze");
    }
  }

  /**
   * Legacy method: Generate 3D maze
   */
  generateMaze3D() {
    if (this.uiManager.shapeControllers.generateMaze3D()) {
      this.uiManager.coordinatesDisplay.updateCoordinatesList("maze3d");
    }
  }

  /**
   * Legacy method: Update coordinates list
   */
  updateCoordinatesList() {
    this.uiManager.coordinatesDisplay.updateCoordinatesList(this.uiManager.getShapeType());
  }

  /**
   * Legacy method: Setup copy buttons
   */
  setupCopyButtons() {
    this.uiManager.coordinatesDisplay.setupCopyButtons();
  }

  /**
   * Legacy method: Setup mouse controls
   */
  setupMouseControls() {
    // Mouse controls are now handled by CameraControls in UIManager.init()
    console.log("Mouse controls initialized through UIManager");
  }

  /**
   * Legacy method: Reset camera to shape
   */
  resetCameraToShape() {
    this.uiManager.resetCameraToShape();
  }

  /**
   * Legacy method: Handle file upload
   */
  handleFileUpload(event) {
    this.uiManager.fileHandlers.handleFileUpload(event);
  }

  /**
   * Legacy method: Handle floor file upload
   */
  handleFloorFileUpload(event) {
    this.uiManager.fileHandlers.handleFloorFileUpload(event);
  }

  /**
   * Legacy method: Process design
   */
  processDesign() {
    this.uiManager.processDesign();
  }

  /**
   * Legacy method: Process attachments
   */
  processAttachments(originalDesign, targetDesign, referencePoint) {
    this.uiManager.fileHandlers.processAttachments(
      originalDesign, 
      targetDesign, 
      referencePoint, 
      this.uiManager.getShapeType()
    );
  }

  /**
   * Legacy method: Download processed JSON
   */
  downloadProcessedJSON() {
    this.uiManager.downloadProcessedJSON();
  }

  /**
   * Legacy method: Update UI for shape
   */
  updateUIForShape() {
    this.uiManager.updateUIForShape();
  }

  // Legacy properties - getter/setter pairs for backward compatibility
  get useMakePlaceFormat() {
    return this.uiManager.coordinatesDisplay.useMakePlaceFormat;
  }

  set useMakePlaceFormat(value) {
    this.uiManager.coordinatesDisplay.setMakePlaceFormat(value);
  }

  get uploadedDesign() {
    return this.uiManager.fileHandlers.uploadedDesign;
  }

  set uploadedDesign(value) {
    this.uiManager.fileHandlers.uploadedDesign = value;
  }

  get uploadedFloorDesign() {
    return this.uiManager.fileHandlers.uploadedFloorDesign;
  }

  set uploadedFloorDesign(value) {
    this.uiManager.fileHandlers.uploadedFloorDesign = value;
  }

  get processedDesign() {
    return this.uiManager.fileHandlers.processedDesign;
  }

  set processedDesign(value) {
    this.uiManager.fileHandlers.processedDesign = value;
  }

  get shapeType() {
    return this.uiManager.getShapeType();
  }

  set shapeType(value) {
    this.uiManager.setShapeType(value);
  }

  /**
   * New methods available through modular architecture
   */

  /**
   * Export coordinates in various formats
   */
  exportCoordinates(format = 'csv') {
    this.uiManager.exportCoordinates(format);
  }

  /**
   * Get statistics about the current shape
   */
  getShapeStats() {
    return this.uiManager.getShapeStats();
  }

  /**
   * Set camera to a specific predefined view
   */
  setCameraView(view) {
    const stats = this.getShapeStats();
    const center = stats ? new THREE.Vector3(stats.center.x, stats.center.y, stats.center.z) : new THREE.Vector3(0, 0, 0);
    this.uiManager.cameraControls.setCameraView(view, center);
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.uiManager.destroy();
  }
}