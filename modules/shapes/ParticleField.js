import { BaseShape } from '../base/BaseShape.js';
import { COLORS, DEFAULTS } from '../utils/constants.js';

/**
 * Generates random points inside a rectangular volume.
 */
export class ParticleField extends BaseShape {
  constructor(scene) {
    super(scene);
    this.shapeType = 'particleField';
    this.boundaryBox = null;
    this.generationWarning = '';
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
      options = {},
    } = params;
    const {
      connected = false,
      jumpTemplateMetrics = null,
      randomItemRotation = false,
    } = options;

    const validation = this.validateInput({ width, depth, height, count, connected, jumpTemplateMetrics });
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.clearPoints();
    this.generationWarning = '';
    this.centerPoint = this.createSphere(centerPoint, COLORS.CENTER, 0.6);
    this.createBoundaryBox(centerPoint, width, depth, height);

    if (connected) {
      this.generateConnectedChain(centerPoint, width, depth, height, count, jumpTemplateMetrics, randomItemRotation);
      return;
    }

    for (let index = 0; index < count; index++) {
      const position = new THREE.Vector3(
        centerPoint.x + (Math.random() - 0.5) * width,
        centerPoint.y + (Math.random() - 0.5) * height,
        centerPoint.z + (Math.random() - 0.5) * depth
      );
      this.addParticlePoint(position, randomItemRotation);
    }
  }

  generateConnectedChain(centerPoint, width, depth, height, count, jumpTemplateMetrics, randomItemRotation) {
    const bounds = this.createBounds(centerPoint, width, depth, height);
    const maxAttempts = count > 500 ? 12 : count > 150 ? 24 : 60;
    let bestChain = [];
    let bestScore = -Infinity;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const chain = this.buildChainAttempt(bounds, count, jumpTemplateMetrics);
      const score = this.scoreChain(chain, bounds, count);

      if (score > bestScore) {
        bestChain = chain;
        bestScore = score;
      }

      if (chain.length === count && this.isInTopBand(chain[chain.length - 1], bounds)) {
        bestChain = chain;
        break;
      }
    }

    bestChain.forEach((position, index) => {
      const point = this.addParticlePoint(position, randomItemRotation);
      if (index > 0) {
        this.createLine(bestChain[index - 1], position, COLORS.PARTICLE_FIELD);
      }
      point.userData.chainIndex = index;
    });

    if (bestChain.length < count) {
      this.generationWarning = `Generated ${bestChain.length} of ${count} points. The jump template limits and box size prevented more connected points.`;
    } else if (!this.isInTopBand(bestChain[bestChain.length - 1], bounds)) {
      this.generationWarning = `Generated ${count} points, but the final point did not reach the top band of the box.`;
    }
  }

  buildChainAttempt(bounds, count, jumpTemplateMetrics) {
    const start = new THREE.Vector3(
      bounds.center.x,
      bounds.minY,
      bounds.center.z
    );
    const chain = [start];

    for (let index = 1; index < count; index++) {
      const previous = chain[chain.length - 1];
      const next = this.chooseNextConnectedPoint(previous, bounds, jumpTemplateMetrics, index, count);

      if (!next) {
        break;
      }

      chain.push(next);
    }

    return chain;
  }

  chooseNextConnectedPoint(previous, bounds, jumpTemplateMetrics, index, count) {
    const candidateCount = 48;
    const targetProgress = count <= 1 ? 1 : index / (count - 1);
    const targetY = bounds.minY + bounds.height * targetProgress;
    let bestCandidate = null;
    let bestScore = -Infinity;

    for (let attempt = 0; attempt < candidateCount; attempt++) {
      const candidate = this.createStepCandidate(previous, bounds, jumpTemplateMetrics, targetY);
      if (!candidate || !this.isInsideBounds(candidate, bounds)) {
        continue;
      }

      const flatDistance = Math.hypot(candidate.x - previous.x, candidate.z - previous.z);
      const yDistance = Math.abs(candidate.y - targetY);
      const upwardProgress = candidate.y - previous.y;
      const score =
        -yDistance +
        flatDistance * 0.04 +
        upwardProgress * 0.08 +
        Math.random() * 0.05;

      if (score > bestScore) {
        bestCandidate = candidate;
        bestScore = score;
      }
    }

    return bestCandidate;
  }

  createStepCandidate(previous, bounds, jumpTemplateMetrics, targetY) {
    const { dx, dz } = this.createFlatOffset(jumpTemplateMetrics.flatMax, bounds.width, bounds.depth);
    const dy = this.createHeightOffset(previous.y, bounds, jumpTemplateMetrics.heightMax, targetY);
    const candidate = new THREE.Vector3(
      previous.x + dx,
      previous.y + dy,
      previous.z + dz
    );

    if (Math.hypot(dx, dz) > jumpTemplateMetrics.flatMax + 0.0001) {
      return null;
    }

    if (Math.abs(dy) > jumpTemplateMetrics.heightMax + 0.0001) {
      return null;
    }

    return candidate;
  }

  createFlatOffset(flatMax, width, depth) {
    if (width === 0 && depth === 0) {
      return { dx: 0, dz: 0 };
    }

    if (width === 0) {
      return { dx: 0, dz: this.randomSigned(flatMax) };
    }

    if (depth === 0) {
      return { dx: this.randomSigned(flatMax), dz: 0 };
    }

    const radius = Math.sqrt(Math.random()) * flatMax;
    const angle = Math.random() * Math.PI * 2;
    return {
      dx: Math.cos(angle) * radius,
      dz: Math.sin(angle) * radius,
    };
  }

  createHeightOffset(previousY, bounds, heightMax, targetY) {
    if (bounds.height === 0 || heightMax === 0) {
      return 0;
    }

    const minOffset = Math.max(-heightMax, bounds.minY - previousY);
    const maxOffset = Math.min(heightMax, bounds.maxY - previousY);
    if (minOffset > maxOffset) {
      return 0;
    }

    if (Math.random() < 0.25) {
      return minOffset + Math.random() * (maxOffset - minOffset);
    }

    const desiredOffset = targetY - previousY;
    const noisyOffset = desiredOffset + this.randomSigned(heightMax * 0.45);
    return this.clamp(noisyOffset, minOffset, maxOffset);
  }

  addParticlePoint(position, randomItemRotation) {
    const sphere = this.createSphere(position, COLORS.PARTICLE_FIELD, 0.6);
    sphere.userData = {
      ...sphere.userData,
      particleRandomRotation: Boolean(randomItemRotation),
    };

    if (randomItemRotation) {
      sphere.userData.particleYaw = Math.random() * Math.PI * 2;
    }

    this.allPoints.push(sphere);
    return sphere;
  }

  createBounds(centerPoint, width, depth, height) {
    return {
      center: centerPoint,
      width,
      depth,
      height,
      minX: centerPoint.x - width / 2,
      maxX: centerPoint.x + width / 2,
      minY: centerPoint.y - height / 2,
      maxY: centerPoint.y + height / 2,
      minZ: centerPoint.z - depth / 2,
      maxZ: centerPoint.z + depth / 2,
    };
  }

  isInsideBounds(point, bounds) {
    const epsilon = 0.0001;
    return (
      point.x >= bounds.minX - epsilon &&
      point.x <= bounds.maxX + epsilon &&
      point.y >= bounds.minY - epsilon &&
      point.y <= bounds.maxY + epsilon &&
      point.z >= bounds.minZ - epsilon &&
      point.z <= bounds.maxZ + epsilon
    );
  }

  isInTopBand(point, bounds) {
    if (!point) return false;
    if (bounds.height === 0) return true;
    return point.y >= bounds.minY + bounds.height * 0.8;
  }

  scoreChain(chain, bounds, targetCount) {
    if (!chain.length) return -Infinity;
    const finalPoint = chain[chain.length - 1];
    const lengthScore = chain.length / targetCount;
    const heightScore = bounds.height === 0
      ? 1
      : (finalPoint.y - bounds.minY) / bounds.height;
    return lengthScore * 100 + heightScore * 10;
  }

  randomSigned(amount) {
    return (Math.random() * 2 - 1) * amount;
  }

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
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
    this.generationWarning = '';
  }

  validateInput(params) {
    const { width, depth, height, count, connected, jumpTemplateMetrics } = params;

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

    if (connected) {
      if (!jumpTemplateMetrics) {
        return { valid: false, error: 'Upload a Particle Field jump template before generating a connected chain' };
      }

      if (!Number.isFinite(jumpTemplateMetrics.flatMax) || jumpTemplateMetrics.flatMax <= 0) {
        return { valid: false, error: 'Jump template flat distance must be greater than 0' };
      }

      if (!Number.isFinite(jumpTemplateMetrics.heightMax) || jumpTemplateMetrics.heightMax < 0) {
        return { valid: false, error: 'Jump template height distance must be 0 or greater' };
      }

      if (count > 1 && width === 0 && depth === 0) {
        return { valid: false, error: 'Connected chains need box X size or depth greater than 0' };
      }
    }

    return { valid: true, error: null };
  }
}
