import { validateRange, validatePoint, validatePointsDifferent } from '../utils/validators.js';
import { DEFAULTS } from '../utils/constants.js';

/**
 * Handles form controls and generation for all shape types
 */
export class ShapeControllers {
  constructor(wheel, maze, maze3d) {
    this.wheel = wheel;
    this.maze = maze;
    this.maze3d = maze3d;
  }

  /**
   * Generate wheel shape from form inputs
   */
  generateWheel() {
    try {
      const point1Coords = new THREE.Vector3(
        parseFloat(document.getElementById("point1X").value),
        parseFloat(document.getElementById("point1Y").value),
        parseFloat(document.getElementById("point1Z").value)
      );
      const point2Coords = new THREE.Vector3(
        parseFloat(document.getElementById("point2X").value),
        parseFloat(document.getElementById("point2Y").value),
        parseFloat(document.getElementById("point2Z").value)
      );
      const repetitions = parseInt(document.getElementById("repetitions").value);
      const segments = parseInt(document.getElementById("segments").value);
      const planeAngle = parseFloat(document.getElementById("planeAngle").value);

      // Validate inputs
      validatePoint(point1Coords, "Point 1");
      validatePoint(point2Coords, "Point 2");
      validatePointsDifferent(point1Coords, point2Coords);
      validateRange(repetitions, 3, 100, "Repetitions");
      validateRange(segments, 0, 50, "Segments");
      validateRange(planeAngle, -360, 360, "Plane Angle");

      this.wheel.generatePoints(point1Coords, point2Coords, repetitions, segments, planeAngle);
      this.updateCount('Wheel', this.wheel.allPoints.length);
      return true;
    } catch (error) {
      alert(`Wheel Generation Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate spiral shape from form inputs
   */
  generateSpiral() {
    try {
      const centerPoint = new THREE.Vector3(
        parseFloat(document.getElementById("spiralCenterX").value),
        parseFloat(document.getElementById("spiralCenterY").value),
        parseFloat(document.getElementById("spiralCenterZ").value)
      );
      const startPoint = new THREE.Vector3(
        parseFloat(document.getElementById("spiralStartX").value),
        parseFloat(document.getElementById("spiralStartY").value),
        parseFloat(document.getElementById("spiralStartZ").value)
      );
      const direction = document.getElementById("spiralDirection").value;
      const segments = parseInt(document.getElementById("spiralSegments").value);
      const turns = parseFloat(document.getElementById("spiralTurns").value);
      const planeAngle = parseFloat(document.getElementById("spiralPlaneAngle").value);
      const planeAxis = document.getElementById("spiralPlaneAxis").value;

      // Validate inputs
      validatePoint(centerPoint, "Center Point");
      validatePoint(startPoint, "Start Point");
      validatePointsDifferent(centerPoint, startPoint);
      validateRange(segments, 10, 200, "Segments");
      validateRange(turns, 0.1, 20, "Turns");
      validateRange(planeAngle, -360, 360, "Plane Angle");

      this.wheel.generateSpiral(centerPoint, startPoint, direction, segments, turns, planeAngle, planeAxis);
      this.updateCount('Spiral', this.wheel.allPoints.length);
      return true;
    } catch (error) {
      alert(`Spiral Generation Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate conical spiral shape from form inputs
   */
  generateConicalSpiral() {
    try {
      const centerPoint = new THREE.Vector3(
        parseFloat(document.getElementById("conicalSpiralCenterX").value),
        parseFloat(document.getElementById("conicalSpiralCenterY").value),
        parseFloat(document.getElementById("conicalSpiralCenterZ").value)
      );
      const startPoint = new THREE.Vector3(
        parseFloat(document.getElementById("conicalSpiralStartX").value),
        parseFloat(document.getElementById("conicalSpiralStartY").value),
        parseFloat(document.getElementById("conicalSpiralStartZ").value)
      );
      const direction = document.getElementById("conicalSpiralDirection").value;
      const segments = parseInt(document.getElementById("conicalSpiralSegments").value);
      const turns = parseFloat(document.getElementById("conicalSpiralTurns").value);
      const isUpright = document.getElementById("conicalSpiralOrientation").value === "upright";
      const height = parseFloat(document.getElementById("conicalSpiralHeight").value);
      const startFromCenter = document.getElementById("conicalSpiralStartPoint").value === "center";
      const planeAngle = parseFloat(document.getElementById("conicalSpiralPlaneAngle").value);
      const planeAxis = document.getElementById("conicalSpiralPlaneAxis").value;

      // Validate inputs
      validatePoint(centerPoint, "Center Point");
      validatePoint(startPoint, "Start Point");
      validatePointsDifferent(centerPoint, startPoint);
      validateRange(segments, 10, 100, "Segments");
      validateRange(turns, 0.1, 20, "Turns");
      validateRange(height, 1, 200, "Height");
      validateRange(planeAngle, -360, 360, "Plane Angle");

      this.wheel.generateConicalSpiral(centerPoint, startPoint, direction, segments, turns, isUpright, height, startFromCenter, planeAngle, planeAxis);
      this.updateCount('ConicalSpiral', this.wheel.allPoints.length);
      return true;
    } catch (error) {
      alert(`Conical Spiral Generation Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate spherical spiral shape from form inputs
   */
  generateSphericalSpiral() {
    try {
      const centerPoint = new THREE.Vector3(
        parseFloat(document.getElementById("sphericalSpiralCenterX").value),
        parseFloat(document.getElementById("sphericalSpiralCenterY").value),
        parseFloat(document.getElementById("sphericalSpiralCenterZ").value)
      );
      const radius = parseFloat(document.getElementById("sphericalSpiralRadius").value);
      const direction = document.getElementById("sphericalSpiralDirection").value;
      const segments = parseInt(document.getElementById("sphericalSpiralSegments").value);
      const turns = parseFloat(document.getElementById("sphericalSpiralTurns").value);
      const startAngle = parseFloat(document.getElementById("sphericalSpiralStartAngle").value);
      const endAngle = parseFloat(document.getElementById("sphericalSpiralEndAngle").value);
      const planeAngle = parseFloat(document.getElementById("sphericalSpiralPlaneAngle").value);
      const planeAxis = document.getElementById("sphericalSpiralPlaneAxis").value;

      // Validate inputs
      validatePoint(centerPoint, "Center Point");
      validateRange(radius, 1, 200, "Radius");
      validateRange(segments, 10, 200, "Segments");
      validateRange(turns, 0.1, 20, "Turns");
      validateRange(startAngle, -180, 180, "Start Angle");
      validateRange(endAngle, -180, 180, "End Angle");
      validateRange(planeAngle, -360, 360, "Plane Angle");

      if (startAngle >= endAngle) {
        throw new Error("End angle must be greater than start angle");
      }

      this.wheel.generateSphericalSpiral(centerPoint, radius, direction, segments, turns, startAngle, endAngle, planeAngle, planeAxis);
      this.updateCount('SphericalSpiral', this.wheel.allPoints.length);
      return true;
    } catch (error) {
      alert(`Spherical Spiral Generation Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate grid shape from form inputs
   */
  generateGrid() {
    try {
      const centerPoint = new THREE.Vector3(
        parseFloat(document.getElementById("gridCenterX").value),
        parseFloat(document.getElementById("gridCenterY").value),
        parseFloat(document.getElementById("gridCenterZ").value)
      );
      const rows = parseInt(document.getElementById("gridRows").value);
      const columns = parseInt(document.getElementById("gridColumns").value);
      const spacing = parseFloat(document.getElementById("gridSpacing").value);
      const stepAmount = parseFloat(document.getElementById("gridStepAmount").value);
      const floors = parseInt(document.getElementById("gridFloors").value);

      // Validate inputs
      validatePoint(centerPoint, "Center Point");
      validateRange(rows, 1, 50, "Rows");
      validateRange(columns, 1, 50, "Columns");
      validateRange(spacing, 1, 50, "Spacing");
      validateRange(stepAmount, 0, 20, "Step Amount");
      validateRange(floors, 1, 20, "Floors");

      this.wheel.generateGrid(centerPoint, rows, columns, spacing, stepAmount, floors);
      this.updateCount('Grid', this.wheel.allPoints.length);
      return true;
    } catch (error) {
      alert(`Grid Generation Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate cylinder spiral shape from form inputs
   */
  generateCylinderSpiral() {
    try {
      const center = new THREE.Vector3(
        parseFloat(document.getElementById("cylinderSpiralCenterX").value),
        parseFloat(document.getElementById("cylinderSpiralCenterY").value),
        parseFloat(document.getElementById("cylinderSpiralCenterZ").value)
      );
      const radius = parseFloat(document.getElementById("cylinderSpiralRadius").value);
      const height = parseFloat(document.getElementById("cylinderSpiralHeight").value);
      const segments = parseInt(document.getElementById("cylinderSpiralSegments").value);
      const turns = parseFloat(document.getElementById("cylinderSpiralTurns").value);
      const direction = document.getElementById("cylinderSpiralDirection").value;
      const planeAngle = parseFloat(document.getElementById("cylinderSpiralPlaneAngle").value);
      const planeAxis = document.getElementById("cylinderSpiralPlaneAxis").value;

      // Validate inputs
      validatePoint(center, "Center Point");
      validateRange(radius, 1, 200, "Radius");
      validateRange(height, 1, 200, "Height");
      validateRange(segments, 10, 200, "Segments");
      validateRange(turns, 0.1, 20, "Turns");
      validateRange(planeAngle, -360, 360, "Plane Angle");

      this.wheel.generateCylinderSpiral(center, radius, height, segments, turns, direction, planeAngle, planeAxis);
      this.updateCount('CylinderSpiral', this.wheel.allPoints.length);
      return true;
    } catch (error) {
      alert(`Cylinder Spiral Generation Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate maze from form inputs
   */
  generateMaze() {
    try {
      const cellLength = parseInt(document.getElementById("mazeLength").value);
      const wallWidth = parseInt(document.getElementById("mazeWidth").value);
      const wallHeight = parseInt(document.getElementById("mazeHeight").value);
      const gridWidth = parseInt(document.getElementById("mazeDimensionX").value);
      const gridHeight = parseInt(document.getElementById("mazeDimensionY").value);

      // Validate inputs
      validateRange(cellLength, 1, 20, "Cell Length");
      validateRange(wallWidth, 1, 10, "Wall Width");
      validateRange(wallHeight, 1, 20, "Wall Height");
      validateRange(gridWidth, 3, 50, "Grid Width");
      validateRange(gridHeight, 3, 50, "Grid Height");

      this.maze.generateMaze(cellLength, wallWidth, wallHeight, gridWidth, gridHeight);
      const wallCount = this.maze.walls ? this.maze.walls.length : 0;
      const element = document.getElementById("generatedWallCount");
      if (element) {
        element.textContent = `Generated Walls: ${wallCount}`;
        element.style.fontWeight = 'bold';
        element.style.color = '#2196F3';
      }
      return true;
    } catch (error) {
      alert(`Maze Generation Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate 3D maze from form inputs
   */
  generateMaze3D() {
    try {
      const floorLength = parseInt(document.getElementById("maze3dFloorLength").value);
      const floorWidth = parseInt(document.getElementById("maze3dFloorWidth").value);
      const gridWidth = parseInt(document.getElementById("maze3dDimensionX").value);
      const gridHeight = parseInt(document.getElementById("maze3dDimensionY").value);
      const floors = parseInt(document.getElementById("maze3dFloors").value);

      // Validate inputs
      validateRange(floorLength, 1, 20, "Floor Length");
      validateRange(floorWidth, 1, 20, "Floor Width");
      validateRange(gridWidth, 2, 20, "Grid Width");
      validateRange(gridHeight, 2, 20, "Grid Height");
      validateRange(floors, 1, 10, "Floors");

      this.maze3d.generateMaze(floorLength, floorWidth, gridWidth, gridHeight, floors);
      const wallCount = this.maze3d.walls ? this.maze3d.walls.length : 0;
      const floorCount = this.maze3d.floors ? this.maze3d.floors.length : 0;
      const element = document.getElementById("generated3DWallCount");
      if (element) {
        element.textContent = `Generated Walls: ${wallCount}, Floors: ${floorCount} (Total Points: ${this.maze3d.allPoints.length})`;
        element.style.fontWeight = 'bold';
        element.style.color = '#2196F3';
      }
      return true;
    } catch (error) {
      alert(`3D Maze Generation Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Update UI visibility based on selected shape type
   */
  updateUIForShape(shapeType) {
    const sections = {
      wheelInputs: "wheel",
      spiralInputs: "spiral", 
      conicalSpiralInputs: "conicalSpiral",
      sphericalSpiralInputs: "sphericalSpiral",
      gridInputs: "grid",
      mazeInputs: "maze",
      maze3dInputs: "maze3d",
      cylinderSpiralInputs: "cylinderSpiral",
      floorUploadSection: "maze3d"
    };

    Object.entries(sections).forEach(([elementId, targetShape]) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.style.display = shapeType === targetShape ? "block" : "none";
      }
    });

    // Clear coordinates list
    document.getElementById("coordinates").innerHTML = "";
    
    // Clear all count displays
    this.clearAllCounts();
  }

  /**
   * Clear all count displays
   */
  clearAllCounts() {
    const countElements = [
      'generatedWheelCount',
      'generatedSpiralCount', 
      'generatedConicalSpiralCount',
      'generatedSphericalSpiralCount',
      'generatedGridCount',
      'generatedWallCount',
      'generated3DWallCount',
      'generatedCylinderSpiralCount'
    ];
    
    countElements.forEach(elementId => {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = '';
      }
    });
  }

  /**
   * Update count display for generated shapes
   */
  updateCount(shapeType, count, additionalInfo = '') {
    const elementId = `generated${shapeType}Count`;
    const element = document.getElementById(elementId);
    if (element) {
      let message = `Generated Points: ${count}`;
      if (additionalInfo) {
        message += ` ${additionalInfo}`;
      }
      element.textContent = message;
      element.style.fontWeight = 'bold';
      element.style.color = '#2196F3';
      element.style.marginTop = '10px';
    }
  }
}