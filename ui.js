export class UI {
  constructor(wheel, sceneManager, maze, maze3d) {
    this.wheel = wheel;
    this.sceneManager = sceneManager;
    this.maze = maze;
    this.maze3d = maze3d;
    this.useMakePlaceFormat = false;
    this.uploadedDesign = null;
    this.uploadedFloorDesign = null;
    this.processedDesign = null;
    this.shapeType = "wheel";
  }

  init() {
    document.getElementById("generateBtn").addEventListener("click", () => this.generateShape());
    document.getElementById("resetCamera").addEventListener("click", () => this.resetCameraToShape());
    document.getElementById("makePlaceFormat").addEventListener("change", (e) => {
      this.useMakePlaceFormat = e.target.checked;
      this.updateCoordinatesList();
    });
    document.getElementById("planeAngle").addEventListener("change", () => this.generatePoints());
    document.getElementById("jsonFileInput").addEventListener("change", (e) => this.handleFileUpload(e));
    document.getElementById("floorFileInput").addEventListener("change", (e) => this.handleFloorFileUpload(e));
    document.getElementById("processDesignBtn").addEventListener("click", () => this.processDesign());
    document.getElementById("downloadBtn").addEventListener("click", () => this.downloadProcessedJSON());
    document.getElementById("shapeType").addEventListener("change", (e) => {
      this.shapeType = e.target.value;
      this.updateUIForShape();
    });

    this.setupMouseControls();
  }

  generateShape() {
    if (this.shapeType === "wheel") {
      this.generatePoints();
    } else if (this.shapeType === "spiral") {
      this.generateSpiral();
    } else if (this.shapeType === "conicalSpiral") {
      this.generateConicalSpiral();
    } else if (this.shapeType === "sphericalSpiral") {
      this.generateSphericalSpiral();
    } else if (this.shapeType === "grid") {
      this.generateGrid();
    } else if (this.shapeType === "maze") {
      this.generateMaze();
    } else if (this.shapeType === "maze3d") {
      this.generateMaze3D();
    } else if (this.shapeType === "cylinderSpiral") {
      this.generateCylinderSpiralUI();
    }
  }

  generatePoints() {
    const point1Coords = new THREE.Vector3(parseFloat(document.getElementById("point1X").value), parseFloat(document.getElementById("point1Y").value), parseFloat(document.getElementById("point1Z").value));
    const point2Coords = new THREE.Vector3(parseFloat(document.getElementById("point2X").value), parseFloat(document.getElementById("point2Y").value), parseFloat(document.getElementById("point2Z").value));
    const repetitions = parseInt(document.getElementById("repetitions").value);
    const segments = parseInt(document.getElementById("segments").value);
    const planeAngle = parseFloat(document.getElementById("planeAngle").value);

    this.wheel.generatePoints(point1Coords, point2Coords, repetitions, segments, planeAngle);
    this.updateCoordinatesList();
  }

  generateSpiral() {
    const centerPoint = new THREE.Vector3(parseFloat(document.getElementById("spiralCenterX").value), parseFloat(document.getElementById("spiralCenterY").value), parseFloat(document.getElementById("spiralCenterZ").value));
    const startPoint = new THREE.Vector3(parseFloat(document.getElementById("spiralStartX").value), parseFloat(document.getElementById("spiralStartY").value), parseFloat(document.getElementById("spiralStartZ").value));
    const direction = document.getElementById("spiralDirection").value;
    const segments = parseInt(document.getElementById("spiralSegments").value);
    const turns = parseFloat(document.getElementById("spiralTurns").value);
    const planeAngle = parseFloat(document.getElementById("spiralPlaneAngle").value);
    const planeAxis = document.getElementById("spiralPlaneAxis").value;

    this.wheel.generateSpiral(centerPoint, startPoint, direction, segments, turns, planeAngle, planeAxis);
    this.updateCoordinatesList();
  }

  generateConicalSpiral() {
    const centerPoint = new THREE.Vector3(parseFloat(document.getElementById("conicalSpiralCenterX").value), parseFloat(document.getElementById("conicalSpiralCenterY").value), parseFloat(document.getElementById("conicalSpiralCenterZ").value));
    const startPoint = new THREE.Vector3(parseFloat(document.getElementById("conicalSpiralStartX").value), parseFloat(document.getElementById("conicalSpiralStartY").value), parseFloat(document.getElementById("conicalSpiralStartZ").value));
    const direction = document.getElementById("conicalSpiralDirection").value;
    const segments = parseInt(document.getElementById("conicalSpiralSegments").value);
    const turns = parseFloat(document.getElementById("conicalSpiralTurns").value);
    const isUpright = document.getElementById("conicalSpiralOrientation").value === "upright";
    const height = parseFloat(document.getElementById("conicalSpiralHeight").value);
    const startFromCenter = document.getElementById("conicalSpiralStartPoint").value === "center";
    const planeAngle = parseFloat(document.getElementById("conicalSpiralPlaneAngle").value);
    const planeAxis = document.getElementById("conicalSpiralPlaneAxis").value;

    this.wheel.generateConicalSpiral(centerPoint, startPoint, direction, segments, turns, isUpright, height, startFromCenter, planeAngle, planeAxis);
    this.updateCoordinatesList();
  }

  generateSphericalSpiral() {
    const centerPoint = new THREE.Vector3(parseFloat(document.getElementById("sphericalSpiralCenterX").value), parseFloat(document.getElementById("sphericalSpiralCenterY").value), parseFloat(document.getElementById("sphericalSpiralCenterZ").value));
    const radius = parseFloat(document.getElementById("sphericalSpiralRadius").value);
    const direction = document.getElementById("sphericalSpiralDirection").value;
    const segments = parseInt(document.getElementById("sphericalSpiralSegments").value);
    const turns = parseFloat(document.getElementById("sphericalSpiralTurns").value);
    const startAngle = parseFloat(document.getElementById("sphericalSpiralStartAngle").value);
    const endAngle = parseFloat(document.getElementById("sphericalSpiralEndAngle").value);
    const planeAngle = parseFloat(document.getElementById("sphericalSpiralPlaneAngle").value);
    const planeAxis = document.getElementById("sphericalSpiralPlaneAxis").value;

    this.wheel.generateSphericalSpiral(centerPoint, radius, direction, segments, turns, startAngle, endAngle, planeAngle, planeAxis);
    this.updateCoordinatesList();
  }

  generateGrid() {
    const centerX = document.getElementById("gridCenterX");
    const centerY = document.getElementById("gridCenterY");
    const centerZ = document.getElementById("gridCenterZ");
    const rows = document.getElementById("gridRows");
    const columns = document.getElementById("gridColumns");
    const spacing = document.getElementById("gridSpacing");
    const stepAmount = document.getElementById("gridStepAmount");
    const floors = document.getElementById("gridFloors");

    if (!centerX || !centerY || !centerZ || !rows || !columns || !spacing || !stepAmount || !floors) {
      console.error("One or more grid input elements are missing");
      return;
    }

    const centerPoint = new THREE.Vector3(parseFloat(centerX.value) || 0, parseFloat(centerY.value) || 0, parseFloat(centerZ.value) || 0);

    this.wheel.generateGrid(centerPoint, parseInt(rows.value) || 3, parseInt(columns.value) || 3, parseFloat(spacing.value) || 4, parseFloat(stepAmount.value) || 2, parseInt(floors.value) || 1);

    this.updateCoordinatesList();
  }

  generateMaze() {
    const length = parseFloat(document.getElementById("mazeLength").value);
    const width = parseInt(document.getElementById("mazeWidth").value);
    const height = parseInt(document.getElementById("mazeHeight").value);
    const dimensionX = parseInt(document.getElementById("mazeDimensionX").value);
    const dimensionY = parseInt(document.getElementById("mazeDimensionY").value) || dimensionX;

    const points = this.maze.generateMaze(length, width, height, dimensionX, dimensionY);
    this.updateCoordinatesList();

    const wallCountSpan = document.getElementById("generatedWallCount");
    wallCountSpan.textContent = `Generated Walls: ${this.maze.walls.length}`;
  }

  generateMaze3D() {
    const length = parseFloat(document.getElementById("maze3dLength").value);
    const width = parseInt(document.getElementById("maze3dWidth").value);
    const height = parseInt(document.getElementById("maze3dHeight").value);
    const floorLength = parseFloat(document.getElementById("maze3dFloorLength").value);
    const floorWidth = parseFloat(document.getElementById("maze3dFloorWidth").value);
    const dimensionX = parseInt(document.getElementById("maze3dDimensionX").value);
    const dimensionY = parseInt(document.getElementById("maze3dDimensionY").value) || dimensionX;
    const floors = parseInt(document.getElementById("maze3dFloors").value);

    const points = this.maze3d.generateMaze3D(length, width, height, floorLength, floorWidth, dimensionX, dimensionY, floors);
    this.updateCoordinatesList();

    const wallCountSpan = document.getElementById("generated3DWallCount");
    if (wallCountSpan) {
      wallCountSpan.textContent = `Generated Walls: ${this.maze3d.walls.length}, Floors: ${this.maze3d.floors.length} (Total Points: ${this.maze3d.allPoints.length})`;
    }
  }

  generateCylinderSpiralUI() {
    const centerX = parseFloat(document.getElementById("cylinderSpiralCenterX").value);
    const centerY = parseFloat(document.getElementById("cylinderSpiralCenterY").value);
    const centerZ = parseFloat(document.getElementById("cylinderSpiralCenterZ").value);
    const radius = parseFloat(document.getElementById("cylinderSpiralRadius").value);
    const height = parseFloat(document.getElementById("cylinderSpiralHeight").value);
    const segments = parseInt(document.getElementById("cylinderSpiralSegments").value);
    const turns = parseFloat(document.getElementById("cylinderSpiralTurns").value);
    const direction = document.getElementById("cylinderSpiralDirection").value;
    const planeAngle = parseFloat(document.getElementById("cylinderSpiralPlaneAngle").value);
    const planeAxis = document.getElementById("cylinderSpiralPlaneAxis").value;

    const centerPoint = new THREE.Vector3(centerX, centerY, centerZ);

    this.wheel.generateCylinderSpiral(centerPoint, radius, height, segments, turns, direction, planeAngle, planeAxis);
    this.updateCoordinatesList();
  }

  resetCameraToShape() {
    const centerPoint = new THREE.Vector3(0, 0, 0);
    if (this.shapeType !== "maze" && this.shapeType !== "maze3d" && this.wheel.centerPoint) {
      centerPoint.copy(this.wheel.centerPoint);
    }
    this.sceneManager.resetCamera(centerPoint);
  }

  updateCoordinatesList() {
    const coordinatesDiv = document.getElementById("coordinates");
    const points = this.shapeType === "maze" ? this.maze.allPoints : this.shapeType === "maze3d" ? this.maze3d.allPoints : this.wheel.allPoints;
    coordinatesDiv.innerHTML = `<h3>Coordinates (Total #: ${points.length})</h3>`;

    const addCoordinate = (name, point, index) => {
      if (!point) return;

      let x = point.position.x;
      let y = point.position.y;
      let z = point.position.z;

      if (this.useMakePlaceFormat) {
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
      div.addEventListener("mouseenter", () => {
        if (this.shapeType === "maze") {
          this.maze.highlightPoint(index);
        } else if (this.shapeType === "maze3d") {
          this.maze3d.highlightPoint(index);
        } else {
          this.wheel.highlightPoint(index);
        }
      });
      div.addEventListener("mouseleave", () => {
        if (this.shapeType === "maze") {
          this.maze.resetPointColor(index);
        } else if (this.shapeType === "maze3d") {
          this.maze3d.resetPointColor(index);
        } else {
          this.wheel.resetPointColor(index);
        }
      });
      coordinatesDiv.appendChild(div);
    };

    points.forEach((point, index) => {
      addCoordinate(`Point ${index + 1}`, point, index);
    });

    this.setupCopyButtons();
  }

  setupCopyButtons() {
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

  setupMouseControls() {
    let isDragging = false;
    let previousMousePosition = {
      x: 0,
      y: 0,
    };

    const toRadians = (angle) => {
      return angle * (Math.PI / 180);
    };

    document.addEventListener("mousedown", (e) => {
      isDragging = true;
    });

    document.addEventListener("mousemove", (e) => {
      let deltaMove = {
        x: e.offsetX - previousMousePosition.x,
        y: e.offsetY - previousMousePosition.y,
      };

      if (isDragging) {
        let deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(toRadians(deltaMove.y * 1), toRadians(deltaMove.x * 1), 0, "XYZ"));

        this.sceneManager.camera.position.applyQuaternion(deltaRotationQuaternion);
        this.sceneManager.camera.lookAt(this.sceneManager.scene.position);
      }

      previousMousePosition = {
        x: e.offsetX,
        y: e.offsetY,
      };
    });

    document.addEventListener("mouseup", (e) => {
      isDragging = false;
    });

    document.addEventListener("wheel", (e) => {
      let zoomAmount = e.deltaY * 0.1;
      this.sceneManager.camera.position.multiplyScalar(1 + zoomAmount / 100);
      this.sceneManager.camera.lookAt(this.sceneManager.scene.position);
    });
  }

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          this.uploadedDesign = JSON.parse(e.target.result);
          this.uploadedDesign.name = file.name.split(".").slice(0, -1).join("."); // Extract the file name without extension
          console.log("Design JSON loaded successfully");
        } catch (error) {
          console.error("Error parsing JSON:", error);
          alert("Error parsing JSON file. Please make sure it's a valid JSON.");
        }
      };
      reader.readAsText(file);
    }
  }

  handleFloorFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          this.uploadedFloorDesign = JSON.parse(e.target.result);
          this.uploadedFloorDesign.name = file.name.split(".").slice(0, -1).join("."); // Extract the file name without extension
          console.log("Floor Design JSON loaded successfully");
        } catch (error) {
          console.error("Error parsing Floor JSON:", error);
          alert("Error parsing Floor JSON file. Please make sure it's a valid JSON.");
        }
      };
      reader.readAsText(file);
    }
  }

  processDesign() {
    if (!this.uploadedDesign) {
      alert("Please upload a wall pieces JSON file first.");
      return;
    }

    if (this.shapeType === "maze3d" && !this.uploadedFloorDesign) {
      alert("Please upload both wall pieces and floor pieces JSON files for 3D maze.");
      return;
    }

    if ((this.shapeType === "maze" && this.maze.allPoints.length < 1) || (this.shapeType === "maze3d" && this.maze3d.allPoints.length < 1) || (this.shapeType !== "maze" && this.shapeType !== "maze3d" && this.wheel.allPoints.length < 1)) {
      alert("Please generate points first.");
      return;
    }

    this.processedDesign = {
      ...this.uploadedDesign,
      attachments: [],
    };

    delete this.processedDesign.transform;

    const points = this.shapeType === "maze" ? this.maze.allPoints : this.shapeType === "maze3d" ? this.maze3d.allPoints : this.wheel.allPoints;

    points.forEach((point, index) => {
      let designToUse = this.uploadedDesign;

      // For 3D maze, use floor design for floor pieces
      if (this.shapeType === "maze3d" && point.userData && point.userData.type === "floor") {
        designToUse = this.uploadedFloorDesign;
      }

      const newAttachment = {
        ...designToUse,
        transform: {
          location: [point.position.x * 100, point.position.z * 100, point.position.y * 100], // Swap Y/Z for Unreal
          rotation:
            this.shapeType === "maze" || this.shapeType === "maze3d"
              ? [0, 0, Math.sin((point.rotation.y + Math.PI / 2) / 2), Math.cos((point.rotation.y + Math.PI / 2) / 2)] // Add PI/2 to align with MakePlace
              : designToUse.transform.rotation,
          scale: designToUse.transform.scale,
        },
      };
      delete newAttachment.attachments;
      this.processedDesign.attachments.push(newAttachment);

      // Process attachments for all shapes
      this.processAttachments(designToUse, newAttachment, point);
    });

    console.log("Design processed successfully");
    document.getElementById("downloadBtn").style.display = "block";
  }

  processAttachments(originalDesign, targetDesign, referencePoint) {
    if (originalDesign.attachments) {
      if (!targetDesign.attachments) {
        targetDesign.attachments = [];
      }
      originalDesign.attachments.forEach((attachment) => {
        try {
          const newAttachment = { ...attachment };
          const relativePosition = [attachment.transform.location[0] - originalDesign.transform.location[0], attachment.transform.location[1] - originalDesign.transform.location[1], attachment.transform.location[2] - originalDesign.transform.location[2]];

          if (this.shapeType === "maze" || this.shapeType === "maze3d") {
            // Rotate the relative position by the wall's rotation
            const cos = Math.cos(referencePoint.rotation.y);
            const sin = Math.sin(referencePoint.rotation.y);
            const rotatedX = relativePosition[0] * cos - relativePosition[1] * sin;
            const rotatedY = relativePosition[0] * sin + relativePosition[1] * cos;

            // Create rotation quaternion for the attachment
            const [x, y, z, w] = attachment.transform.rotation;
            const angle = referencePoint.rotation.y;
            const s = Math.sin(angle / 2);
            const c = Math.cos(angle / 2);
            const rotatedRotation = [x * c + y * s, -x * s + y * c, z * c + w * s, -z * s + w * c];

            newAttachment.transform = {
              ...attachment.transform,
              location: [referencePoint.position.x * 100 + rotatedX, referencePoint.position.z * 100 + rotatedY, referencePoint.position.y * 100 + relativePosition[2]],
              rotation: rotatedRotation,
            };
          } else {
            newAttachment.transform = {
              ...attachment.transform,
              location: [referencePoint.position.x * 100 + relativePosition[0], referencePoint.position.z * 100 + relativePosition[1], referencePoint.position.y * 100 + relativePosition[2]],
              rotation: attachment.transform.rotation,
            };
          }
          targetDesign.attachments.push(newAttachment);
        } catch (error) {
          console.error("Error processing attachment:", error);
        }
      });
    }
  }

  downloadProcessedJSON() {
    if (!this.processedDesign) {
      alert("No processed design available. Please process a design first.");
      return;
    }

    const shapeType = this.shapeType.charAt(0).toUpperCase() + this.shapeType.slice(1);
    const originalName = this.uploadedDesign.name || "design";
    const fileName = `${originalName}_${shapeType}.json`;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.processedDesign, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  updateUIForShape() {
    // Clear both wheel and maze objects when switching shapes
    this.wheel.clearPoints();
    this.maze.clearMaze();
    if (this.maze3d) {
      this.maze3d.clearMaze();
    }

    const wheelInputs = document.getElementById("wheelInputs");
    const spiralInputs = document.getElementById("spiralInputs");
    const conicalSpiralInputs = document.getElementById("conicalSpiralInputs");
    const sphericalSpiralInputs = document.getElementById("sphericalSpiralInputs");
    const gridInputs = document.getElementById("gridInputs");
    const mazeInputs = document.getElementById("mazeInputs");
    const maze3dInputs = document.getElementById("maze3dInputs");
    const cylinderSpiralInputs = document.getElementById("cylinderSpiralInputs");
    const floorUploadSection = document.getElementById("floorUploadSection");

    wheelInputs.style.display = this.shapeType === "wheel" ? "block" : "none";
    spiralInputs.style.display = this.shapeType === "spiral" ? "block" : "none";
    conicalSpiralInputs.style.display = this.shapeType === "conicalSpiral" ? "block" : "none";
    sphericalSpiralInputs.style.display = this.shapeType === "sphericalSpiral" ? "block" : "none";
    gridInputs.style.display = this.shapeType === "grid" ? "block" : "none";
    mazeInputs.style.display = this.shapeType === "maze" ? "block" : "none";
    maze3dInputs.style.display = this.shapeType === "maze3d" ? "block" : "none";
    cylinderSpiralInputs.style.display = this.shapeType === "cylinderSpiral" ? "block" : "none";
    floorUploadSection.style.display = this.shapeType === "maze3d" ? "block" : "none";

    // Clear the coordinates list
    document.getElementById("coordinates").innerHTML = "";
  }
}
