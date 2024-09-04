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

  generateSpiral(centerPoint, startPoint, direction, segments, turns, planeAngle) {
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

    // Calculate the rotation axis and matrix
    const axis = new THREE.Vector3().subVectors(startPoint, centerPoint).normalize();
    const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, THREE.MathUtils.degToRad(planeAngle));

    // Calculate a perpendicular vector to create the spiral plane
    let perpVector = new THREE.Vector3(0, 1, 0);
    if (Math.abs(axis.dot(perpVector)) > 0.9) {
      perpVector.set(1, 0, 0);
    }
    perpVector.cross(axis).normalize();

    let currentLength = 0;
    let theta = 0;

    while (currentLength < totalLength && theta <= maxTheta) {
      const radius = a * theta;

      // Create point in the XZ plane
      const x = radius * Math.cos(direction === "clockwise" ? -theta : theta);
      const z = radius * Math.sin(direction === "clockwise" ? -theta : theta);

      // Rotate the point around the axis
      const point = new THREE.Vector3(x, 0, z);
      point.applyAxisAngle(axis, THREE.MathUtils.degToRad(planeAngle));

      // Translate the point to the correct position
      point.add(centerPoint);

      const sphere = this.createSphere(point, 0xff0000);
      this.allPoints.push(sphere);

      currentLength += segmentLength;
      theta = Math.sqrt((currentLength * 2) / a);
    }

    // Ensure at least one point is added to pairPoints and segmentPoints
    if (this.allPoints.length > 0) {
      this.pairPoints.push(this.allPoints[0]);
      this.segmentPoints.push(this.allPoints[0]);
    }
  }

  generateConicalSpiral(centerPoint, startPoint, direction, segments, turns, isUpright, height, startFromCenter) {
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

    const a = startRadius / (turns * 2 * Math.PI); // Spiral constant
    const maxTheta = turns * 2 * Math.PI;

    let currentLength = 0;
    let theta = 0;

    while (currentLength < totalLength) {
      const t = currentLength / totalLength;
      const radius = startRadius - t * startRadius; // Linearly interpolate radius from startPoint to centerPoint
      const currentHeight = t * height * heightDirection;

      // Calculate position relative to the center point
      const x = centerPoint.x + radius * Math.cos(direction === "clockwise" ? -theta : theta);
      const z = centerPoint.z + radius * Math.sin(direction === "clockwise" ? -theta : theta);
      let y;

      if (startFromCenter) {
        y = centerPoint.y + currentHeight;
      } else {
        y = startPoint.y + currentHeight;
      }

      const point = new THREE.Vector3(x, y, z);
      const sphere = this.createSphere(point, 0xff0000);
      this.allPoints.push(sphere);

      currentLength += segmentLength;

      // Increment theta based on the next arc length
      theta += segmentLength / radius;
    }
  }

  generateSphericalSpiral(centerPoint, radius, direction, segments, turns, startAngle, endAngle) {
    this.clearPoints();
    this.shapeType = "sphericalSpiral";

    this.centerPoint = this.createSphere(centerPoint, 0x00ff00);

    const totalAngle = turns * 2 * Math.PI;
    const angleStep = totalAngle / segments;
    const phiStart = THREE.MathUtils.degToRad(startAngle);
    const phiLength = THREE.MathUtils.degToRad(endAngle - startAngle);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const theta = direction === "clockwise" ? -t * totalAngle : t * totalAngle;
      const phi = phiStart + t * phiLength;

      const x = centerPoint.x + radius * Math.sin(phi) * Math.cos(theta);
      const y = centerPoint.y + radius * Math.cos(phi);
      const z = centerPoint.z + radius * Math.sin(phi) * Math.sin(theta);

      const point = new THREE.Vector3(x, y, z);
      const sphere = this.createSphere(point, 0xff0000);
      this.allPoints.push(sphere);
    }

    // Ensure at least one point is added to pairPoints and segmentPoints
    if (this.allPoints.length > 0) {
      this.pairPoints.push(this.allPoints[0]);
      this.segmentPoints.push(this.allPoints[0]);
    }
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
    this.allPoints.forEach((point) => this.scene.remove(point));
    this.point1 = this.point2 = this.centerPoint = null;
    this.pairPoints = [];
    this.segmentPoints = [];
    this.allPoints = [];
  }

  highlightPoint(index) {
    if (this.allPoints[index]) {
      this.allPoints[index].material.color.setHex(0xdb63ff);
    }
  }

  resetPointColor(index) {
    if (this.allPoints[index]) {
      const originalColor = index === 2 ? 0x00ff00 : index < 3 || (index >= 3 && index < this.pairPoints.length + 3) ? 0xff0000 : 0xffff00;
      this.allPoints[index].material.color.setHex(originalColor);
    }
  }
}
