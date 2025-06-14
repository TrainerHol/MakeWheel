import { validateJsonFile } from '../utils/validators.js';

/**
 * Handles file upload, download, processing and JSON operations
 */
export class FileHandlers {
  constructor() {
    this.uploadedDesign = null;
    this.uploadedFloorDesign = null;
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
   * Process uploaded design with generated shape points
   */
  processDesign(shapeType, wheel, maze, maze3d) {
    if (!this.uploadedDesign) {
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
        ...this.uploadedDesign,
        attachments: [],
      };

      delete this.processedDesign.transform;

      points.forEach((point, index) => {
        let designToUse = this.uploadedDesign;

        // For 3D maze, use floor design for floor pieces
        if (shapeType === "maze3d" && point.userData && point.userData.type === "floor") {
          designToUse = this.uploadedFloorDesign || this.uploadedDesign;
        }

        const newAttachment = {
          ...designToUse,
          transform: {
            location: [point.position.x * 100, point.position.z * 100, point.position.y * 100], // Swap Y/Z for Unreal
            rotation: this.calculateRotation(shapeType, point, designToUse),
            scale: designToUse.transform.scale,
          },
        };
        
        delete newAttachment.attachments;
        this.processedDesign.attachments.push(newAttachment);

        // Process nested attachments
        this.processAttachments(designToUse, newAttachment, point, shapeType);
      });

      console.log("Design processed successfully");
      document.getElementById("downloadBtn").style.display = "block";
      return true;
    } catch (error) {
      alert(`Design Processing Error: ${error.message}`);
      return false;
    }
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
      default:
        return wheel.allPoints;
    }
  }

  /**
   * Calculate rotation for different shape types
   */
  calculateRotation(shapeType, point, designToUse) {
    if (shapeType === "maze" || shapeType === "maze3d") {
      // Add PI/2 to align with MakePlace for maze walls
      const angle = point.rotation.y + Math.PI / 2;
      return [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)];
    } else {
      return designToUse.transform.rotation;
    }
  }

  /**
   * Process nested attachments recursively
   */
  processAttachments(originalDesign, targetDesign, referencePoint, shapeType) {
    if (!originalDesign.attachments) return;

    if (!targetDesign.attachments) {
      targetDesign.attachments = [];
    }

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
      const originalName = this.uploadedDesign.name || "design";
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
    this.processedDesign = null;
    document.getElementById("processDesignBtn").style.display = "none";
    document.getElementById("downloadBtn").style.display = "none";
  }
}