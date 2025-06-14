import { FILE } from '../utils/constants.js';

/**
 * Manages the coordinates list display and interactions
 */
export class CoordinatesDisplay {
  constructor(wheel, maze, maze3d) {
    this.wheel = wheel;
    this.maze = maze;
    this.maze3d = maze3d;
    this.useMakePlaceFormat = false;
  }

  /**
   * Set the coordinate format (MakePlace or standard)
   */
  setMakePlaceFormat(useMakePlace) {
    this.useMakePlaceFormat = useMakePlace;
  }

  /**
   * Update the coordinates list display
   */
  updateCoordinatesList(shapeType) {
    const coordinatesDiv = document.getElementById("coordinates");
    if (!coordinatesDiv) return;

    coordinatesDiv.innerHTML = "";

    const points = this.getPointsForShape(shapeType);
    if (!points || points.length === 0) return;

    const addCoordinate = (name, point, index) => {
      let x = point.position.x;
      let y = point.position.y;
      let z = point.position.z;

      if (this.useMakePlaceFormat) {
        // Convert to MakePlace format: scale by 100, swap Y/Z
        x = (x * 100).toFixed(FILE.MAKEPLACE_PRECISION);
        let temp = y;
        y = (z * 100).toFixed(FILE.MAKEPLACE_PRECISION);
        z = (temp * 100).toFixed(FILE.MAKEPLACE_PRECISION);
      } else {
        // Standard format with specified precision
        x = x.toFixed(FILE.COORDINATE_PRECISION);
        y = y.toFixed(FILE.COORDINATE_PRECISION);
        z = z.toFixed(FILE.COORDINATE_PRECISION);
      }

      const coordStr = `${x}, ${y}, ${z}`;
      const div = document.createElement("div");
      div.className = "coordinate-item";
      div.innerHTML = `${name}: (${coordStr}) <span class="copy-btn" data-coord="${coordStr}">Copy</span>`;
      
      // Add hover effects for point highlighting
      div.addEventListener("mouseenter", () => {
        this.highlightPoint(shapeType, index);
      });
      
      div.addEventListener("mouseleave", () => {
        this.resetPointColor(shapeType, index);
      });
      
      coordinatesDiv.appendChild(div);
    };

    points.forEach((point, index) => {
      addCoordinate(`Point ${index + 1}`, point, index);
    });

    this.setupCopyButtons();
  }

  /**
   * Get points array based on shape type
   */
  getPointsForShape(shapeType) {
    switch (shapeType) {
      case "maze":
        return this.maze.allPoints;
      case "maze3d":
        return this.maze3d.allPoints;
      default:
        return this.wheel.allPoints;
    }
  }

  /**
   * Highlight a point in the 3D scene
   */
  highlightPoint(shapeType, index) {
    switch (shapeType) {
      case "maze":
        this.maze.highlightPoint(index);
        break;
      case "maze3d":
        this.maze3d.highlightPoint(index);
        break;
      default:
        this.wheel.highlightPoint(index);
        break;
    }
  }

  /**
   * Reset point color in the 3D scene
   */
  resetPointColor(shapeType, index) {
    switch (shapeType) {
      case "maze":
        this.maze.resetPointColor(index);
        break;
      case "maze3d":
        this.maze3d.resetPointColor(index);
        break;
      default:
        this.wheel.resetPointColor(index);
        break;
    }
  }

  /**
   * Setup copy functionality for coordinate buttons
   */
  setupCopyButtons() {
    const copyButtons = document.getElementsByClassName("copy-btn");
    for (let btn of copyButtons) {
      // Remove existing listeners to prevent duplicates
      btn.replaceWith(btn.cloneNode(true));
    }

    // Add new listeners
    const newCopyButtons = document.getElementsByClassName("copy-btn");
    for (let btn of newCopyButtons) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const coord = this.getAttribute("data-coord");
        
        navigator.clipboard.writeText(coord).then(() => {
          const originalText = this.textContent;
          this.textContent = "Copied!";
          this.style.color = "#4CAF50";
          
          setTimeout(() => {
            this.textContent = originalText;
            this.style.color = "";
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy coordinate:', err);
          // Fallback for older browsers
          this.textContent = "Copy Failed";
          setTimeout(() => {
            this.textContent = "Copy";
          }, 2000);
        });
      });
    }
  }

  /**
   * Clear the coordinates list
   */
  clear() {
    const coordinatesDiv = document.getElementById("coordinates");
    if (coordinatesDiv) {
      coordinatesDiv.innerHTML = "";
    }
  }

  /**
   * Export coordinates as CSV
   */
  exportAsCSV(shapeType) {
    const points = this.getPointsForShape(shapeType);
    if (!points || points.length === 0) {
      alert("No coordinates to export");
      return;
    }

    let csvContent = "Point,X,Y,Z\n";
    
    points.forEach((point, index) => {
      let x = point.position.x;
      let y = point.position.y;
      let z = point.position.z;

      if (this.useMakePlaceFormat) {
        x = (x * 100).toFixed(FILE.MAKEPLACE_PRECISION);
        let temp = y;
        y = (z * 100).toFixed(FILE.MAKEPLACE_PRECISION);
        z = (temp * 100).toFixed(FILE.MAKEPLACE_PRECISION);
      } else {
        x = x.toFixed(FILE.COORDINATE_PRECISION);
        y = y.toFixed(FILE.COORDINATE_PRECISION);
        z = z.toFixed(FILE.COORDINATE_PRECISION);
      }

      csvContent += `Point ${index + 1},${x},${y},${z}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${shapeType}_coordinates.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}