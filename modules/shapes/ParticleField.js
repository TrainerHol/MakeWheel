import { BaseShape } from '../base/BaseShape.js';
import { COLORS, DEFAULTS } from '../utils/constants.js';
import { createRandomGenerator } from '../utils/randomization.js';

/**
 * Generates randomly scattered points inside a rectangular volume.
 */
export class ParticleField extends BaseShape {
  constructor(scene) {
    super(scene);
    this.shapeType = 'particleField';
    this.boundaryBox = null;
  }

  generate(params) {
    const {
      centerPoint = new THREE.Vector3(
        DEFAULTS.PARTICLE_FIELD.CENTER.x,
        DEFAULTS.PARTICLE_FIELD.CENTER.y,
        DEFAULTS.PARTICLE_FIELD.CENTER.z
      ),
      width = DEFAULTS.PARTICLE_FIELD.WIDTH,
      depth = DEFAULTS.PARTICLE_FIELD.DEPTH,
      height = DEFAULTS.PARTICLE_FIELD.HEIGHT,
      count = DEFAULTS.PARTICLE_FIELD.COUNT,
      seed = '',
    } = params;

    const validation = this.validateInput({ width, depth, height, count });
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.clearPoints();
    this.centerPoint = this.createSphere(centerPoint, COLORS.CENTER, 0.6);
    this.createBoundaryBox(centerPoint, width, depth, height);

    const random = createRandomGenerator(seed);
    for (let index = 0; index < count; index++) {
      const position = new THREE.Vector3(
        centerPoint.x + (random() - 0.5) * width,
        centerPoint.y + (random() - 0.5) * height,
        centerPoint.z + (random() - 0.5) * depth
      );
      const sphere = this.createSphere(position, COLORS.PARTICLE_FIELD, 0.6);
      this.allPoints.push(sphere);
    }
  }

  createBoundaryBox(centerPoint, width, depth, height) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color: COLORS.TEXT });
    this.boundaryBox = new THREE.LineSegments(edges, material);
    this.boundaryBox.position.copy(centerPoint);
    this.scene.add(this.boundaryBox);
    this.lines.push(this.boundaryBox);
  }

  clearPoints() {
    super.clearPoints();
    this.boundaryBox = null;
  }

  validateInput(params) {
    const { width, depth, height, count } = params;

    if (width < 0 || width > 500) {
      return { valid: false, error: 'Width must be between 0 and 500' };
    }

    if (depth < 0 || depth > 500) {
      return { valid: false, error: 'Depth must be between 0 and 500' };
    }

    if (height < 0 || height > 500) {
      return { valid: false, error: 'Height must be between 0 and 500' };
    }

    if (width === 0 && depth === 0 && height === 0) {
      return { valid: false, error: 'At least one dimension must be greater than 0' };
    }

    if (count < 1 || count > 2000) {
      return { valid: false, error: 'Count must be between 1 and 2000' };
    }

    return { valid: true, error: null };
  }
}
