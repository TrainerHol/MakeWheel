import { COLORS, ANIMATION } from '../utils/constants.js';

/**
 * Base class for maze generators with common functionality
 */
export class BaseMaze {
  constructor(scene) {
    this.scene = scene;
    this.walls = [];
    this.allPoints = [];
    this.centerPoint = null;
    this.grid = [];
  }

  /**
   * Creates a wall mesh
   * @param {THREE.Vector3} position - Wall position
   * @param {number} width - Wall width
   * @param {number} height - Wall height
   * @param {number} length - Wall length
   * @param {number} rotation - Y-axis rotation in radians
   * @param {Object} colors - Color configuration
   * @returns {THREE.Mesh} The created wall mesh
   */
  createWall(position, width, height, length, rotation, colors = {}) {
    const {
      main = COLORS.WALL,
      emissive = COLORS.WALL_EMISSIVE,
      specular = COLORS.WALL_SPECULAR,
      edge = COLORS.EDGE
    } = colors;

    const geometry = new THREE.BoxGeometry(width, height, length);
    const material = new THREE.MeshPhongMaterial({
      color: main,
      flatShading: true,
      shininess: 0,
      emissive: emissive,
      specular: specular,
    });

    const wall = new THREE.Mesh(geometry, material);
    wall.position.copy(position);
    wall.rotation.y = rotation;
    wall.userData = { type: 'wall' };

    // Create edges
    const edges = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: edge,
      linewidth: ANIMATION.LINE_WIDTH,
    });
    const edgesMesh = new THREE.LineSegments(edges, edgesMaterial);
    wall.add(edgesMesh);

    this.scene.add(wall);
    return wall;
  }

  /**
   * Creates a sphere marker
   * @param {THREE.Vector3} position - Sphere position
   * @param {number} color - Hex color value
   * @param {number} size - Sphere radius
   * @returns {THREE.Mesh} The created sphere mesh
   */
  createSphere(position, color, size = 0.5) {
    const geometry = new THREE.SphereGeometry(size);
    const material = new THREE.MeshPhongMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    return sphere;
  }

  /**
   * Clears all maze elements from the scene
   */
  clearMaze() {
    // Remove all walls and their children
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
    this.grid = [];

    // Remove center point if it exists
    if (this.centerPoint) {
      const centerSphere = this.scene.getObjectByName(this.getCenterSphereName());
      if (centerSphere) {
        this.scene.remove(centerSphere);
      }
      this.centerPoint = null;
    }
  }

  /**
   * Gets the name for the center sphere (override in derived classes)
   * @returns {string} Center sphere name
   */
  getCenterSphereName() {
    return 'centerSphere';
  }

  /**
   * Highlights a maze element at the specified index
   * @param {number} index - Index of the element to highlight
   */
  highlightPoint(index) {
    if (this.allPoints[index]) {
      const point = this.allPoints[index];
      const highlightColor = this.getHighlightColor(point);
      point.material.color.setHex(highlightColor);
    }
  }

  /**
   * Resets a maze element's color to its original value
   * @param {number} index - Index of the element to reset
   */
  resetPointColor(index) {
    if (this.allPoints[index]) {
      const point = this.allPoints[index];
      const originalColor = this.getOriginalColor(point);
      point.material.color.setHex(originalColor);
    }
  }

  /**
   * Gets the highlight color for a maze element
   * @param {THREE.Mesh} element - The element to get color for
   * @returns {number} Hex color value
   */
  getHighlightColor(element) {
    return COLORS.HIGHLIGHT;
  }

  /**
   * Gets the original color for a maze element
   * @param {THREE.Mesh} element - The element to get color for
   * @returns {number} Hex color value
   */
  getOriginalColor(element) {
    return COLORS.WALL;
  }

  /**
   * Creates a unique key for a maze element to avoid duplicates
   * @param {Array} position - [x, y, z] position
   * @param {number} rotation - Rotation value
   * @param {string} type - Element type
   * @returns {string} Unique key
   */
  getElementKey(position, rotation, type = 'wall') {
    const precision = ANIMATION.PRECISION;
    return `${type}_${position[0].toFixed(precision)},${position[1].toFixed(precision)},${position[2].toFixed(precision)},${rotation.toFixed(precision)}`;
  }

  /**
   * Deduplicates maze elements based on position
   */
  deduplicateElements() {
    const uniquePoints = new Map();
    this.allPoints.forEach((point) => {
      const key = `${point.position.x.toFixed(ANIMATION.PRECISION)},${point.position.y.toFixed(ANIMATION.PRECISION)},${point.position.z.toFixed(ANIMATION.PRECISION)}`;
      uniquePoints.set(key, point);
    });
    this.allPoints = Array.from(uniquePoints.values());
  }

  /**
   * Validates if a cell position is within the grid bounds
   * @param {Array} grid - The grid array
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if valid
   */
  isValidCell(grid, x, y) {
    return y >= 0 && y < grid.length && x >= 0 && x < grid[0].length;
  }

  /**
   * Gets the total number of maze elements
   * @returns {number} Element count
   */
  getElementCount() {
    return this.allPoints.length;
  }

  /**
   * Gets all maze walls
   * @returns {THREE.Mesh[]} Array of wall meshes
   */
  getWalls() {
    return this.walls;
  }

  /**
   * Gets all maze points/elements
   * @returns {THREE.Mesh[]} Array of element meshes
   */
  getPoints() {
    return this.allPoints;
  }
}