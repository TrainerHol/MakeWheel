import { Spiral } from './Spiral.js';
import { COLORS, DEFAULTS } from '../utils/constants.js';

/**
 * Generates conical spiral shapes (spirals that form a cone shape)
 */
export class ConicalSpiral extends Spiral {
  constructor(scene) {
    super(scene);
    this.shapeType = 'conicalSpiral';
  }

  /**
   * Generates a conical spiral
   * @param {Object} params - Generation parameters
   */
  generate(params) {
    const {
      centerPoint = new THREE.Vector3(DEFAULTS.SPIRAL.CENTER.x, DEFAULTS.SPIRAL.CENTER.y, DEFAULTS.SPIRAL.CENTER.z),
      startPoint = new THREE.Vector3(DEFAULTS.SPIRAL.START.x, DEFAULTS.SPIRAL.START.y, DEFAULTS.SPIRAL.START.z),
      direction = DEFAULTS.SPIRAL.DIRECTION,
      segments = DEFAULTS.CONICAL_SPIRAL.SEGMENTS,
      turns = DEFAULTS.SPIRAL.TURNS,
      isUpright = DEFAULTS.CONICAL_SPIRAL.ORIENTATION === 'upright',
      height = DEFAULTS.CONICAL_SPIRAL.HEIGHT,
      startFromCenter = DEFAULTS.CONICAL_SPIRAL.START_POINT === 'center',
      planeAngle = 0,
      planeAxis = 'x'
    } = params;

    this.clearPoints();

    // Create center point
    this.centerPoint = this.createSphere(centerPoint, COLORS.CENTER);
    
    // Create start point
    const startSphere = this.createSphere(startPoint, COLORS.POINT);
    this.allPoints.push(startSphere);

    // Calculate spiral parameters
    const startRadius = new THREE.Vector2(
      startPoint.x - centerPoint.x,
      startPoint.z - centerPoint.z
    ).length();
    const heightDirection = isUpright ? 1 : -1;

    // Calculate total length along the spiral
    const totalLength = Math.sqrt(Math.pow(startRadius, 2) + Math.pow(height, 2)) * turns;
    const segmentLength = totalLength / (segments - 1);

    // Calculate the initial angle of the start point
    const initialAngle = Math.atan2(
      startPoint.z - centerPoint.z,
      startPoint.x - centerPoint.x
    );

    // Generate spiral points
    const spiralPoints = this.generateConicalSpiralPoints({
      centerPoint,
      startPoint,
      startRadius,
      initialAngle,
      direction,
      totalLength,
      segmentLength,
      height,
      heightDirection,
      startFromCenter
    });

    // Apply plane rotation
    this.applyPlaneRotation(spiralPoints, centerPoint, planeAngle, planeAxis);

    // Create spheres for the rotated points
    spiralPoints.forEach((point) => {
      const sphere = this.createSphere(point, COLORS.POINT);
      this.allPoints.push(sphere);
    });
  }

  /**
   * Generates the conical spiral points
   * @param {Object} params - Spiral parameters
   * @returns {THREE.Vector3[]} Array of spiral points
   */
  generateConicalSpiralPoints(params) {
    const {
      centerPoint,
      startPoint,
      startRadius,
      initialAngle,
      direction,
      totalLength,
      segmentLength,
      height,
      heightDirection,
      startFromCenter
    } = params;

    const spiralPoints = [];
    let currentLength = 0;
    let theta = 0;

    while (currentLength < totalLength) {
      const t = currentLength / totalLength;
      const radius = startRadius * (1 - t); // Linear interpolation from startRadius to 0
      const currentHeight = t * height * heightDirection;

      // Calculate position relative to the center point
      const currentAngle = initialAngle + (direction === 'clockwise' ? -theta : theta);
      const x = centerPoint.x + radius * Math.cos(currentAngle);
      const z = centerPoint.z + radius * Math.sin(currentAngle);
      let y;

      if (startFromCenter) {
        y = centerPoint.y + currentHeight;
      } else {
        y = startPoint.y + currentHeight;
      }

      spiralPoints.push(new THREE.Vector3(x, y, z));

      currentLength += segmentLength;

      // Increment theta based on the next arc length
      if (radius > 0) {
        theta += segmentLength / radius;
      }
    }

    return spiralPoints;
  }

  /**
   * Validates conical spiral parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result
   */
  validateInput(params) {
    const baseValidation = super.validateInput(params);
    if (!baseValidation.valid) return baseValidation;

    const { height } = params;

    if (!height || height <= 0 || height > 200) {
      return { valid: false, error: 'Height must be between 0 and 200' };
    }

    return { valid: true, error: null };
  }
}