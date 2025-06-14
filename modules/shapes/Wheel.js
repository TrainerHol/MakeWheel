import { BaseShape } from '../base/BaseShape.js';
import { COLORS, DEFAULTS } from '../utils/constants.js';

/**
 * Generates wheel/circular patterns with points distributed around a center
 */
export class Wheel extends BaseShape {
  constructor(scene) {
    super(scene);
    this.shapeType = 'wheel';
    this.point1 = null;
    this.point2 = null;
    this.pairPoints = [];
    this.segmentPoints = [];
  }

  /**
   * Generates wheel points based on two reference points
   * @param {Object} params - Generation parameters
   * @param {THREE.Vector3} params.point1Coords - First point coordinates
   * @param {THREE.Vector3} params.point2Coords - Second point coordinates
   * @param {number} params.repetitions - Number of points around the wheel
   * @param {number} params.segments - Number of segments between center and edge
   * @param {number} params.planeAngle - Rotation angle of the plane
   */
  generate(params) {
    const {
      point1Coords = new THREE.Vector3(DEFAULTS.WHEEL.POINT1.x, DEFAULTS.WHEEL.POINT1.y, DEFAULTS.WHEEL.POINT1.z),
      point2Coords = new THREE.Vector3(DEFAULTS.WHEEL.POINT2.x, DEFAULTS.WHEEL.POINT2.y, DEFAULTS.WHEEL.POINT2.z),
      repetitions = DEFAULTS.WHEEL.REPETITIONS,
      segments = DEFAULTS.WHEEL.SEGMENTS,
      planeAngle = 0
    } = params;

    this.clearPoints();
    this.pairPoints = [];
    this.segmentPoints = [];

    // Create the two reference points
    this.point1 = this.createSphere(point1Coords, COLORS.POINT);
    this.point2 = this.createSphere(point2Coords, COLORS.POINT);
    this.allPoints.push(this.point1, this.point2);

    // Calculate center point (midpoint between point1 and point2)
    const midpoint = new THREE.Vector3().addVectors(point1Coords, point2Coords).multiplyScalar(0.5);
    this.centerPoint = this.createSphere(midpoint, COLORS.CENTER);
    this.allPoints.push(this.centerPoint);

    // Calculate the axis and perpendicular vector
    const axis = new THREE.Vector3().subVectors(point2Coords, point1Coords).normalize();
    let perpVector = new THREE.Vector3(0, 1, 0);
    if (Math.abs(axis.dot(perpVector)) > 0.9) {
      perpVector.set(1, 0, 0);
    }
    perpVector.cross(axis).normalize();

    // Calculate radius and initial vector
    const radius = point1Coords.distanceTo(midpoint);
    const initialVector = new THREE.Vector3().subVectors(point1Coords, midpoint).normalize();

    // Apply plane rotation
    const planeNormal = new THREE.Vector3().crossVectors(axis, perpVector);
    const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, THREE.MathUtils.degToRad(planeAngle));
    planeNormal.applyMatrix4(rotationMatrix);

    // Generate points around the wheel
    for (let i = 0; i < repetitions; i++) {
      const angle = (2 * Math.PI * i) / repetitions;
      const rotatedVector = new THREE.Vector3()
        .copy(initialVector)
        .applyAxisAngle(planeNormal, angle)
        .multiplyScalar(radius);

      const newPoint = new THREE.Vector3().addVectors(midpoint, rotatedVector);
      const newPointSphere = this.createSphere(newPoint, COLORS.POINT);
      this.pairPoints.push(newPointSphere);
      this.allPoints.push(newPointSphere);

      // Generate segment points between center and edge
      if (segments > 0) {
        const segmentStep = rotatedVector.clone().divideScalar(segments + 1);

        for (let j = 1; j <= segments; j++) {
          const segmentPoint = midpoint.clone().add(segmentStep.clone().multiplyScalar(j));
          const newSegmentPoint = this.createSphere(segmentPoint, COLORS.SEGMENT, 0.5);
          this.segmentPoints.push(newSegmentPoint);
          this.allPoints.push(newSegmentPoint);
        }
      }
    }
  }

  /**
   * Gets the original color for a point based on its type
   * @param {number} index - Index of the point
   * @returns {number} Hex color value
   */
  getOriginalPointColor(index) {
    // First two points are the reference points (red)
    if (index < 2) return COLORS.POINT;
    // Third point is the center (green)
    if (index === 2) return COLORS.CENTER;
    // Points after center up to pairPoints length are edge points (red)
    if (index < 3 + this.pairPoints.length) return COLORS.POINT;
    // Remaining points are segment points (yellow)
    return COLORS.SEGMENT;
  }

  /**
   * Validates wheel generation parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result
   */
  validateInput(params) {
    const { point1Coords, point2Coords, repetitions, segments } = params;

    if (!point1Coords || !point2Coords) {
      return { valid: false, error: 'Both point coordinates are required' };
    }

    if (point1Coords.equals(point2Coords)) {
      return { valid: false, error: 'Points must be at different locations' };
    }

    if (repetitions < 1 || repetitions > 100) {
      return { valid: false, error: 'Repetitions must be between 1 and 100' };
    }

    if (segments < 0 || segments > 50) {
      return { valid: false, error: 'Segments must be between 0 and 50' };
    }

    return { valid: true, error: null };
  }

  /**
   * Clears wheel-specific arrays when clearing points
   */
  clearPoints() {
    super.clearPoints();
    this.pairPoints = [];
    this.segmentPoints = [];
    this.point1 = null;
    this.point2 = null;
  }
}