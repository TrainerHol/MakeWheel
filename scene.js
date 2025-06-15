import { COLORS, SIZES } from './modules/utils/constants.js';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.planeVisualization = null;
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);

    this.createPlaneVisualization();
    this.resetCamera();

    window.addEventListener("resize", () => this.onWindowResize(), false);
  }

  createPlaneVisualization() {
    this.planeVisualization = new THREE.Group();

    const axisLength = SIZES.AXIS_LENGTH;
    const axisWidth = SIZES.AXIS_WIDTH;

    // Create slightly thicker axes using cylinder geometry to avoid grid conflicts
    const axisRadius = 0.1; // Just slightly thicker than grid lines
    
    // X axis (red)
    const xGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength * 2, 8);
    const xMaterial = new THREE.MeshBasicMaterial({ color: COLORS.AXIS_X });
    const xAxis = new THREE.Mesh(xGeometry, xMaterial);
    xAxis.rotation.z = Math.PI / 2; // Rotate to align with X axis
    
    // Y axis (green) 
    const yGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength * 2, 8);
    const yMaterial = new THREE.MeshBasicMaterial({ color: COLORS.AXIS_Y });
    const yAxis = new THREE.Mesh(yGeometry, yMaterial);
    // Y axis is already aligned correctly
    
    // Z axis (blue)
    const zGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength * 2, 8);
    const zMaterial = new THREE.MeshBasicMaterial({ color: COLORS.AXIS_Z });
    const zAxis = new THREE.Mesh(zGeometry, zMaterial);
    zAxis.rotation.x = Math.PI / 2; // Rotate to align with Z axis

    this.planeVisualization.add(xAxis, yAxis, zAxis);

    const loader = new THREE.FontLoader();
    loader.load("https://threejs.org/examples/fonts/helvetiker_regular.typeface.json", (font) => {
      const textMaterial = new THREE.MeshBasicMaterial({ color: COLORS.TEXT });

      const xText = new THREE.Mesh(
        new THREE.TextGeometry("X", { 
          font: font, 
          size: SIZES.TEXT_SIZE, 
          height: SIZES.TEXT_HEIGHT 
        }), 
        textMaterial
      );
      xText.position.set(axisLength + SIZES.TEXT_OFFSET, 0, 0);

      const yText = new THREE.Mesh(
        new THREE.TextGeometry("Y", { 
          font: font, 
          size: SIZES.TEXT_SIZE, 
          height: SIZES.TEXT_HEIGHT 
        }), 
        textMaterial
      );
      yText.position.set(0, axisLength + SIZES.TEXT_OFFSET, 0);

      const zText = new THREE.Mesh(
        new THREE.TextGeometry("Z", { 
          font: font, 
          size: SIZES.TEXT_SIZE, 
          height: SIZES.TEXT_HEIGHT 
        }), 
        textMaterial
      );
      zText.position.set(0, 0, axisLength + SIZES.TEXT_OFFSET);

      this.planeVisualization.add(xText, yText, zText);
    });

    const gridSize = SIZES.GRID_SIZE;
    const gridDivisions = SIZES.GRID_DIVISIONS;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions);
    
    // Grid is back! Axes are now slightly thicker to stand out from grid
    this.planeVisualization.add(gridHelper);

    this.scene.add(this.planeVisualization);
  }

  resetCamera(centerPoint) {
    if (centerPoint) {
      const position = centerPoint.position || centerPoint;
      this.camera.position.set(position.x, position.y, position.z + 100);
      this.camera.lookAt(position);
    } else {
      this.camera.position.set(0, 0, 100);
      this.camera.lookAt(this.scene.position);
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Update camera controls if they exist
    if (this.cameraControls) {
      this.cameraControls.update();
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  setCameraControls(cameraControls) {
    this.cameraControls = cameraControls;
  }
}
