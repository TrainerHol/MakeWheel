let scene, camera, renderer;
let point1, point2, centerPoint;
let pairPoints = [];
let segmentPoints = [];
let allPoints = [];
let planeVisualization;
let useMakePlaceFormat = false;
let planeAngle = 0;
let uploadedDesign = null;
let processedDesign = null;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);

  document.getElementById("generateBtn").addEventListener("click", generatePoints);
  document.getElementById("resetCamera").addEventListener("click", resetCamera);
  document.getElementById("makePlaceFormat").addEventListener("change", function () {
    useMakePlaceFormat = this.checked;
    updateCoordinatesList();
  });
  document.getElementById("planeAngle").addEventListener("change", function () {
    planeAngle = parseFloat(this.value);
    generatePoints();
  });
  document.getElementById("jsonFileInput").addEventListener("change", handleFileUpload);
  document.getElementById("processDesignBtn").addEventListener("click", processDesign);
  document.getElementById("downloadBtn").addEventListener("click", downloadProcessedJSON);

  createPlaneVisualization();
  generatePoints();

  window.addEventListener("resize", onWindowResize, false);

  setupMouseControls();
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        uploadedDesign = JSON.parse(e.target.result);
        console.log("Design JSON loaded successfully");
      } catch (error) {
        console.error("Error parsing JSON:", error);
        alert("Error parsing JSON file. Please make sure it's a valid JSON.");
      }
    };
    reader.readAsText(file);
  }
}

function processDesign() {
  if (!uploadedDesign) {
    alert("Please upload a design JSON file first.");
    return;
  }

  if (allPoints.length < 1) {
    alert("Please generate points first.");
    return;
  }

  processedDesign = {
    ...uploadedDesign,
    attachments: [],
  };

  // Remove the root item from the processed design
  delete processedDesign.transform;

  // Process for all generated points
  allPoints.forEach((point, index) => {
    const newAttachment = {
      ...uploadedDesign,
      transform: {
        location: [point.position.x * 100, point.position.z * 100, point.position.y * 100],
        rotation: uploadedDesign.transform.rotation,
        scale: uploadedDesign.transform.scale,
      },
    };
    delete newAttachment.attachments;
    processedDesign.attachments.push(newAttachment);

    // Process attachments for this point
    processAttachments(uploadedDesign, newAttachment, point);
  });

  console.log("Design processed successfully");
  document.getElementById("downloadBtn").style.display = "block";
}

function processAttachments(originalDesign, targetDesign, referencePoint) {
  if (originalDesign.attachments) {
    if (!targetDesign.attachments) {
      targetDesign.attachments = [];
    }
    originalDesign.attachments.forEach((attachment) => {
      try {
        const newAttachment = { ...attachment };
        const relativePosition = [attachment.transform.location[0] - originalDesign.transform.location[0], attachment.transform.location[1] - originalDesign.transform.location[1], attachment.transform.location[2] - originalDesign.transform.location[2]];
        newAttachment.transform = {
          ...attachment.transform,
          location: [referencePoint.position.x * 100 + relativePosition[0], referencePoint.position.z * 100 + relativePosition[1], referencePoint.position.y * 100 + relativePosition[2]],
        };
        targetDesign.attachments.push(newAttachment);
      } catch (error) {
        console.error("Error processing attachment:", error);
      }
    });
  }
}

function setupMouseControls() {
  let isDragging = false;
  let previousMousePosition = {
    x: 0,
    y: 0,
  };

  renderer.domElement.addEventListener("mousedown", function (e) {
    isDragging = true;
  });

  renderer.domElement.addEventListener("mousemove", function (e) {
    let deltaMove = {
      x: e.offsetX - previousMousePosition.x,
      y: e.offsetY - previousMousePosition.y,
    };

    if (isDragging) {
      let deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(toRadians(deltaMove.y * 1), toRadians(deltaMove.x * 1), 0, "XYZ"));

      camera.position.applyQuaternion(deltaRotationQuaternion);
      camera.lookAt(scene.position);
    }

    previousMousePosition = {
      x: e.offsetX,
      y: e.offsetY,
    };
  });

  renderer.domElement.addEventListener("mouseup", function (e) {
    isDragging = false;
  });

  renderer.domElement.addEventListener("wheel", function (e) {
    let zoomAmount = e.deltaY * 0.1;
    camera.position.multiplyScalar(1 + zoomAmount / 100);
    camera.lookAt(scene.position);
  });
}

