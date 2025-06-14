/**
 * Integration tests for UI modules
 */
export class UITests {
  constructor(testFramework) {
    this.framework = testFramework;
    this.name = 'UI Tests';
    this.type = 'integration';
  }

  async runAll() {
    // Setup DOM elements for testing
    this.setupTestDOM();

    const fileHandlersSuite = this.framework.describe('FileHandlers', () => {
      this.framework.it('should create FileHandlers instance', async () => {
        const { FileHandlers } = await import('../modules/ui/FileHandlers.js');
        const fileHandlers = new FileHandlers();
        
        this.framework.expect(fileHandlers.uploadedDesign).toBe(null);
        this.framework.expect(fileHandlers.processedDesign).toBe(null);
      });

      this.framework.it('should reset file handlers correctly', async () => {
        const { FileHandlers } = await import('../modules/ui/FileHandlers.js');
        const fileHandlers = new FileHandlers();
        
        // Set some data
        fileHandlers.uploadedDesign = { name: 'test' };
        fileHandlers.processedDesign = { name: 'processed' };
        
        // Reset
        fileHandlers.reset();
        
        this.framework.expect(fileHandlers.uploadedDesign).toBe(null);
        this.framework.expect(fileHandlers.processedDesign).toBe(null);
      });
    });

    const coordinatesDisplaySuite = this.framework.describe('CoordinatesDisplay', () => {
      this.framework.it('should create CoordinatesDisplay instance', async () => {
        const { CoordinatesDisplay } = await import('../modules/ui/CoordinatesDisplay.js');
        
        const mockWheel = this.createMockShape();
        const mockMaze = this.createMockShape();
        const mockMaze3d = this.createMockShape();
        
        const coordsDisplay = new CoordinatesDisplay(mockWheel, mockMaze, mockMaze3d);
        
        this.framework.expect(coordsDisplay.useMakePlaceFormat).toBe(false);
      });

      this.framework.it('should set MakePlace format correctly', async () => {
        const { CoordinatesDisplay } = await import('../modules/ui/CoordinatesDisplay.js');
        
        const mockWheel = this.createMockShape();
        const mockMaze = this.createMockShape();
        const mockMaze3d = this.createMockShape();
        
        const coordsDisplay = new CoordinatesDisplay(mockWheel, mockMaze, mockMaze3d);
        
        coordsDisplay.setMakePlaceFormat(true);
        this.framework.expect(coordsDisplay.useMakePlaceFormat).toBe(true);
        
        coordsDisplay.setMakePlaceFormat(false);
        this.framework.expect(coordsDisplay.useMakePlaceFormat).toBe(false);
      });

      this.framework.it('should get points for different shape types', async () => {
        const { CoordinatesDisplay } = await import('../modules/ui/CoordinatesDisplay.js');
        
        const mockWheel = this.createMockShape([{ position: { x: 1, y: 2, z: 3 } }]);
        const mockMaze = this.createMockShape([{ position: { x: 4, y: 5, z: 6 } }]);
        const mockMaze3d = this.createMockShape([{ position: { x: 7, y: 8, z: 9 } }]);
        
        const coordsDisplay = new CoordinatesDisplay(mockWheel, mockMaze, mockMaze3d);
        
        const wheelPoints = coordsDisplay.getPointsForShape('wheel');
        const mazePoints = coordsDisplay.getPointsForShape('maze');
        const maze3dPoints = coordsDisplay.getPointsForShape('maze3d');
        
        this.framework.expect(wheelPoints).toHaveLength(1);
        this.framework.expect(mazePoints).toHaveLength(1);
        this.framework.expect(maze3dPoints).toHaveLength(1);
        
        this.framework.expect(wheelPoints[0].position.x).toBe(1);
        this.framework.expect(mazePoints[0].position.x).toBe(4);
        this.framework.expect(maze3dPoints[0].position.x).toBe(7);
      });
    });

    const cameraControlsSuite = this.framework.describe('CameraControls', () => {
      this.framework.it('should create CameraControls instance', async () => {
        const { CameraControls } = await import('../modules/ui/CameraControls.js');
        
        const mockSceneManager = this.createMockSceneManager();
        const cameraControls = new CameraControls(mockSceneManager);
        
        this.framework.expect(cameraControls.isDragging).toBe(false);
        this.framework.expect(cameraControls.isInitialized).toBe(false);
      });

      this.framework.it('should convert degrees to radians correctly', async () => {
        const { CameraControls } = await import('../modules/ui/CameraControls.js');
        
        const mockSceneManager = this.createMockSceneManager();
        const cameraControls = new CameraControls(mockSceneManager);
        
        this.framework.expect(cameraControls.toRadians(0)).toBeCloseTo(0);
        this.framework.expect(cameraControls.toRadians(90)).toBeCloseTo(Math.PI / 2);
        this.framework.expect(cameraControls.toRadians(180)).toBeCloseTo(Math.PI);
        this.framework.expect(cameraControls.toRadians(360)).toBeCloseTo(2 * Math.PI);
      });

      this.framework.it('should calculate bounding box correctly', async () => {
        const { CameraControls } = await import('../modules/ui/CameraControls.js');
        
        const mockSceneManager = this.createMockSceneManager();
        const cameraControls = new CameraControls(mockSceneManager);
        
        const points = [
          { position: { x: -5, y: -3, z: -1 } },
          { position: { x: 5, y: 3, z: 1 } },
          { position: { x: 0, y: 0, z: 0 } }
        ];
        
        const boundingBox = cameraControls.calculateBoundingBox(points);
        
        this.framework.expect(boundingBox.min.x).toBe(-5);
        this.framework.expect(boundingBox.min.y).toBe(-3);
        this.framework.expect(boundingBox.min.z).toBe(-1);
        this.framework.expect(boundingBox.max.x).toBe(5);
        this.framework.expect(boundingBox.max.y).toBe(3);
        this.framework.expect(boundingBox.max.z).toBe(1);
      });
    });

    // Run all test suites
    const fileHandlersResults = await this.framework.runSuite(fileHandlersSuite);
    const coordsDisplayResults = await this.framework.runSuite(coordinatesDisplaySuite);
    const cameraControlsResults = await this.framework.runSuite(cameraControlsSuite);

    // Clean up test DOM
    this.cleanupTestDOM();

    // Combine results
    return {
      tests: [
        ...fileHandlersResults.tests,
        ...coordsDisplayResults.tests,
        ...cameraControlsResults.tests
      ],
      passed: fileHandlersResults.passed + coordsDisplayResults.passed + cameraControlsResults.passed,
      total: fileHandlersResults.total + coordsDisplayResults.total + cameraControlsResults.total
    };
  }

