import { BaseShape } from '../base/BaseShape.js';
import { COLORS, DEFAULTS, ANIMATION } from '../utils/constants.js';

/**
 * Base class for spiral generation with common spiral functionality
 */
export class Spiral extends BaseShape {
  constructor(scene) {
    super(scene);
    this.shapeType = 'spiral';
  }

  /**
   * Generates a flat spiral
   * @param {Object} params - Generation parameters
   */
  generate(params) {
    const {
      centerPoint = new THREE.Vector3(DEFAULTS.SPIRAL.CENTER.x, DEFAULTS.SPIRAL.CENTER.y, DEFAULTS.SPIRAL.CENTER.z),
      startPoint = new THREE.Vector3(DEFAULTS.SPIRAL.START.x, DEFAULTS.SPIRAL.START.y, DEFAULTS.SPIRAL.START.z),
      direction = DEFAULTS.SPIRAL.DIRECTION,
      segments = DEFAULTS.SPIRAL.SEGMENTS,
      turns = DEFAULTS.SPIRAL.TURNS,
      planeAngle = 0,
      planeAxis = 'x'
    } = params;

    this.clearPoints();

    // Create center point
    this.centerPoint = this.createSphere(centerPoint, COLORS.CENTER);
    
    // Store start point for calculations (no visual sphere, will be part of spiral)
    this.startPoint = startPoint;

    // Calculate spiral parameters
    const startRadius = startPoint.distanceTo(centerPoint);
    const totalLength = (startRadius * turns * 2 * Math.PI) / 2; // Approximate spiral length
    const segmentLength = totalLength / segments;

    const a = startRadius / (turns * 2 * Math.PI); // Spiral constant
    const maxTheta = turns * 2 * Math.PI;

    // Calculate the initial angle of the start point relative to center
    const initialAngle = Math.atan2(
      startPoint.z - centerPoint.z,
      startPoint.x - centerPoint.x
    );

    // Generate spiral points
    const spiralPoints = this.generateSpiralPoints({
      centerPoint,
      initialAngle,
      direction,
      a,
      maxTheta,
      totalLength,
      segmentLength
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
   * Generates the spiral points based on parameters
   * @param {Object} params - Spiral parameters
   * @returns {THREE.Vector3[]} Array of spiral points
   */
  generateSpiralPoints(params) {
    const {
      centerPoint,
      initialAngle,
      direction,
      a,
      maxTheta,
      totalLength,
      segmentLength
    } = params;

    const spiralPoints = [];
    let currentLength = 0;
    let theta = 0;

    while (currentLength < totalLength && theta <= maxTheta) {
      const radius = a * theta;

      // Create point in the XZ plane relative to center
      const angle = initialAngle + (direction === 'clockwise' ? -theta : theta);
      const x = centerPoint.x + radius * Math.cos(angle);
      const z = centerPoint.z + radius * Math.sin(angle);
      const y = centerPoint.y; // Keep at center height initially

      spiralPoints.push(new THREE.Vector3(x, y, z));

      currentLength += segmentLength;
      theta = Math.sqrt((currentLength * 2) / a);
    }

    return spiralPoints;
  }

  /**
   * Validates spiral generation parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result
   */
  validateInput(params) {
    const { centerPoint, startPoint, segments, turns } = params;

    if (!centerPoint || !startPoint) {
      return { valid: false, error: 'Center and start points are required' };
    }

    if (centerPoint.equals(startPoint)) {
      return { valid: false, error: 'Start point must be different from center point' };
    }

    if (segments < 1 || segments > 200) {
      return { valid: false, error: 'Segments must be between 1 and 200' };
    }

    if (turns < 0.1 || turns > 20) {
      return { valid: false, error: 'Turns must be between 0.1 and 20' };
    }

    return { valid: true, error: null };
  }

  /**
   * Calculates the total length of a spiral
   * @param {number} startRadius - Starting radius
   * @param {number} turns - Number of turns
   * @returns {number} Total length
   */
  calculateSpiralLength(startRadius, turns) {
    // This is an approximation for an Archimedean spiral
    return (startRadius * turns * 2 * Math.PI) / 2;
  }

  /**
   * Gets evenly distributed points along a parametric curve
   * @param {Function} curveFunction - Function that returns a point for parameter t
   * @param {number} segments - Number of segments
   * @returns {THREE.Vector3[]} Array of points
   */
  getEvenlyDistributedPoints(curveFunction, segments) {
    // First, sample the curve at high resolution
    const sampleCount = segments * 10;
    const samples = [];
    let totalLength = 0;

    for (let i = 0; i <= sampleCount; i++) {
      const t = i / sampleCount;
      const point = curveFunction(t);
      samples.push({ t, point, length: totalLength });
      
      if (i > 0) {
        totalLength += point.distanceTo(samples[i - 1].point);
        samples[i].length = totalLength;
      }
    }

    // Now find evenly spaced points
    const points = [];
    const segmentLength = totalLength / segments;
    let currentLength = 0;
    let sampleIndex = 0;

    for (let i = 0; i <= segments; i++) {
      const targetLength = i * segmentLength;

      // Find the sample indices that bracket the target length
      while (sampleIndex < samples.length - 1 && samples[sampleIndex + 1].length < targetLength) {
        sampleIndex++;
      }

      if (sampleIndex >= samples.length - 1) {
        points.push(samples[samples.length - 1].point.clone());
      } else {
        // Interpolate between samples
        const sample1 = samples[sampleIndex];
        const sample2 = samples[sampleIndex + 1];
        const alpha = (targetLength - sample1.length) / (sample2.length - sample1.length);
        
        const point = new THREE.Vector3().lerpVectors(
          sample1.point,
          sample2.point,
          alpha
        );
        points.push(point);
      }
    }

    return points;
  }
}