function downloadProcessedJSON() {
  if (!processedDesign) {
    alert("No processed design available. Please process a design first.");
    return;
  }

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(processedDesign, null, 2));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "processed_design.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function createPlaneVisualization() {
  planeVisualization = new THREE.Group();

  const axisLength = 60;
  const axisColor = 0xffffff;
  const axisWidth = 2;

  const xAxis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-axisLength, 0, 0), new THREE.Vector3(axisLength, 0, 0)]), new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: axisWidth }));

  const yAxis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -axisLength, 0), new THREE.Vector3(0, axisLength, 0)]), new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: axisWidth }));

  const zAxis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -axisLength), new THREE.Vector3(0, 0, axisLength)]), new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: axisWidth }));

  planeVisualization.add(xAxis, yAxis, zAxis);

  const loader = new THREE.FontLoader();
  loader.load("https://threejs.org/examples/fonts/helvetiker_regular.typeface.json", function (font) {
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const xText = new THREE.Mesh(new THREE.TextGeometry("X", { font: font, size: 3, height: 0.1 }), textMaterial);
    xText.position.set(axisLength + 2, 0, 0);

    const yText = new THREE.Mesh(new THREE.TextGeometry("Y", { font: font, size: 3, height: 0.1 }), textMaterial);
    yText.position.set(0, axisLength + 2, 0);

    const zText = new THREE.Mesh(new THREE.TextGeometry("Z", { font: font, size: 3, height: 0.1 }), textMaterial);
    zText.position.set(0, 0, axisLength + 2);

    planeVisualization.add(xText, yText, zText);
  });

  const gridSize = 100;
  const gridDivisions = 10;
  const gridHelper = new THREE.GridHelper(gridSize, gridDivisions);
  planeVisualization.add(gridHelper);

  scene.add(planeVisualization);
}

function generatePoints() {
  clearPoints();

  const point1Coords = new THREE.Vector3(parseFloat(document.getElementById("point1X").value), parseFloat(document.getElementById("point1Y").value), parseFloat(document.getElementById("point1Z").value));
  const point2Coords = new THREE.Vector3(parseFloat(document.getElementById("point2X").value), parseFloat(document.getElementById("point2Y").value), parseFloat(document.getElementById("point2Z").value));

  const repetitions = parseInt(document.getElementById("repetitions").value);
  const segments = parseInt(document.getElementById("segments").value);

  // Create input points but don't add them to allPoints
  point1 = createSphere(point1Coords, 0xff0000);
  point2 = createSphere(point2Coords, 0xff0000);

  const midpoint = new THREE.Vector3().addVectors(point1Coords, point2Coords).multiplyScalar(0.5);
  centerPoint = createSphere(midpoint, 0x00ff00);

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
    const newPointSphere = createSphere(newPoint, 0xff0000);
    pairPoints.push(newPointSphere);
    allPoints.push(newPointSphere);

    if (segments > 0) {
      const segmentStep = rotatedVector.clone().divideScalar(segments + 1);

      for (let j = 1; j <= segments; j++) {
        const segmentPoint = midpoint.clone().add(segmentStep.clone().multiplyScalar(j));
        const newSegmentPoint = createSphere(segmentPoint, 0xffff00, 0.5);
        segmentPoints.push(newSegmentPoint);
        allPoints.push(newSegmentPoint);
      }
    }
  }

  resetCamera();
  updateCoordinatesList();
}

function createSphere(position, color, size = 1) {
  const geometry = new THREE.SphereGeometry(size);
  const material = new THREE.MeshPhongMaterial({ color });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.copy(position);
  scene.add(sphere);
  return sphere;
}

function clearPoints() {
  allPoints.forEach((point) => scene.remove(point));
  point1 = point2 = centerPoint = null;
  pairPoints = [];
  segmentPoints = [];
  allPoints = [];
}

