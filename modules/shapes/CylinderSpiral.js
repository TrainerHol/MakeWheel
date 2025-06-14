import { Spiral } from './Spiral.js';
import { COLORS, DEFAULTS } from '../utils/constants.js';

/**
 * Generates cylinder spiral shapes (spirals wrapped around a cylinder)
 */
export class CylinderSpiral extends Spiral {
  constructor(scene) {
    super(scene);
    this.shapeType = 'cylinderSpiral';
  }

  /**
   * Generates a cylinder spiral
   * @param {Object} params - Generation parameters
   */
  generate(params) {
    const {
      center = new THREE.Vector3(DEFAULTS.SPIRAL.CENTER.x, DEFAULTS.SPIRAL.CENTER.y, DEFAULTS.SPIRAL.CENTER.z),
      radius = DEFAULTS.CYLINDER_SPIRAL.RADIUS,
      height = DEFAULTS.CYLINDER_SPIRAL.HEIGHT,
      segments = DEFAULTS.CYLINDER_SPIRAL.SEGMENTS,
      turns = DEFAULTS.SPIRAL.TURNS,
      direction = DEFAULTS.SPIRAL.DIRECTION,
      planeAngle = 0,
      planeAxis = 'x'
    } = params;

    this.clearPoints();

    // Display the center point
    this.centerPoint = this.createSphere(center, COLORS.CENTER);

    if (segments <= 0) {
      return;
    }

    // Calculate total spiral length
    const totalRotationAngle = turns * 2 * Math.PI;
    const circumferencePerTurn = 2 * Math.PI * radius;
    const totalCircumference = turns * circumferencePerTurn;
    const totalSpiralLength = Math.sqrt(Math.pow(totalCircumference, 2) + Math.pow(height, 2));

    // Equal distance between points
    const segmentLength = totalSpiralLength / segments;

    // Generate spiral points
    const spiralPoints = this.generateCylinderSpiralPoints({
      center,
      radius,
      height,
      segments,
      totalSpiralLength,
      segmentLength,
      direction,
      totalCircumference
    });

    // Apply plane rotation
    this.applyPlaneRotation(spiralPoints, center, planeAngle, planeAxis);

    // Create spheres for the rotated points
    spiralPoints.forEach((point) => {
      const sphere = this.createSphere(point, COLORS.POINT);
      this.allPoints.push(sphere);
    });
  }

  /**
   * Generates the cylinder spiral points
   * @param {Object} params - Spiral parameters
   * @returns {THREE.Vector3[]} Array of spiral points
   */
  generateCylinderSpiralPoints(params) {
    const {
      center,
      radius,
      height,
      segments,
      totalSpiralLength,
      segmentLength,
      direction,
      totalCircumference
    } = params;

    const spiralPoints = [];
    let currentLength = 0;
    let theta = 0;

    for (let i = 0; i <= segments; i++) {
      // Calculate height based on the position along the spiral
      const t = currentLength / totalSpiralLength;
      const currentY = center.y + t * height;

      // Apply direction
      const currentRotation = direction === 'clockwise' ? -theta : theta;

      // Calculate position on the cylinder
      const x = center.x + radius * Math.cos(currentRotation);
      const z = center.z + radius * Math.sin(currentRotation);

      spiralPoints.push(new THREE.Vector3(x, currentY, z));

      // Calculate next position
      if (i < segments) {
        currentLength += segmentLength;

        // Calculate the angle increment for the next segment
        // This maintains equal spacing along the spiral curve
        const circumferentialIncrement = segmentLength * (totalCircumference / totalSpiralLength);
        theta += circumferentialIncrement / radius;
      }
    }

    return spiralPoints;
  }

  /**
   * Validates cylinder spiral parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result
   */
  validateInput(params) {
    const { center, radius, height, segments, turns } = params;

    if (!center) {
      return { valid: false, error: 'Center point is required' };
    }

    if (!radius || radius <= 0 || radius > 200) {
      return { valid: false, error: 'Radius must be between 0 and 200' };
    }

    if (!height || height <= 0 || height > 200) {
      return { valid: false, error: 'Height must be between 0 and 200' };
    }

    if (segments < 1 || segments > 200) {
      return { valid: false, error: 'Segments must be between 1 and 200' };
    }

    if (turns < 0.1 || turns > 20) {
      return { valid: false, error: 'Turns must be between 0.1 and 20' };
    }

    return { valid: true, error: null };
  }
}