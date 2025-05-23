export class Wheel {
  constructor(scene) {
    this.scene = scene;
    this.point1 = null;
    this.point2 = null;
    this.centerPoint = null;
    this.pairPoints = [];
    this.segmentPoints = [];
    this.allPoints = [];
    this.shapeType = "wheel"; // Add this line
    this.lines = []; // Add this line to keep track of the lines
  }

  generatePoints(point1Coords, point2Coords, repetitions, segments, planeAngle) {
    this.clearPoints();

    this.point1 = this.createSphere(point1Coords, 0xff0000);
    this.point2 = this.createSphere(point2Coords, 0xff0000);

    const midpoint = new THREE.Vector3().addVectors(point1Coords, point2Coords).multiplyScalar(0.5);
    this.centerPoint = this.createSphere(midpoint, 0x00ff00);

    const axis = new THREE.Vector3().subVectors(point2Coords, point1Coords).normalize();
    let perpVector = new THREE.Vector3(0, 1, 0);
    if (Math.abs(axis.dot(perpVector)) > 0.9) {
      perpVector.set(1, 0, 0);
    }
    perpVector.cross(axis).normalize();

    const radius = point1Coords.distanceTo(midpoint);
    const initialVector = new THREE.Vector3().subVectors(point1Coords, midpoint).normalize();

    const planeNormal = new THREE.Vector3().crossVectors(axis, perpVector);
    const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, THREE.MathUtils.degToRad(planeAngle));
    planeNormal.applyMatrix4(rotationMatrix);

    for (let i = 0; i < repetitions; i++) {
      const angle = (2 * Math.PI * i) / repetitions;
      const rotatedVector = new THREE.Vector3().copy(initialVector).applyAxisAngle(planeNormal, angle).multiplyScalar(radius);

      const newPoint = new THREE.Vector3().addVectors(midpoint, rotatedVector);
      const newPointSphere = this.createSphere(newPoint, 0xff0000);
      this.pairPoints.push(newPointSphere);
      this.allPoints.push(newPointSphere);

      if (segments > 0) {
        const segmentStep = rotatedVector.clone().divideScalar(segments + 1);

        for (let j = 1; j <= segments; j++) {
          const segmentPoint = midpoint.clone().add(segmentStep.clone().multiplyScalar(j));
          const newSegmentPoint = this.createSphere(segmentPoint, 0xffff00, 0.5);
          this.segmentPoints.push(newSegmentPoint);
          this.allPoints.push(newSegmentPoint);
        }
      }
    }
  }

  generateSpiral(centerPoint, startPoint, direction, segments, turns, planeAngle = 0, planeAxis = "x") {
    this.clearPoints();
    this.shapeType = "spiral";

    this.centerPoint = this.createSphere(centerPoint, 0x00ff00);
    const startSphere = this.createSphere(startPoint, 0xff0000);
    this.allPoints.push(startSphere);

    const startRadius = startPoint.distanceTo(centerPoint);
    const totalLength = (startRadius * turns * 2 * Math.PI) / 2; // Approximate spiral length
    const segmentLength = totalLength / segments;

    const a = startRadius / (turns * 2 * Math.PI); // Spiral constant
    const maxTheta = turns * 2 * Math.PI;

    // Calculate the initial angle of the start point relative to center
    const initialAngle = Math.atan2(startPoint.z - centerPoint.z, startPoint.x - centerPoint.x);

    // Generate spiral points first without plane rotation
    const spiralPoints = [];
    let currentLength = 0;
    let theta = 0;

    while (currentLength < totalLength && theta <= maxTheta) {
      const radius = a * theta;

      // Create point in the XZ plane relative to center
      const angle = initialAngle + (direction === "clockwise" ? -theta : theta);
      const x = centerPoint.x + radius * Math.cos(angle);
      const z = centerPoint.z + radius * Math.sin(angle);
      const y = centerPoint.y; // Keep at center height initially

      spiralPoints.push(new THREE.Vector3(x, y, z));

      currentLength += segmentLength;
      theta = Math.sqrt((currentLength * 2) / a);
    }

    // Apply plane rotation to all points
    this.applyPlaneRotation(spiralPoints, centerPoint, planeAngle, planeAxis);

    // Create spheres for the rotated points
    spiralPoints.forEach((point) => {
      const sphere = this.createSphere(point, 0xff0000);
      this.allPoints.push(sphere);
    });

    // Ensure at least one point is added to pairPoints and segmentPoints
    if (this.allPoints.length > 0) {
      this.pairPoints.push(this.allPoints[0]);
      this.segmentPoints.push(this.allPoints[0]);
    }
  }

  generateConicalSpiral(centerPoint, startPoint, direction, segments, turns, isUpright, height, startFromCenter, planeAngle = 0, planeAxis = "x") {
    this.clearPoints();
    this.shapeType = "conicalSpiral";

    this.centerPoint = this.createSphere(centerPoint, 0x00ff00);
    const startSphere = this.createSphere(startPoint, 0xff0000);
    this.allPoints.push(startSphere);

    const startRadius = new THREE.Vector2(startPoint.x - centerPoint.x, startPoint.z - centerPoint.z).length();
    const heightDirection = isUpright ? 1 : -1;

    // Calculate total length along the spiral
    const totalLength = Math.sqrt(Math.pow(startRadius, 2) + Math.pow(height, 2)) * turns;
    const segmentLength = totalLength / (segments - 1);

    // Calculate the initial angle of the start point
    const initialAngle = Math.atan2(startPoint.z - centerPoint.z, startPoint.x - centerPoint.x);

    // Generate spiral points first without plane rotation
    const spiralPoints = [];
    let currentLength = 0;
    let theta = 0;

    while (currentLength < totalLength) {
      const t = currentLength / totalLength;
      const radius = startRadius - t * startRadius; // Linearly interpolate radius from startPoint to centerPoint
      const currentHeight = t * height * heightDirection;

      // Calculate position relative to the center point
      const currentAngle = initialAngle + (direction === "clockwise" ? -theta : theta);
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

    // Apply plane rotation to all points
    this.applyPlaneRotation(spiralPoints, centerPoint, planeAngle, planeAxis);

    // Create spheres for the rotated points
    spiralPoints.forEach((point) => {
      const sphere = this.createSphere(point, 0xff0000);
      this.allPoints.push(sphere);
    });
  }

  generateSphericalSpiral(centerPoint, radius, direction, segments, turns, startAngle, endAngle, planeAngle = 0, planeAxis = "x") {
    this.clearPoints();
    this.shapeType = "sphericalSpiral";

    this.centerPoint = this.createSphere(centerPoint, 0x00ff00);

    const totalAngle = turns * 2 * Math.PI;
    const phiStart = THREE.MathUtils.degToRad(startAngle);
    const phiEnd = THREE.MathUtils.degToRad(endAngle);
    const phiLength = phiEnd - phiStart;

    const calculatePoint = (theta, phi) => {
      const x = centerPoint.x + radius * Math.sin(phi) * Math.cos(theta);
      const y = centerPoint.y + radius * Math.cos(phi);
      const z = centerPoint.z + radius * Math.sin(phi) * Math.sin(theta);
      return new THREE.Vector3(x, y, z);
    };

    // Pre-calculate points along the spiral
    const spiralPoints = [];
    const stepSize = 0.01;
    let theta = 0;
    let phi = phiStart;

    while (phi <= phiEnd && theta <= totalAngle) {
      spiralPoints.push(calculatePoint(direction === "clockwise" ? -theta : theta, phi));
      theta += stepSize;
      phi += (stepSize * phiLength) / totalAngle;
    }

    // Calculate total length of the spiral
    let totalLength = 0;
    for (let i = 1; i < spiralPoints.length; i++) {
      totalLength += spiralPoints[i].distanceTo(spiralPoints[i - 1]);
    }

    // Distribute points evenly along the spiral
    const segmentLength = totalLength / (segments - 1);
    let currentLength = 0;
    let currentIndex = 0;
    const finalSpiralPoints = [];

    for (let i = 0; i < segments; i++) {
      while (currentIndex < spiralPoints.length - 1 && currentLength + spiralPoints[currentIndex].distanceTo(spiralPoints[currentIndex + 1]) < i * segmentLength) {
        currentLength += spiralPoints[currentIndex].distanceTo(spiralPoints[currentIndex + 1]);
        currentIndex++;
      }

      let point;
      if (currentIndex >= spiralPoints.length - 1) {
        point = spiralPoints[spiralPoints.length - 1];
      } else {
        const remainingLength = i * segmentLength - currentLength;
        const nextPoint = spiralPoints[currentIndex + 1];
        const direction = nextPoint.clone().sub(spiralPoints[currentIndex]).normalize();
        point = spiralPoints[currentIndex].clone().add(direction.multiplyScalar(remainingLength));
      }

      finalSpiralPoints.push(point);
    }

    // Apply plane rotation to all points
    this.applyPlaneRotation(finalSpiralPoints, centerPoint, planeAngle, planeAxis);

    // Create spheres for the rotated points
    finalSpiralPoints.forEach((point) => {
      const sphere = this.createSphere(point, 0xff0000);
      this.allPoints.push(sphere);
    });
  }

  generateGrid(centerPoint, rows = 3, columns = 3, spacing = 4, stepAmount = 2, floors = 1) {
    this.clearPoints();
    this.shapeType = "grid";

    this.centerPoint = this.createSphere(centerPoint, 0x00ff00);

    const halfWidth = ((columns - 1) * spacing) / 2;
    const halfHeight = ((rows - 1) * spacing) / 2;

    // Generate a random starting corner
    const startRow = Math.random() < 0.5 ? 0 : rows - 1;
    const startCol = Math.random() < 0.5 ? 0 : columns - 1;
    const path = this.generateGridPath(rows, columns, floors, [startRow, startCol, 0]);
    const points = [];

    let lastPoint = null;
    for (let i = 0; i < path.length; i++) {
      const [row, col, floor] = path[i];

      const x = centerPoint.x - halfWidth + col * spacing;
      const y = centerPoint.y + i * stepAmount - (floor >= 1 ? floor * stepAmount : 0);
      const z = centerPoint.z - halfHeight + row * spacing;

      const point = new THREE.Vector3(x, y, z);

      // Check if this point is at the same x,z coordinate as the last point
      if (lastPoint && lastPoint.x === point.x && lastPoint.z === point.z) {
        // If it is, we're starting a new floor. Update the y-coordinate of the last point
        lastPoint.y = point.y;
      } else {
        // Otherwise, add the new point
        points.push(point);
        lastPoint = point;
      }
    }

    // Create spheres for each point
    points.forEach((point) => {
      const sphere = this.createSphere(point, 0xff0000);
      this.allPoints.push(sphere);
    });

    // Add lines to connect points along the path
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    for (let i = 1; i < points.length; i++) {
      const geometry = new THREE.BufferGeometry().setFromPoints([points[i - 1], points[i]]);
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
      this.lines.push(line);
    }

    // Ensure at least one point is added to pairPoints and segmentPoints
    if (this.allPoints.length > 0) {
      this.pairPoints.push(this.allPoints[0]);
      this.segmentPoints.push(this.allPoints[0]);
    }
  }

  generateGridPath(rows, columns, floors, startPoint = null) {
    const totalCells = rows * columns * floors;
    const path = [];
    const visited = new Set();

    let current = startPoint || [0, 0, 0];

    const directions = [
      [0, 1, 0], // Right
      [1, 0, 0], // Down
      [0, -1, 0], // Left
      [-1, 0, 0], // Up
    ];

    while (path.length < totalCells) {
      path.push(current);
      visited.add(`${current[0]},${current[1]},${current[2]}`);

      // Find the next unvisited neighbor
      let nextCell = null;
      for (const [dx, dy, dz] of directions) {
        const next = [Math.min(Math.max(current[0] + dx, 0), rows - 1), Math.min(Math.max(current[1] + dy, 0), columns - 1), current[2]];
        if (!visited.has(`${next[0]},${next[1]},${next[2]}`)) {
          nextCell = next;
          break;
        }
      }

      if (nextCell) {
        current = nextCell;
      } else {
        // Move to the next floor if all cells on the current floor are visited
        if (current[2] < floors - 1) {
          // Use the last point of the current floor as the start point for the next floor
          current = [current[0], current[1], current[2] + 1];
        } else {
          break; // All cells visited
        }
      }
    }

    return path;
  }

  createSphere(position, color, size = 1) {
    const geometry = new THREE.SphereGeometry(size);
    const material = new THREE.MeshPhongMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    this.scene.add(sphere);
    return sphere;
  }

  clearPoints() {
    // Remove all objects from the scene and arrays
    this.allPoints.forEach((point) => {
      if (point.children.length > 0) {
        // Remove any child objects (like edges)
        point.children.forEach((child) => point.remove(child));
      }
      this.scene.remove(point);
    });
    this.lines.forEach((line) => this.scene.remove(line));

    // Explicitly remove point1, point2, and centerPoint from scene
    if (this.point1) {
      this.scene.remove(this.point1);
      this.point1 = null;
    }
    if (this.point2) {
      this.scene.remove(this.point2);
      this.point2 = null;
    }
    if (this.centerPoint) {
      this.scene.remove(this.centerPoint);
      this.centerPoint = null;
    }

    // Clear arrays
    this.pairPoints = [];
    this.segmentPoints = [];
    this.allPoints = [];
    this.lines = [];
  }

  generateCylinderSpiral(center, radius, height, segments, turns, direction, planeAngle = 0, planeAxis = "x") {
    this.clearPoints();
    this.shapeType = "cylinderSpiral";

    // Display the center point
    this.centerPoint = this.createSphere(center, 0x00ff00);

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

    // Generate spiral points first without plane rotation
    const spiralPoints = [];
    let currentLength = 0;
    let theta = 0;

    for (let i = 0; i <= segments; i++) {
      // Calculate height based on the position along the spiral
      const t = currentLength / totalSpiralLength;
      const currentY = center.y + t * height;

      // Apply direction
      let currentRotation = direction === "clockwise" ? -theta : theta;

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

    // Apply plane rotation to all points
    this.applyPlaneRotation(spiralPoints, center, planeAngle, planeAxis);

    // Create spheres for the rotated points
    spiralPoints.forEach((point) => {
      const sphere = this.createSphere(point, 0xff0000);
      this.allPoints.push(sphere);
    });
  }

  // Helper method to apply plane rotation to an array of points
  applyPlaneRotation(points, centerPoint, planeAngle, planeAxis) {
    if (planeAngle === 0) return;

    const rotationMatrix = new THREE.Matrix4();
    const angleRad = THREE.MathUtils.degToRad(planeAngle);

    // Create rotation matrix based on selected axis
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

    // Apply rotation to each point around the center point
    points.forEach((point) => {
      // Translate to origin (relative to center point)
      point.sub(centerPoint);
      // Apply rotation
      point.applyMatrix4(rotationMatrix);
      // Translate back
      point.add(centerPoint);
    });
  }

  highlightPoint(index) {
    if (this.allPoints[index]) {
      this.allPoints[index].material.color.setHex(0xdb63ff);
    }
  }

  resetPointColor(index) {
    if (this.allPoints[index]) {
      let originalColor;

      switch (this.shapeType) {
        case "wheel":
          // Original wheel logic: center point at index 2, pair points are red, segment points are yellow
          originalColor = index === 2 ? 0x00ff00 : index < 3 || (index >= 3 && index < this.pairPoints.length + 3) ? 0xff0000 : 0xffff00;
          break;

        case "spiral":
        case "conicalSpiral":
        case "sphericalSpiral":
        case "cylinderSpiral":
          // For spirals: all points in allPoints are red (0xff0000)
          // The center point is stored separately and typically not in allPoints
          originalColor = 0xff0000;
          break;

        case "grid":
          // For grid: all points are red
          originalColor = 0xff0000;
          break;

        default:
          // Default to red for any other shape types
          originalColor = 0xff0000;
          break;
      }

      this.allPoints[index].material.color.setHex(originalColor);
    }
  }
}
