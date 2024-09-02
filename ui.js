export class UI {
  constructor(wheel, sceneManager) {
    this.wheel = wheel;
    this.sceneManager = sceneManager;
    this.useMakePlaceFormat = false;
    this.uploadedDesign = null;
    this.processedDesign = null;
    this.shapeType = 'wheel';
  }

  init() {
    document.getElementById("generateBtn").addEventListener("click", () => this.generateShape());
    document.getElementById("resetCamera").addEventListener("click", () => this.sceneManager.resetCamera(this.wheel.centerPoint));
    document.getElementById("makePlaceFormat").addEventListener("change", (e) => {
      this.useMakePlaceFormat = e.target.checked;
      this.updateCoordinatesList();
    });
    document.getElementById("planeAngle").addEventListener("change", () => this.generatePoints());
    document.getElementById("jsonFileInput").addEventListener("change", (e) => this.handleFileUpload(e));
    document.getElementById("processDesignBtn").addEventListener("click", () => this.processDesign());
    document.getElementById("downloadBtn").addEventListener("click", () => this.downloadProcessedJSON());
    document.getElementById("shapeType").addEventListener("change", (e) => {
      this.shapeType = e.target.value;
      this.updateUIForShape();
    });

    this.setupMouseControls();
  }

  generateShape() {
    if (this.shapeType === 'wheel') {
      this.generatePoints();
    } else if (this.shapeType === 'spiral') {
      this.generateSpiral();
    } else if (this.shapeType === 'conicalSpiral') {
      this.generateConicalSpiral();
    }
  }

  generatePoints() {
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

    this.wheel.generatePoints(point1Coords, point2Coords, repetitions, segments, planeAngle);
    this.sceneManager.resetCamera(this.wheel.centerPoint);
    this.updateCoordinatesList();
  }

  generateSpiral() {
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

    this.wheel.generateSpiral(centerPoint, startPoint, direction, segments, turns, planeAngle);
    this.sceneManager.resetCamera(this.wheel.centerPoint);
    this.updateCoordinatesList();
  }

  generateConicalSpiral() {
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

    this.wheel.generateConicalSpiral(centerPoint, startPoint, direction, segments, turns, isUpright, height, startFromCenter);
    this.sceneManager.resetCamera(this.wheel.centerPoint);
    this.updateCoordinatesList();
  }

  updateCoordinatesList() {
    const coordinatesDiv = document.getElementById("coordinates");
    coordinatesDiv.innerHTML = `<h3>Coordinates (Total #: ${this.wheel.allPoints.length})</h3>`;

    const addCoordinate = (name, point, index) => {
      if (!point) return; // Add null check

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
      div.addEventListener("mouseenter", () => this.wheel.highlightPoint(index));
      div.addEventListener("mouseleave", () => this.wheel.resetPointColor(index));
      coordinatesDiv.appendChild(div);
    };

    // Add coordinates for all points in the wheel
    this.wheel.allPoints.forEach((point, index) => {
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
        let deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(toRadians(deltaMove.y * 1), toRadians(deltaMove.x * 1), 0, "XYZ")
        );

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
          this.uploadedDesign.name = file.name.split('.').slice(0, -1).join('.'); // Extract the file name without extension
          console.log("Design JSON loaded successfully");
        } catch (error) {
          console.error("Error parsing JSON:", error);
          alert("Error parsing JSON file. Please make sure it's a valid JSON.");
        }
      };
      reader.readAsText(file);
    }
  }

  processDesign() {
    if (!this.uploadedDesign) {
      alert("Please upload a design JSON file first.");
      return;
    }

    if (this.wheel.allPoints.length < 1) {
      alert("Please generate points first.");
      return;
    }

    this.processedDesign = {
      ...this.uploadedDesign,
      attachments: [],
    };

    delete this.processedDesign.transform;

    this.wheel.allPoints.forEach((point, index) => {
      const newAttachment = {
        ...this.uploadedDesign,
        transform: {
          location: [point.position.x * 100, point.position.z * 100, point.position.y * 100],
          rotation: this.uploadedDesign.transform.rotation,
          scale: this.uploadedDesign.transform.scale,
        },
      };
      delete newAttachment.attachments;
      this.processedDesign.attachments.push(newAttachment);

      this.processAttachments(this.uploadedDesign, newAttachment, point);
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
          const relativePosition = [
            attachment.transform.location[0] - originalDesign.transform.location[0],
            attachment.transform.location[1] - originalDesign.transform.location[1],
            attachment.transform.location[2] - originalDesign.transform.location[2],
          ];
          newAttachment.transform = {
            ...attachment.transform,
            location: [
              referencePoint.position.x * 100 + relativePosition[0],
              referencePoint.position.z * 100 + relativePosition[1],
              referencePoint.position.y * 100 + relativePosition[2],
            ],
          };
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
    const wheelInputs = document.getElementById("wheelInputs");
    const spiralInputs = document.getElementById("spiralInputs");
    const conicalSpiralInputs = document.getElementById("conicalSpiralInputs");

    wheelInputs.style.display = this.shapeType === 'wheel' ? 'block' : 'none';
    spiralInputs.style.display = this.shapeType === 'spiral' ? 'block' : 'none';
    conicalSpiralInputs.style.display = this.shapeType === 'conicalSpiral' ? 'block' : 'none';
  }
}