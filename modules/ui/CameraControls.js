import { SCALING, MATH } from '../utils/constants.js';

/**
 * Handles camera controls and mouse interactions for the 3D scene
 * Implements smooth orbit controls similar to Three.js OrbitControls
 */
export class CameraControls {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    
    // Control states
    this.isDragging = false;
    this.isPanning = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.isInitialized = false;
    
    // Orbit control parameters
    this.target = new THREE.Vector3(0, 0, 0);
    this.spherical = new THREE.Spherical();
    this.sphericalDelta = new THREE.Spherical();
    this.scale = 1;
    this.panOffset = new THREE.Vector3();
    
    // Control settings
    this.enableDamping = true;
    this.dampingFactor = 0.05;
    this.rotateSpeed = 1.0;
    this.zoomSpeed = 1.0;
    this.panSpeed = 1.0;
    
    // Constraints
    this.minDistance = 10;
    this.maxDistance = 1000;
    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians
    
    // Internal state
    this.lastPosition = new THREE.Vector3();
    this.lastQuaternion = new THREE.Quaternion();
    
    // Mouse buttons
    this.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
  }

  /**
   * Initialize camera controls and mouse event listeners
   */
  init() {
    if (this.isInitialized) return;

    this.setupMouseControls();
    this.updateCamera();
    this.isInitialized = true;
  }

  /**
   * Setup mouse interaction controls for camera movement
   */
  setupMouseControls() {
    const canvas = this.sceneManager.renderer.domElement;
    
    // Mouse down event - only on canvas
    canvas.addEventListener("mousedown", (e) => {
      e.preventDefault();
      
      switch (e.button) {
        case 0: // Left mouse button - rotate
          if (this.mouseButtons.LEFT === THREE.MOUSE.ROTATE) {
            this.isDragging = true;
            this.startRotate(e);
          } else if (this.mouseButtons.LEFT === THREE.MOUSE.PAN) {
            this.isPanning = true;
            this.startPan(e);
          }
          break;
        case 1: // Middle mouse button - zoom
          this.startDolly(e);
          break;
        case 2: // Right mouse button - pan
          if (this.mouseButtons.RIGHT === THREE.MOUSE.PAN) {
            this.isPanning = true;
            this.startPan(e);
          }
          break;
      }
      
      this.previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      };
    });

    // Mouse move event - on document to handle dragging outside canvas
    document.addEventListener("mousemove", (e) => {
      if (!this.isDragging && !this.isPanning) {
        return;
      }

      e.preventDefault();

      if (this.isDragging) {
        this.handleRotate(e);
      } else if (this.isPanning) {
        this.handlePan(e);
      }

      this.previousMousePosition = {
        x: e.clientX,
        y: e.clientY,
      };
    });

    // Mouse up event - on document to handle releasing outside canvas
    document.addEventListener("mouseup", (e) => {
      this.isDragging = false;
      this.isPanning = false;
    });

    // Mouse wheel for zooming - only on canvas
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.handleZoom(e);
    });

    // Prevent context menu on right click - only on canvas
    canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    // Handle mouse leave canvas to stop interactions
    canvas.addEventListener("mouseleave", () => {
      this.isDragging = false;
      this.isPanning = false;
    });

    // No separate animation loop needed - will be called from main render loop
  }

  /**
   * Start rotation interaction
   */
  startRotate(event) {
    // Nothing special needed for rotate start
  }

  /**
   * Handle rotation during mouse drag
   */
  handleRotate(event) {
    const deltaX = event.clientX - this.previousMousePosition.x;
    const deltaY = event.clientY - this.previousMousePosition.y;
    
    const element = this.sceneManager.renderer.domElement;
    
    // Calculate rotation angles based on mouse movement
    this.sphericalDelta.theta -= MATH.TWO_PI * deltaX / element.clientHeight * this.rotateSpeed;
    this.sphericalDelta.phi -= MATH.TWO_PI * deltaY / element.clientHeight * this.rotateSpeed;
  }

  /**
   * Start panning interaction
   */
  startPan(event) {
    // Nothing special needed for pan start
  }

  /**
   * Handle panning during mouse drag
   */
  handlePan(event) {
    const deltaX = event.clientX - this.previousMousePosition.x;
    const deltaY = event.clientY - this.previousMousePosition.y;
    
    const element = this.sceneManager.renderer.domElement;
    
    // Calculate pan offset
    this.pan(deltaX, deltaY, element);
  }

  /**
   * Pan the camera
   */
  pan(deltaX, deltaY, element) {
    const offset = new THREE.Vector3();
    
    // Calculate the pan vector in camera space
    const position = this.sceneManager.camera.position;
    offset.copy(position).sub(this.target);
    
    // Calculate target distance for scaling pan speed
    let targetDistance = offset.length();
    targetDistance *= Math.tan((this.sceneManager.camera.fov / 2) * Math.PI / 180.0);
    
    // Pan left/right
    const panLeft = new THREE.Vector3();
    panLeft.setFromMatrixColumn(this.sceneManager.camera.matrix, 0);
    panLeft.multiplyScalar(-2 * deltaX * targetDistance / element.clientHeight * this.panSpeed);
    
    // Pan up/down
    const panUp = new THREE.Vector3();
    panUp.setFromMatrixColumn(this.sceneManager.camera.matrix, 1);
    panUp.multiplyScalar(2 * deltaY * targetDistance / element.clientHeight * this.panSpeed);
    
    // Apply pan offset
    this.panOffset.add(panLeft);
    this.panOffset.add(panUp);
  }

  /**
   * Start zoom interaction
   */
  startDolly(event) {
    // Nothing special needed for dolly start
  }

  /**
   * Handle zoom from mouse wheel
   */
  handleZoom(event) {
    if (event.deltaY < 0) {
      this.dollyIn(this.getZoomScale()); // Zoom in when scrolling up (forward)
    } else if (event.deltaY > 0) {
      this.dollyOut(this.getZoomScale()); // Zoom out when scrolling down (backward)
    }
  }

  /**
   * Zoom in (get closer)
   */
  dollyIn(dollyScale) {
    this.scale *= dollyScale;
  }

  /**
   * Zoom out (get farther)
   */
  dollyOut(dollyScale) {
    this.scale /= dollyScale;
  }

  /**
   * Get zoom scale factor
   */
  getZoomScale() {
    return Math.pow(0.95, this.zoomSpeed);
  }

  /**
   * Update camera position and orientation
   */
  updateCamera() {
    const offset = new THREE.Vector3();
    const quat = new THREE.Quaternion().setFromUnitVectors(
      this.sceneManager.camera.up,
      new THREE.Vector3(0, 1, 0)
    );
    const quatInverse = quat.clone().invert();
    
    const position = this.sceneManager.camera.position;
    
    offset.copy(position).sub(this.target);
    
    // Rotate offset to "y-axis-is-up" space
    offset.applyQuaternion(quat);
    
    // Angle from z-axis around y-axis
    this.spherical.setFromVector3(offset);
    
    if (this.enableDamping) {
      this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
      this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;
      
      this.sphericalDelta.theta *= (1 - this.dampingFactor);
      this.sphericalDelta.phi *= (1 - this.dampingFactor);
    } else {
      this.spherical.theta += this.sphericalDelta.theta;
      this.spherical.phi += this.sphericalDelta.phi;
      
      this.sphericalDelta.set(0, 0, 0);
    }
    
    // Restrict angles to be between desired limits
    this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
    
    // Ensure phi is not exactly zero or PI (causes gimbal lock)
    this.spherical.phi = Math.max(0.000001, Math.min(Math.PI - 0.000001, this.spherical.phi));
    
    this.spherical.radius *= this.scale;
    
    // Restrict radius to be between desired limits
    this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
    
    // Move target to panned location
    if (this.enableDamping) {
      this.target.addScaledVector(this.panOffset, this.dampingFactor);
      this.panOffset.multiplyScalar(1 - this.dampingFactor);
    } else {
      this.target.add(this.panOffset);
      this.panOffset.set(0, 0, 0);
    }
    
    offset.setFromSpherical(this.spherical);
    
    // Rotate offset back to "camera-up-vector-is-up" space
    offset.applyQuaternion(quatInverse);
    
    position.copy(this.target).add(offset);
    
    this.sceneManager.camera.lookAt(this.target);
    
    this.scale = 1;
    
    // Update controls state
    if (this.lastPosition.distanceToSquared(position) > 0.000001 ||
        8 * (1 - this.lastQuaternion.dot(this.sceneManager.camera.quaternion)) > 0.000001) {
      
      this.lastPosition.copy(position);
      this.lastQuaternion.copy(this.sceneManager.camera.quaternion);
      
      return true;
    }
    
    return false;
  }

  /**
   * Update camera controls - call this from main animation loop
   */
  update() {
    if (this.enableDamping) {
      this.updateCamera();
    }
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
      this.target.set(0, 0, 0);
      this.sceneManager.camera.position.set(
        SCALING.CAMERA_DISTANCE,
        SCALING.CAMERA_DISTANCE,
        SCALING.CAMERA_DISTANCE
      );
      this.sceneManager.camera.lookAt(this.target);
      this.updateCameraState();
      return;
    }
    
    if (!points || points.length === 0) {
      // Reset to default position if no points
      this.target.set(0, 0, 0);
      this.sceneManager.camera.position.set(
        SCALING.CAMERA_DISTANCE,
        SCALING.CAMERA_DISTANCE,
        SCALING.CAMERA_DISTANCE
      );
      this.sceneManager.camera.lookAt(this.target);
      this.updateCameraState();
      console.log('Camera reset to default position (no points found)');
      return;
    }

    // Calculate bounding box of all points
    const boundingBox = this.calculateBoundingBox(points);
    
    // Calculate center of the shape and set as target
    this.target.set(
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
      this.target.x + distance * 0.7,
      this.target.y + distance * 0.7,
      this.target.z + distance * 0.7
    );
    
    this.sceneManager.camera.lookAt(this.target);
    
    // Update internal state for orbit controls
    this.updateCameraState();
    
    console.log(`Camera reset to view ${shapeType} with ${points.length} points, center:`, this.target, 'distance:', distance);
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
   * Update internal camera state for orbit controls
   */
  updateCameraState() {
    const offset = new THREE.Vector3();
    offset.copy(this.sceneManager.camera.position).sub(this.target);
    
    // Update spherical coordinates
    this.spherical.setFromVector3(offset);
    
    // Reset deltas
    this.sphericalDelta.set(0, 0, 0);
    this.panOffset.set(0, 0, 0);
    this.scale = 1;
    
    // Update last position and quaternion
    this.lastPosition.copy(this.sceneManager.camera.position);
    this.lastQuaternion.copy(this.sceneManager.camera.quaternion);
  }

  /**
   * Set camera to a specific predefined view
   */
  setCameraView(view, center = new THREE.Vector3(0, 0, 0)) {
    const distance = SCALING.CAMERA_DISTANCE;
    
    // Set the target to the center
    this.target.copy(center);
    
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
    
    this.sceneManager.camera.lookAt(this.target);
    this.updateCameraState();
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