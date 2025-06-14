import { COLORS, SIZES } from '../utils/constants.js';

/**
 * Base class for all shape generators
 * Provides common functionality for point creation, highlighting, and scene management
 */
export class BaseShape {
  constructor(scene) {
    this.scene = scene;
    this.allPoints = [];
    this.centerPoint = null;
    this.lines = [];
    this.shapeType = 'base';
  }

  /**
   * Creates a sphere mesh at the specified position
   * @param {THREE.Vector3} position - Position for the sphere
   * @param {number} color - Hex color value
   * @param {number} size - Sphere radius
   * @returns {THREE.Mesh} The created sphere mesh
   */
  createSphere(position, color, size = SIZES.DEFAULT_SPHERE) {
    const geometry = new THREE.SphereGeometry(size);
    const material = new THREE.MeshPhongMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    this.scene.add(sphere);
    return sphere;
  }

  /**
   * Creates a line between two points
   * @param {THREE.Vector3} start - Start point
   * @param {THREE.Vector3} end - End point
   * @param {number} color - Line color
   * @returns {THREE.Line} The created line
   */
  createLine(start, end, color = COLORS.TEXT) {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
    this.lines.push(line);
    return line;
  }

  /**
   * Highlights a point at the specified index
   * @param {number} index - Index of the point to highlight
   */
  highlightPoint(index) {
    if (this.allPoints[index]) {
      this.allPoints[index].material.color.setHex(COLORS.HIGHLIGHT);
    }
  }

  /**
   * Resets a point's color to its original value
   * @param {number} index - Index of the point to reset
   */
  resetPointColor(index) {
    if (this.allPoints[index]) {
      const originalColor = this.getOriginalPointColor(index);
      this.allPoints[index].material.color.setHex(originalColor);
    }
  }

  /**
   * Gets the original color for a point based on its type and index
   * Override this method in derived classes for specific color logic
   * @param {number} index - Index of the point
   * @returns {number} Hex color value
   */
  getOriginalPointColor(index) {
    return COLORS.POINT;
  }

  /**
   * Clears all points and lines from the scene
   */
  clearPoints() {
    // Remove all points and their children
    this.allPoints.forEach((point) => {
      if (point.children.length > 0) {
        point.children.forEach((child) => point.remove(child));
      }
      this.scene.remove(point);
    });

    // Remove all lines
    this.lines.forEach((line) => this.scene.remove(line));

    // Remove center point if it exists
    if (this.centerPoint) {
      this.scene.remove(this.centerPoint);
      this.centerPoint = null;
    }

    // Clear arrays
    this.allPoints = [];
    this.lines = [];
  }

  /**
   * Applies rotation to an array of points around a center point
   * @param {THREE.Vector3[]|THREE.Mesh[]} points - Array of points to rotate (can be Vector3 or Mesh objects)
   * @param {THREE.Vector3} centerPoint - Center of rotation
   * @param {number} planeAngle - Rotation angle in degrees
   * @param {string} planeAxis - Axis of rotation ('x', 'y', or 'z')
   */
  applyPlaneRotation(points, centerPoint, planeAngle, planeAxis) {
    if (planeAngle === 0) return;

    const rotationMatrix = new THREE.Matrix4();
    const angleRad = THREE.MathUtils.degToRad(planeAngle);

    // Create rotation matrix based on selected axis
    switch (planeAxis) {
      case 'x':
        rotationMatrix.makeRotationX(angleRad);
        break;
      case 'y':
        rotationMatrix.makeRotationY(angleRad);
        break;
      case 'z':
        rotationMatrix.makeRotationZ(angleRad);
        break;
      default:
        rotationMatrix.makeRotationX(angleRad);
    }

    // Apply rotation to each point around the center point
    points.forEach((point) => {
      // Handle both Vector3 objects and Mesh objects
      const pointPosition = point.position || point;
      
      // Translate to origin (relative to center point)
      pointPosition.sub(centerPoint);
      // Apply rotation
      pointPosition.applyMatrix4(rotationMatrix);
      // Translate back
      pointPosition.add(centerPoint);
    });
  }

  /**
   * Validates input parameters
   * Override this method in derived classes for specific validation
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result { valid: boolean, error: string }
   */
  validateInput(params) {
    return { valid: true, error: null };
  }

  /**
   * Generates the shape
   * Must be implemented by derived classes
   * @param {Object} params - Shape-specific parameters
   */
  generate(params) {
    throw new Error('generate() method must be implemented by derived classes');
  }

  /**
   * Gets the center point of the shape
   * @returns {THREE.Vector3|null} Center point or null if not set
   */
  getCenterPoint() {
    return this.centerPoint ? this.centerPoint.position : null;
  }

  /**
   * Gets all generated points
   * @returns {THREE.Mesh[]} Array of point meshes
   */
  getPoints() {
    return this.allPoints;
  }

  /**
   * Gets the total number of points
   * @returns {number} Number of points
   */
  getPointCount() {
    return this.allPoints.length;
  }
}