  setupTestDOM() {
    // Create minimal DOM elements needed for testing
    if (!document.getElementById('coordinates')) {
      const coordsDiv = document.createElement('div');
      coordsDiv.id = 'coordinates';
      document.body.appendChild(coordsDiv);
    }

    if (!document.getElementById('processDesignBtn')) {
      const btn = document.createElement('button');
      btn.id = 'processDesignBtn';
      btn.style.display = 'none';
      document.body.appendChild(btn);
    }

    if (!document.getElementById('downloadBtn')) {
      const btn = document.createElement('button');
      btn.id = 'downloadBtn';
      btn.style.display = 'none';
      document.body.appendChild(btn);
    }
  }

  cleanupTestDOM() {
    // Remove test DOM elements
    const elementsToRemove = ['coordinates', 'processDesignBtn', 'downloadBtn'];
    elementsToRemove.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    });
  }

  createMockShape(points = []) {
    return {
      allPoints: points,
      highlightPoint: this.framework.createSpy('highlightPoint'),
      resetPointColor: this.framework.createSpy('resetPointColor')
    };
  }

  createMockSceneManager() {
    return {
      camera: {
        position: {
          x: 0, y: 0, z: 100,
          set: this.framework.createSpy('set'),
          length: () => 100,
          normalize: () => ({ multiplyScalar: this.framework.createSpy('multiplyScalar') }),
          applyQuaternion: this.framework.createSpy('applyQuaternion')
        },
        lookAt: this.framework.createSpy('lookAt')
      },
      scene: {
        position: { x: 0, y: 0, z: 0 }
      }
    };
  }
}