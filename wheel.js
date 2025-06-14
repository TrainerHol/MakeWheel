// This file now serves as a compatibility wrapper for the refactored modules
// It re-exports the shape classes to maintain backward compatibility

import { Wheel as WheelShape } from './modules/shapes/Wheel.js';
import { Spiral } from './modules/shapes/Spiral.js';
import { ConicalSpiral } from './modules/shapes/ConicalSpiral.js';
import { SphericalSpiral } from './modules/shapes/SphericalSpiral.js';
import { CylinderSpiral } from './modules/shapes/CylinderSpiral.js';
import { Grid } from './modules/shapes/Grid.js';

/**
 * Legacy Wheel class that provides backward compatibility
 * by combining all shape types into a single class
 */
export class Wheel {
  constructor(scene) {
    this.scene = scene;
    
    // Initialize all shape instances
    this.wheelShape = new WheelShape(scene);
    this.spiralShape = new Spiral(scene);
    this.conicalSpiralShape = new ConicalSpiral(scene);
    this.sphericalSpiralShape = new SphericalSpiral(scene);
    this.cylinderSpiralShape = new CylinderSpiral(scene);
    this.gridShape = new Grid(scene);
    
    // Current active shape
    this.currentShape = this.wheelShape;
    
    // Legacy properties for backward compatibility
    this.point1 = null;
    this.point2 = null;
    this.centerPoint = null;
    this.pairPoints = [];
    this.segmentPoints = [];
    this.allPoints = [];
    this.shapeType = "wheel";
    this.lines = [];
  }

  // Legacy method mappings
  generatePoints(point1Coords, point2Coords, repetitions, segments, planeAngle) {
    this.currentShape = this.wheelShape;
    this.shapeType = "wheel";
    this.wheelShape.generate({
      point1Coords,
      point2Coords,
      repetitions,
      segments,
      planeAngle
    });
    this.syncProperties();
  }

  generateSpiral(centerPoint, startPoint, direction, segments, turns, planeAngle, planeAxis) {
    this.currentShape = this.spiralShape;
    this.shapeType = "spiral";
    this.spiralShape.generate({
      centerPoint,
      startPoint,
      direction,
      segments,
      turns,
      planeAngle,
      planeAxis
    });
    this.syncProperties();
  }

  generateConicalSpiral(centerPoint, startPoint, direction, segments, turns, isUpright, height, startFromCenter, planeAngle, planeAxis) {
    this.currentShape = this.conicalSpiralShape;
    this.shapeType = "conicalSpiral";
    this.conicalSpiralShape.generate({
      centerPoint,
      startPoint,
      direction,
      segments,
      turns,
      isUpright,
      height,
      startFromCenter,
      planeAngle,
      planeAxis
    });
    this.syncProperties();
  }

  generateSphericalSpiral(centerPoint, radius, direction, segments, turns, startAngle, endAngle, planeAngle, planeAxis) {
    this.currentShape = this.sphericalSpiralShape;
    this.shapeType = "sphericalSpiral";
    this.sphericalSpiralShape.generate({
      centerPoint,
      radius,
      direction,
      segments,
      turns,
      startAngle,
      endAngle,
      planeAngle,
      planeAxis
    });
    this.syncProperties();
  }

  generateGrid(centerPoint, rows, columns, spacing, stepAmount, floors) {
    this.currentShape = this.gridShape;
    this.shapeType = "grid";
    this.gridShape.generate({
      centerPoint,
      rows,
      columns,
      spacing,
      stepAmount,
      floors
    });
    this.syncProperties();
  }

  generateCylinderSpiral(center, radius, height, segments, turns, direction, planeAngle, planeAxis) {
    this.currentShape = this.cylinderSpiralShape;
    this.shapeType = "cylinderSpiral";
    this.cylinderSpiralShape.generate({
      center,
      radius,
      height,
      segments,
      turns,
      direction,
      planeAngle,
      planeAxis
    });
    this.syncProperties();
  }

  // Sync properties from current shape to maintain backward compatibility
  syncProperties() {
    this.allPoints = this.currentShape.getPoints();
    this.centerPoint = this.currentShape.centerPoint;
    this.lines = this.currentShape.lines || [];
    
    // Sync wheel-specific properties
    if (this.currentShape === this.wheelShape) {
      this.point1 = this.wheelShape.point1;
      this.point2 = this.wheelShape.point2;
      this.pairPoints = this.wheelShape.pairPoints;
      this.segmentPoints = this.wheelShape.segmentPoints;
    } else {
      this.point1 = null;
      this.point2 = null;
      this.pairPoints = [];
      this.segmentPoints = [];
    }
  }

  clearPoints() {
    // Clear all shapes
    this.wheelShape.clearPoints();
    this.spiralShape.clearPoints();
    this.conicalSpiralShape.clearPoints();
    this.sphericalSpiralShape.clearPoints();
    this.cylinderSpiralShape.clearPoints();
    this.gridShape.clearPoints();
    
    // Reset legacy properties
    this.point1 = null;
    this.point2 = null;
    this.centerPoint = null;
    this.pairPoints = [];
    this.segmentPoints = [];
    this.allPoints = [];
    this.lines = [];
  }

  highlightPoint(index) {
    if (this.currentShape) {
      this.currentShape.highlightPoint(index);
    }
  }

  resetPointColor(index) {
    if (this.currentShape) {
      this.currentShape.resetPointColor(index);
    }
  }

  // Legacy helper methods (maintained for compatibility)
  createSphere(position, color, size = 1) {
    const geometry = new THREE.SphereGeometry(size);
    const material = new THREE.MeshPhongMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    this.scene.add(sphere);
    return sphere;
  }

  applyPlaneRotation(points, centerPoint, planeAngle, planeAxis) {
    if (planeAngle === 0) return;

    const rotationMatrix = new THREE.Matrix4();
    const angleRad = THREE.MathUtils.degToRad(planeAngle);

    switch (planeAxis) {
      case "x":
        rotationMatrix.makeRotationX(angleRad);
        break;
      case "y":
        rotationMatrix.makeRotationY(angleRad);
        break;
      case "z":
        rotationMatrix.makeRotationZ(angleRad);
        break;
      default:
        rotationMatrix.makeRotationX(angleRad);
    }

    points.forEach((point) => {
      // Handle both Vector3 objects and Mesh objects
      const pointPosition = point.position || point;
      
      pointPosition.sub(centerPoint);
      pointPosition.applyMatrix4(rotationMatrix);
      pointPosition.add(centerPoint);
    });
  }

  // Legacy grid path generation (maintained for compatibility)
  generateGridPath(rows, columns, floors, startPoint = null) {
    const totalCells = rows * columns * floors;
    const path = [];
    const visited = new Set();

    let current = startPoint || [0, 0, 0];

    const directions = [
      [0, 1, 0],
      [1, 0, 0],
      [0, -1, 0],
      [-1, 0, 0],
    ];

    while (path.length < totalCells) {
      path.push(current);
      visited.add(`${current[0]},${current[1]},${current[2]}`);

      let nextCell = null;
      for (const [dx, dy, dz] of directions) {
        const next = [
          Math.min(Math.max(current[0] + dx, 0), rows - 1),
          Math.min(Math.max(current[1] + dy, 0), columns - 1),
          current[2]
        ];
        if (!visited.has(`${next[0]},${next[1]},${next[2]}`)) {
          nextCell = next;
          break;
        }
      }

      if (nextCell) {
        current = nextCell;
      } else {
        if (current[2] < floors - 1) {
          current = [current[0], current[1], current[2] + 1];
        } else {
          break;
        }
      }
    }

    return path;
  }
}