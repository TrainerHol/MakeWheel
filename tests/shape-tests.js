/**
 * Unit tests for shape generation modules
 */
export class ShapeTests {
  constructor(testFramework) {
    this.framework = testFramework;
    this.name = 'Shape Tests';
    this.type = 'unit';
  }

  async runAll() {
    // Create mock scene for testing
    const mockScene = {
      add: this.framework.createSpy('add'),
      remove: this.framework.createSpy('remove')
    };

    // Mock THREE.js objects
    global.THREE = {
      Vector3: class {
        constructor(x = 0, y = 0, z = 0) {
          this.x = x;
          this.y = y;
          this.z = z;
        }
        
        addVectors(a, b) {
          this.x = a.x + b.x;
          this.y = a.y + b.y;
          this.z = a.z + b.z;
          return this;
        }
        
        multiplyScalar(scalar) {
          this.x *= scalar;
          this.y *= scalar;
          this.z *= scalar;
          return this;
        }
        
        subVectors(a, b) {
          this.x = a.x - b.x;
          this.y = a.y - b.y;
          this.z = a.z - b.z;
          return this;
        }
        
        normalize() {
          const length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
          if (length > 0) {
            this.x /= length;
            this.y /= length;
            this.z /= length;
          }
          return this;
        }
        
        copy(v) {
          this.x = v.x;
          this.y = v.y;
          this.z = v.z;
          return this;
        }
      },
      
      SphereGeometry: class {
        constructor(radius) {
          this.radius = radius;
        }
      },
      
      MeshPhongMaterial: class {
        constructor(params) {
          this.color = params.color;
        }
      },
      
      Mesh: class {
        constructor(geometry, material) {
          this.geometry = geometry;
          this.material = material;
          this.position = new global.THREE.Vector3();
        }
      },
      
      MathUtils: {
        degToRad: (degrees) => degrees * (Math.PI / 180)
      }
    };

    const baseShapeSuite = this.framework.describe('BaseShape', () => {
      this.framework.it('should create a BaseShape instance', async () => {
        const { BaseShape } = await import('../modules/base/BaseShape.js');
        const baseShape = new BaseShape(mockScene);
        
        this.framework.expect(baseShape).toBeInstanceOf(BaseShape);
        this.framework.expect(baseShape.scene).toBe(mockScene);
        this.framework.expect(baseShape.allPoints).toHaveLength(0);
      });

      this.framework.it('should create spheres correctly', async () => {
        const { BaseShape } = await import('../modules/base/BaseShape.js');
        const baseShape = new BaseShape(mockScene);
        
        const position = new global.THREE.Vector3(1, 2, 3);
        const sphere = baseShape.createSphere(position, 0xff0000, 2);
        
        this.framework.expect(sphere).toBeTruthy();
        this.framework.expect(sphere.position.x).toBe(1);
        this.framework.expect(sphere.position.y).toBe(2);
        this.framework.expect(sphere.position.z).toBe(3);
      });
    });

    const wheelSuite = this.framework.describe('Wheel Shape', () => {
      this.framework.it('should create a Wheel instance', async () => {
        const { Wheel } = await import('../modules/shapes/Wheel.js');
        const wheel = new Wheel(mockScene);
        
        this.framework.expect(wheel.shapeType).toBe('wheel');
        this.framework.expect(wheel.allPoints).toHaveLength(0);
      });

      this.framework.it('should generate wheel points', async () => {
        const { Wheel } = await import('../modules/shapes/Wheel.js');
        const wheel = new Wheel(mockScene);
        
        const point1 = new global.THREE.Vector3(25, 0, 0);
        const point2 = new global.THREE.Vector3(-25, 0, 0);
        
        wheel.generate({
          point1Coords: point1,
          point2Coords: point2,
          repetitions: 8,
          segments: 0,
          planeAngle: 0
        });
        
        // Should have 2 reference points + 1 center + 8 repetition points = 11 total
        this.framework.expect(wheel.allPoints.length).toBeGreaterThan(10);
      });
    });

    const spiralSuite = this.framework.describe('Spiral Shape', () => {
      this.framework.it('should create a Spiral instance', async () => {
        const { Spiral } = await import('../modules/shapes/Spiral.js');
        const spiral = new Spiral(mockScene);
        
        this.framework.expect(spiral.shapeType).toBe('spiral');
        this.framework.expect(spiral.allPoints).toHaveLength(0);
      });

      this.framework.it('should generate spiral points', async () => {
        const { Spiral } = await import('../modules/shapes/Spiral.js');
        const spiral = new Spiral(mockScene);
        
        const center = new global.THREE.Vector3(0, 0, 0);
        const start = new global.THREE.Vector3(25, 0, 0);
        
        spiral.generate({
          centerPoint: center,
          startPoint: start,
          direction: 'clockwise',
          segments: 50,
          turns: 2
        });
        
        // Should have generated points plus center point
        this.framework.expect(spiral.allPoints.length).toBeGreaterThan(25);
      });
    });

    const gridSuite = this.framework.describe('Grid Shape', () => {
      this.framework.it('should create a Grid instance', async () => {
        const { Grid } = await import('../modules/shapes/Grid.js');
        const grid = new Grid(mockScene);
        
        this.framework.expect(grid.shapeType).toBe('grid');
        this.framework.expect(grid.allPoints).toHaveLength(0);
      });

      this.framework.it('should generate grid points', async () => {
        const { Grid } = await import('../modules/shapes/Grid.js');
        const grid = new Grid(mockScene);
        
        const center = new global.THREE.Vector3(0, 0, 0);
        
        grid.generate({
          centerPoint: center,
          rows: 3,
          columns: 3,
          spacing: 4,
          stepAmount: 2,
          floors: 1
        });
        
        // 3x3 grid should have 9 points
        this.framework.expect(grid.allPoints.length).toBe(9);
      });
    });

    // Run all test suites
    const baseShapeResults = await this.framework.runSuite(baseShapeSuite);
    const wheelResults = await this.framework.runSuite(wheelSuite);
    const spiralResults = await this.framework.runSuite(spiralSuite);
    const gridResults = await this.framework.runSuite(gridSuite);

    // Combine results
    return {
      tests: [
        ...baseShapeResults.tests,
        ...wheelResults.tests,
        ...spiralResults.tests,
        ...gridResults.tests
      ],
      passed: baseShapeResults.passed + wheelResults.passed + spiralResults.passed + gridResults.passed,
      total: baseShapeResults.total + wheelResults.total + spiralResults.total + gridResults.total
    };
  }
}