import { Spiral } from './Spiral.js';
import { COLORS, DEFAULTS, ANIMATION } from '../utils/constants.js';

/**
 * Generates spherical spiral shapes (spirals on the surface of a sphere)
 */
export class SphericalSpiral extends Spiral {
  constructor(scene) {
    super(scene);
    this.shapeType = 'sphericalSpiral';
  }

  /**
   * Generates a spherical spiral
   * @param {Object} params - Generation parameters
   */
  generate(params) {
    const {
      centerPoint = new THREE.Vector3(DEFAULTS.SPIRAL.CENTER.x, DEFAULTS.SPIRAL.CENTER.y, DEFAULTS.SPIRAL.CENTER.z),
      radius = DEFAULTS.SPHERICAL_SPIRAL.RADIUS,
      direction = DEFAULTS.SPIRAL.DIRECTION,
      segments = DEFAULTS.SPIRAL.SEGMENTS,
      turns = DEFAULTS.SPIRAL.TURNS,
      startAngle = DEFAULTS.SPHERICAL_SPIRAL.START_ANGLE,
      endAngle = DEFAULTS.SPHERICAL_SPIRAL.END_ANGLE,
      planeAngle = 0,
      planeAxis = 'x'
    } = params;

    this.clearPoints();

    // Create center point
    this.centerPoint = this.createSphere(centerPoint, COLORS.CENTER);

    // Calculate spiral parameters
    const totalAngle = turns * 2 * Math.PI;
    const phiStart = THREE.MathUtils.degToRad(startAngle);
    const phiEnd = THREE.MathUtils.degToRad(endAngle);
    const phiLength = phiEnd - phiStart;

    // Define the parametric function for the spherical spiral
    const spiralFunction = (t) => {
      const theta = t * totalAngle;
      const phi = phiStart + t * phiLength;
      
      const adjustedTheta = direction === 'clockwise' ? -theta : theta;
      
      const x = centerPoint.x + radius * Math.sin(phi) * Math.cos(adjustedTheta);
      const y = centerPoint.y + radius * Math.cos(phi);
      const z = centerPoint.z + radius * Math.sin(phi) * Math.sin(adjustedTheta);
      
      return new THREE.Vector3(x, y, z);
    };

    // Get evenly distributed points along the spiral
    const spiralPoints = this.getEvenlyDistributedPoints(spiralFunction, segments);

    // Apply plane rotation
    this.applyPlaneRotation(spiralPoints, centerPoint, planeAngle, planeAxis);

    // Create spheres for the rotated points
    spiralPoints.forEach((point) => {
      const sphere = this.createSphere(point, COLORS.POINT);
      this.allPoints.push(sphere);
    });
  }

  /**
   * Calculates a point on the spherical spiral
   * @param {Object} params - Calculation parameters
   * @returns {THREE.Vector3} Point on the spiral
   */
  calculateSpiralPoint(params) {
    const { centerPoint, radius, theta, phi } = params;
    
    const x = centerPoint.x + radius * Math.sin(phi) * Math.cos(theta);
    const y = centerPoint.y + radius * Math.cos(phi);
    const z = centerPoint.z + radius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z);
  }

  /**
   * Validates spherical spiral parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result
   */
  validateInput(params) {
    const { centerPoint, radius, segments, turns, startAngle, endAngle } = params;

    if (!centerPoint) {
      return { valid: false, error: 'Center point is required' };
    }

    if (!radius || radius <= 0 || radius > 200) {
      return { valid: false, error: 'Radius must be between 0 and 200' };
    }

    if (segments < 1 || segments > 200) {
      return { valid: false, error: 'Segments must be between 1 and 200' };
    }

    if (turns < 0.1 || turns > 20) {
      return { valid: false, error: 'Turns must be between 0.1 and 20' };
    }

    if (startAngle < 0 || startAngle > 360) {
      return { valid: false, error: 'Start angle must be between 0 and 360' };
    }

    if (endAngle < 0 || endAngle > 360) {
      return { valid: false, error: 'End angle must be between 0 and 360' };
    }

    if (startAngle === endAngle) {
      return { valid: false, error: 'Start and end angles must be different' };
    }

    return { valid: true, error: null };
  }
}