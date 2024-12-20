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

    const axisLength = 60;
    const axisColor = 0xffffff;
    const axisWidth = 2;

    const xAxis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-axisLength, 0, 0), new THREE.Vector3(axisLength, 0, 0)]), new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: axisWidth }));
    const yAxis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -axisLength, 0), new THREE.Vector3(0, axisLength, 0)]), new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: axisWidth }));
    const zAxis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -axisLength), new THREE.Vector3(0, 0, axisLength)]), new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: axisWidth }));

    this.planeVisualization.add(xAxis, yAxis, zAxis);

    const loader = new THREE.FontLoader();
    loader.load("https://threejs.org/examples/fonts/helvetiker_regular.typeface.json", (font) => {
      const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

      const xText = new THREE.Mesh(new THREE.TextGeometry("X", { font: font, size: 3, height: 0.1 }), textMaterial);
      xText.position.set(axisLength + 2, 0, 0);

      const yText = new THREE.Mesh(new THREE.TextGeometry("Y", { font: font, size: 3, height: 0.1 }), textMaterial);
      yText.position.set(0, axisLength + 2, 0);

      const zText = new THREE.Mesh(new THREE.TextGeometry("Z", { font: font, size: 3, height: 0.1 }), textMaterial);
      zText.position.set(0, 0, axisLength + 2);

      this.planeVisualization.add(xText, yText, zText);
    });

    const gridSize = 100;
    const gridDivisions = 10;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions);
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
    this.renderer.render(this.scene, this.camera);
  }
}