function updateCoordinatesList() {
  const coordinatesDiv = document.getElementById("coordinates");
  coordinatesDiv.innerHTML = `<h3>Coordinates (Total #: ${allPoints.length})</h3>`;

  function addCoordinate(name, point, index) {
    let x = point.position.x;
    let y = point.position.y;
    let z = point.position.z;

    if (useMakePlaceFormat) {
      x = (x * 100).toFixed(0);
      let temp = y;
      y = (z * 100).toFixed(0);
      z = (temp * 100).toFixed(0);
    } else {
      x = x.toFixed(2);
      y = y.toFixed(2);
      z = z.toFixed(2);
    }

    const coordStr = `${x}, ${y}, ${z}`;
    const div = document.createElement("div");
    div.className = "coordinate-item";
    div.innerHTML = `${name}: (${coordStr}) <span class="copy-btn" data-coord="${coordStr}">Copy</span>`;
    div.addEventListener("mouseenter", () => highlightPoint(index));
    div.addEventListener("mouseleave", () => resetPointColor(index));
    coordinatesDiv.appendChild(div);
  }

  addCoordinate("Point 1", point1, 0);
  addCoordinate("Point 2", point2, 1);
  addCoordinate("Center", centerPoint, 2);

  pairPoints.forEach((point, index) => {
    addCoordinate(`Pair ${index + 1} Point`, point, index + 3);
  });

  segmentPoints.forEach((point, index) => {
    const segmentCount = document.getElementById("segments").value;
    const pairIndex = Math.floor(index / segmentCount) + 1;
    const segmentIndex = (index % segmentCount) + 1;
    addCoordinate(`Pair ${pairIndex} Segment ${segmentIndex}`, point, index + pairPoints.length + 3);
  });

  setupCopyButtons();
}

function setupCopyButtons() {
  const copyButtons = document.getElementsByClassName("copy-btn");
  for (let btn of copyButtons) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const coord = this.getAttribute("data-coord");
      navigator.clipboard.writeText(coord).then(() => {
        this.textContent = "Copied!";
        setTimeout(() => {
          this.textContent = "Copy";
        }, 2000);
      });
    });
  }
}

function highlightPoint(index) {
  if (allPoints[index]) {
    allPoints[index].material.color.setHex(0xdb63ff);
  }
}

function resetPointColor(index) {
  if (allPoints[index]) {
    const originalColor = index === 2 ? 0x00ff00 : index < 3 || (index >= 3 && index < pairPoints.length + 3) ? 0xff0000 : 0xffff00;
    allPoints[index].material.color.setHex(originalColor);
  }
}

function resetCamera() {
  if (centerPoint) {
    const midpoint = centerPoint.position;
    camera.position.set(midpoint.x, midpoint.y, midpoint.z + 100);
    camera.lookAt(midpoint);
  } else {
    camera.position.set(0, 0, 100);
    camera.lookAt(scene.position);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupMouseControls() {
  let isDragging = false;
  let previousMousePosition = {
    x: 0,
    y: 0,
  };

  document.addEventListener("mousedown", function (e) {
    isDragging = true;
  });

  document.addEventListener("mousemove", function (e) {
    let deltaMove = {
      x: e.offsetX - previousMousePosition.x,
      y: e.offsetY - previousMousePosition.y,
    };

    if (isDragging) {
      let deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(toRadians(deltaMove.y * 1), toRadians(deltaMove.x * 1), 0, "XYZ"));

      camera.position.applyQuaternion(deltaRotationQuaternion);
      camera.lookAt(scene.position);
    }

    previousMousePosition = {
      x: e.offsetX,
      y: e.offsetY,
    };
  });

  document.addEventListener("mouseup", function (e) {
    isDragging = false;
  });

  document.addEventListener("wheel", function (e) {
    let zoomAmount = e.deltaY * 0.1;
    camera.position.multiplyScalar(1 + zoomAmount / 100);
    camera.lookAt(scene.position);
  });
}

function toRadians(angle) {
  return angle * (Math.PI / 180);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

init();
animate();
