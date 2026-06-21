import { validateJsonFile } from '../utils/validators.js';

/**
 * Handles file upload, download, processing and JSON operations
 */
export class FileHandlers {
  constructor() {
    this.uploadedDesign = null;
    this.uploadedFloorDesign = null;
    this.uploadedRoomFloorDesign = null;
    this.uploadedParticleJumpTemplate = null;
    this.particleJumpTemplateMetrics = null;
    this.processedDesign = null;
  }

  /**
   * Handle main design file upload
   */
  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      validateJsonFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          
          // Validate JSON structure
          if (!jsonData.name) {
            throw new Error("JSON file must contain a 'name' property");
          }
          if (!jsonData.transform) {
            throw new Error("JSON file must contain a 'transform' property");
          }
          
          this.uploadedDesign = jsonData;
          document.getElementById("processDesignBtn").style.display = "block";
          console.log("File uploaded successfully:", jsonData.name);
        } catch (parseError) {
          alert(`Invalid JSON file: ${parseError.message}`);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      alert(`File Upload Error: ${error.message}`);
    }
  }

  /**
   * Handle floor design file upload (for 3D mazes)
   */
  handleFloorFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      validateJsonFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          
          // Validate JSON structure
          if (!jsonData.name) {
            throw new Error("Floor JSON file must contain a 'name' property");
          }
          if (!jsonData.transform) {
            throw new Error("Floor JSON file must contain a 'transform' property");
          }
          
          this.uploadedFloorDesign = jsonData;
          console.log("Floor file uploaded successfully:", jsonData.name);
        } catch (parseError) {
          alert(`Invalid floor JSON file: ${parseError.message}`);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      alert(`Floor File Upload Error: ${error.message}`);
    }
  }

  /**
   * Handle room floor design file upload
   */
  handleRoomFloorFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      validateJsonFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          
          // Validate JSON structure
          if (!jsonData.name) {
            throw new Error("Room floor JSON file must contain a 'name' property");
          }
          if (!jsonData.transform) {
            throw new Error("Room floor JSON file must contain a 'transform' property");
          }
          
          this.uploadedRoomFloorDesign = jsonData;
          console.log("Room floor file uploaded successfully:", jsonData.name);
        } catch (parseError) {
          alert(`Invalid room floor JSON file: ${parseError.message}`);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      alert(`Room Floor File Upload Error: ${error.message}`);
    }
  }

  /**
   * Handle Particle Field jump template upload.
   */
  handleParticleJumpTemplateUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      validateJsonFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          const metrics = this.extractParticleJumpTemplateMetrics(jsonData);

          this.uploadedParticleJumpTemplate = jsonData;
          this.particleJumpTemplateMetrics = metrics;
          document.getElementById("processDesignBtn").style.display = "block";
          this.setParticleJumpTemplateStatus(
            `Jump Template Loaded: flat ${metrics.flatMax.toFixed(4)}, height ${metrics.heightMax.toFixed(4)}`,
            false
          );
          console.log("Particle Field jump template uploaded successfully:", metrics.name);
        } catch (parseError) {
          this.uploadedParticleJumpTemplate = null;
          this.particleJumpTemplateMetrics = null;
          this.setParticleJumpTemplateStatus(parseError.message, true);
          alert(`Invalid jump template JSON file: ${parseError.message}`);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      this.uploadedParticleJumpTemplate = null;
      this.particleJumpTemplateMetrics = null;
      this.setParticleJumpTemplateStatus(error.message, true);
      alert(`Jump Template Upload Error: ${error.message}`);
    }
  }

  /**
   * Calculate Particle Field jump limits from a two-item MakePlace template.
   */
  extractParticleJumpTemplateMetrics(jsonData) {
    const rootLocation = this.getMakePlaceLocation(jsonData, "Jump template root");

    if (!Array.isArray(jsonData.attachments) || jsonData.attachments.length !== 1) {
      throw new Error("Jump template must contain exactly one immediate attachment.");
    }

    const attachment = jsonData.attachments[0];
    const attachmentLocation = this.getMakePlaceLocation(attachment, "Jump template attachment");
    const delta = [
      attachmentLocation[0] - rootLocation[0],
      attachmentLocation[1] - rootLocation[1],
      attachmentLocation[2] - rootLocation[2],
    ];
    const flatMax = Math.hypot(delta[0], delta[1]) / 100;
    const heightMax = Math.abs(delta[2]) / 100;

    if (flatMax <= 0) {
      throw new Error("Jump template flat distance must be greater than 0.");
    }

    return {
      name: jsonData.name || "Jump Template",
      delta,
      flatMax,
      heightMax,
    };
  }

  getMakePlaceLocation(design, label) {
    const location = design?.transform?.location;
    if (!Array.isArray(location) || location.length !== 3) {
      throw new Error(`${label} must contain transform.location with three numbers.`);
    }

    location.forEach((value, index) => {
      if (!Number.isFinite(Number(value))) {
        throw new Error(`${label} transform.location[${index}] must be a number.`);
      }
    });

    return location.map(Number);
  }

  setParticleJumpTemplateStatus(message, isError) {
    if (typeof document === "undefined") return;

    const element = document.getElementById("particleJumpTemplateStatus");
    if (!element) return;

    element.textContent = message;
    element.style.fontWeight = "bold";
    element.style.color = isError ? "#f44336" : "#2196F3";
    element.style.marginTop = "6px";
  }

  /**
   * Process uploaded design with generated shape points
   */
  processDesign(shapeType, wheel, maze, maze3d, options = {}) {
    const primaryDesign = this.getPrimaryDesignForShape(shapeType);

    if (!primaryDesign) {
      if (shapeType === "particleField") {
        alert("Please upload a design file or Particle Field jump template first.");
        return false;
      }

      alert("Please upload a design file first.");
      return false;
    }

    const points = this.getPointsForShape(shapeType, wheel, maze, maze3d);
    if (!points || points.length < 1) {
      alert("Please generate points first.");
      return false;
    }

    try {
      this.processedDesign = {
        ...primaryDesign,
        attachments: [],
      };

      delete this.processedDesign.transform;

      points.forEach((point, index) => {
        let designToUse = primaryDesign;

        // For 3D maze, use floor design for floor pieces
        if (shapeType === "maze3d" && point.userData && point.userData.type === "floor") {
          designToUse = this.uploadedFloorDesign || primaryDesign;
        }

        // For rooms, use appropriate design based on point type
        if (shapeType === "room" && point.userData && point.userData.type === "floor") {
          designToUse = this.uploadedRoomFloorDesign || primaryDesign;
        }

        const newAttachment = {
          ...designToUse,
          transform: {
            location: [point.position.x * 100, point.position.z * 100, point.position.y * 100], // Swap Y/Z for Unreal
            rotation: this.calculateRotation(shapeType, point, designToUse, options),
            scale: designToUse.transform.scale,
          },
        };
        
        delete newAttachment.attachments;
        this.processedDesign.attachments.push(newAttachment);

        // Process nested attachments
        this.processAttachments(designToUse, newAttachment, point, shapeType, options);
      });

      console.log("Design processed successfully");
      document.getElementById("downloadBtn").style.display = "block";
      return true;
    } catch (error) {
      alert(`Design Processing Error: ${error.message}`);
      return false;
    }
  }

  getPrimaryDesignForShape(shapeType) {
    if (this.uploadedDesign) {
      return this.uploadedDesign;
    }

    if (shapeType === "particleField" && this.uploadedParticleJumpTemplate) {
      return this.createParticleTemplateRootDesign(this.uploadedParticleJumpTemplate);
    }

    return null;
  }

  createParticleTemplateRootDesign(template) {
    const rootDesign = {
      ...template,
      attachments: [],
    };

    delete rootDesign.attachments;
    return rootDesign;
  }

  /**
   * Get points array based on shape type
   */
  getPointsForShape(shapeType, wheel, maze, maze3d) {
    switch (shapeType) {
      case "maze":
        return maze.allPoints;
      case "maze3d":
        return maze3d.allPoints;
      case "room":
        return wheel.roomShape ? wheel.roomShape.allPoints : [];
      default:
        return wheel.allPoints;
    }
  }

  /**
   * Calculate rotation for different shape types
   */
  calculateRotation(shapeType, point, designToUse, options = {}) {
    if (shapeType === "maze" || shapeType === "maze3d") {
      // Add PI/2 to align with MakePlace for maze walls
      const angle = point.rotation.y + Math.PI / 2;
      return [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)];
    } else if (shapeType === "room") {
      // Handle room walls and floors differently
      const rotationY = point.userData && point.userData.rotationY ? point.userData.rotationY : 0;
      
      if (point.userData && point.userData.type === "floor") {
        // Floors: use rotation as-is without the PI/2 wall offset
        return [0, 0, Math.sin(rotationY / 2), Math.cos(rotationY / 2)];
      } else {
        // Walls: add PI/2 to align with MakePlace
        const angle = rotationY + Math.PI / 2;
        return [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)];
      }
    } else if (shapeType === "particleField") {
      const yaw = this.getParticleFieldYaw(point, options);
      if (yaw === null) {
        return designToUse.transform.rotation;
      }

      return this.composeYawRotation(designToUse.transform.rotation, yaw);
    } else {
      return designToUse.transform.rotation;
    }
  }

  /**
   * Process nested attachments recursively
   */
  processAttachments(originalDesign, targetDesign, referencePoint, shapeType, options = {}) {
    if (!originalDesign.attachments) return;

    if (!targetDesign.attachments) {
      targetDesign.attachments = [];
    }

    const particleYaw = shapeType === "particleField"
      ? this.getParticleFieldYaw(referencePoint, options)
      : null;

    originalDesign.attachments.forEach((attachment) => {
      try {
        const newAttachment = { ...attachment };
        const relativePosition = [
          attachment.transform.location[0] - originalDesign.transform.location[0],
          attachment.transform.location[1] - originalDesign.transform.location[1],
          attachment.transform.location[2] - originalDesign.transform.location[2]
        ];

        if (shapeType === "maze" || shapeType === "maze3d") {
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
          const rotatedRotation = [
            x * c + y * s,
            -x * s + y * c,
            z * c + w * s,
            -z * s + w * c
          ];

          newAttachment.transform = {
            ...attachment.transform,
            location: [
              referencePoint.position.x * 100 + rotatedX,
              referencePoint.position.z * 100 + rotatedY,
              referencePoint.position.y * 100 + relativePosition[2]
            ],
            rotation: rotatedRotation,
          };
        } else if (shapeType === "particleField" && particleYaw !== null) {
          const rotatedPosition = this.rotateMakePlaceFlatPosition(relativePosition, particleYaw);
          newAttachment.transform = {
            ...attachment.transform,
            location: [
              referencePoint.position.x * 100 + rotatedPosition[0],
              referencePoint.position.z * 100 + rotatedPosition[1],
              referencePoint.position.y * 100 + rotatedPosition[2]
            ],
            rotation: this.composeYawRotation(attachment.transform.rotation, particleYaw),
          };
        } else {
          newAttachment.transform = {
            ...attachment.transform,
            location: [
              referencePoint.position.x * 100 + relativePosition[0],
              referencePoint.position.z * 100 + relativePosition[1],
              referencePoint.position.y * 100 + relativePosition[2]
            ],
            rotation: attachment.transform.rotation,
          };
        }
        
        targetDesign.attachments.push(newAttachment);
      } catch (error) {
        console.error("Error processing attachment:", error);
      }
    });
  }

  getParticleFieldYaw(point, options = {}) {
    const hasExplicitOption = Object.prototype.hasOwnProperty.call(options, "randomItemRotation");
    const randomRotationEnabled = hasExplicitOption
      ? Boolean(options.randomItemRotation)
      : Boolean(point.userData?.particleRandomRotation);

    if (!randomRotationEnabled) {
      return null;
    }

    if (!point.userData) {
      point.userData = {};
    }

    if (!Number.isFinite(point.userData.particleYaw)) {
      point.userData.particleYaw = Math.random() * Math.PI * 2;
    }

    return point.userData.particleYaw;
  }

  rotateMakePlaceFlatPosition(position, yaw) {
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    return [
      position[0] * cos - position[1] * sin,
      position[0] * sin + position[1] * cos,
      position[2],
    ];
  }

  composeYawRotation(rotation, yaw) {
    return this.multiplyQuaternions(
      [0, 0, Math.sin(yaw / 2), Math.cos(yaw / 2)],
      this.normalizeQuaternion(rotation)
    );
  }

  normalizeQuaternion(rotation) {
    if (!Array.isArray(rotation) || rotation.length !== 4) {
      return [0, 0, 0, 1];
    }

    const quaternion = rotation.map(Number);
    if (quaternion.some((value) => !Number.isFinite(value))) {
      return [0, 0, 0, 1];
    }

    return quaternion;
  }

  multiplyQuaternions(left, right) {
    const [ax, ay, az, aw] = left;
    const [bx, by, bz, bw] = right;
    return [
      aw * bx + ax * bw + ay * bz - az * by,
      aw * by - ax * bz + ay * bw + az * bx,
      aw * bz + ax * by - ay * bx + az * bw,
      aw * bw - ax * bx - ay * by - az * bz,
    ];
  }

  /**
   * Download the processed design as JSON file
   */
  downloadProcessedJSON(shapeType) {
    if (!this.processedDesign) {
      alert("No processed design available. Please process a design first.");
      return false;
    }

    try {
      const shapeTypeName = shapeType.charAt(0).toUpperCase() + shapeType.slice(1);
      const originalName = this.uploadedDesign?.name || this.uploadedParticleJumpTemplate?.name || "design";
      const fileName = `${originalName}_${shapeTypeName}.json`;

      const dataStr = "data:text/json;charset=utf-8," + 
        encodeURIComponent(JSON.stringify(this.processedDesign, null, 2));
      
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", fileName);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      return true;
    } catch (error) {
      alert(`Download Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Reset all uploaded files and processed designs
   */
  reset() {
    this.uploadedDesign = null;
    this.uploadedFloorDesign = null;
    this.uploadedRoomFloorDesign = null;
    this.uploadedParticleJumpTemplate = null;
    this.particleJumpTemplateMetrics = null;
    this.processedDesign = null;
    document.getElementById("processDesignBtn").style.display = "none";
    document.getElementById("downloadBtn").style.display = "none";
    this.setParticleJumpTemplateStatus("", false);
  }
}
