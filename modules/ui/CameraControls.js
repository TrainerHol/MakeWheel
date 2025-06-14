import { SCALING } from '../utils/constants.js';

/**
 * Handles camera controls and mouse interactions for the 3D scene
 */
export class CameraControls {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.isInitialized = false;
  }

  /**
   * Initialize camera controls and mouse event listeners
   */
  init() {
    if (this.isInitialized) return;

    this.setupMouseControls();
    this.isInitialized = true;
  }

  /**
   * Setup mouse interaction controls for camera movement
   */
  setupMouseControls() {
    // Mouse down event
    document.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      };
    });

    // Mouse move event for camera rotation
    document.addEventListener("mousemove", (e) => {
      if (!this.isDragging) {
        this.previousMousePosition = {
          x: e.clientX,
          y: e.clientY
        };
        return;
      }

      const deltaMove = {
        x: e.clientX - this.previousMousePosition.x,
        y: e.clientY - this.previousMousePosition.y,
      };

      // Apply rotation based on mouse movement
      const deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          this.toRadians(deltaMove.y * SCALING.ROTATION_FACTOR),
          this.toRadians(deltaMove.x * SCALING.ROTATION_FACTOR),
          0,
          "XYZ"
        )
      );

      this.sceneManager.camera.position.applyQuaternion(deltaRotationQuaternion);
      this.sceneManager.camera.lookAt(this.sceneManager.scene.position);

      this.previousMousePosition = {
        x: e.clientX,
        y: e.clientY,
      };
    });

    // Mouse up event
    document.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    // Mouse wheel for zooming
    document.addEventListener("wheel", (e) => {
      e.preventDefault();
      
      const camera = this.sceneManager.camera;
      const zoomDirection = e.deltaY > 0 ? 1 : -1;
      const zoomAmount = zoomDirection * SCALING.ZOOM_FACTOR;
      
      // Get current distance from origin
      const currentDistance = camera.position.length();
      const newDistance = Math.max(10, currentDistance + (currentDistance * zoomAmount));
      
      // Scale the camera position to the new distance
      camera.position.normalize().multiplyScalar(newDistance);
      camera.lookAt(this.sceneManager.scene.position);
    });

    // Prevent context menu on right click
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    // Handle mouse leave to stop dragging
    document.addEventListener("mouseleave", () => {
      this.isDragging = false;
    });
  }

  /**
   * Reset camera to default position focusing on the current shape
   */
  resetCameraToShape(shapeType, wheel, maze, maze3d) {
    let points;
    
    try {
      points = this.getPointsForShape(shapeType, wheel, maze, maze3d);
    } catch (error) {
      console.error('Error getting points for camera reset:', error);
      // Fallback to default position
      this.sceneManager.camera.position.set(
        SCALING.CAMERA_DISTANCE,
        SCALING.CAMERA_DISTANCE,
        SCALING.CAMERA_DISTANCE
      );
      this.sceneManager.camera.lookAt(0, 0, 0);
      return;
    }
    
    if (!points || points.length === 0) {
      // Reset to default position if no points
      this.sceneManager.camera.position.set(
        SCALING.CAMERA_DISTANCE,
        SCALING.CAMERA_DISTANCE,
        SCALING.CAMERA_DISTANCE
      );
      this.sceneManager.camera.lookAt(0, 0, 0);
      console.log('Camera reset to default position (no points found)');
      return;
    }

    // Calculate bounding box of all points
    const boundingBox = this.calculateBoundingBox(points);
    
    // Calculate center of the shape
    const center = new THREE.Vector3(
      (boundingBox.min.x + boundingBox.max.x) / 2,
      (boundingBox.min.y + boundingBox.max.y) / 2,
      (boundingBox.min.z + boundingBox.max.z) / 2
    );

    // Calculate appropriate distance based on shape size
    const size = Math.max(
      boundingBox.max.x - boundingBox.min.x,
      boundingBox.max.y - boundingBox.min.y,
      boundingBox.max.z - boundingBox.min.z
    );
    
    const distance = Math.max(size * 2, 50); // Ensure minimum distance

    // Position camera to view the shape
    this.sceneManager.camera.position.set(
      center.x + distance * 0.7,
      center.y + distance * 0.7,
      center.z + distance * 0.7
    );
    
    this.sceneManager.camera.lookAt(center);
    
    // Force camera matrix update
    this.sceneManager.camera.updateProjectionMatrix();
    this.sceneManager.camera.updateMatrixWorld();
    
    console.log(`Camera reset to view ${shapeType} with ${points.length} points, center:`, center, 'distance:', distance);
  }

  /**
   * Get points array based on shape type
   */
  getPointsForShape(shapeType, wheel, maze, maze3d) {
    switch (shapeType) {
      case "maze":
        return maze.allPoints;
      case "maze3d":
        return maze3d.allPoints;
      default:
        return wheel.allPoints;
    }
  }

  /**
   * Calculate bounding box for a set of points
   */
  calculateBoundingBox(points) {
    if (!points || points.length === 0) {
      return {
        min: new THREE.Vector3(0, 0, 0),
        max: new THREE.Vector3(0, 0, 0)
      };
    }

    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

    points.forEach(point => {
      const pos = point.position;
      min.x = Math.min(min.x, pos.x);
      min.y = Math.min(min.y, pos.y);
      min.z = Math.min(min.z, pos.z);
      max.x = Math.max(max.x, pos.x);
      max.y = Math.max(max.y, pos.y);
      max.z = Math.max(max.z, pos.z);
    });

    return { min, max };
  }

  /**
   * Convert degrees to radians
   */
  toRadians(angle) {
    return angle * (Math.PI / 180);
  }

  /**
   * Set camera to a specific predefined view
   */
  setCameraView(view, center = new THREE.Vector3(0, 0, 0)) {
    const distance = SCALING.CAMERA_DISTANCE;
    
    switch (view) {
      case 'front':
        this.sceneManager.camera.position.set(center.x, center.y, center.z + distance);
        break;
      case 'back':
        this.sceneManager.camera.position.set(center.x, center.y, center.z - distance);
        break;
      case 'left':
        this.sceneManager.camera.position.set(center.x - distance, center.y, center.z);
        break;
      case 'right':
        this.sceneManager.camera.position.set(center.x + distance, center.y, center.z);
        break;
      case 'top':
        this.sceneManager.camera.position.set(center.x, center.y + distance, center.z);
        break;
      case 'bottom':
        this.sceneManager.camera.position.set(center.x, center.y - distance, center.z);
        break;
      case 'isometric':
      default:
        this.sceneManager.camera.position.set(
          center.x + distance * 0.7,
          center.y + distance * 0.7,
          center.z + distance * 0.7
        );
        break;
    }
    
    this.sceneManager.camera.lookAt(center);
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    if (!this.isInitialized) return;
    
    // Note: We would need to store references to the specific event handlers
    // to properly remove them. For now, we just mark as not initialized.
    this.isInitialized = false;
  }
}