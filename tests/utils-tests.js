import { validateRange, validatePoint, validatePointsDifferent, validateJsonFile } from '../modules/utils/validators.js';
import { COLORS, SIZES, DEFAULTS } from '../modules/utils/constants.js';

/**
 * Unit tests for utility modules
 */
export class UtilsTests {
  constructor(testFramework) {
    this.framework = testFramework;
    this.name = 'Utils Tests';
    this.type = 'unit';
  }

  async runAll() {
    const validatorSuite = this.framework.describe('Validators', () => {
      this.framework.it('should validate numeric ranges correctly', () => {
        // Valid ranges
        this.framework.expect(() => validateRange(5, 1, 10, 'Test')).not.toThrow();
        this.framework.expect(() => validateRange(1, 1, 10, 'Test')).not.toThrow();
        this.framework.expect(() => validateRange(10, 1, 10, 'Test')).not.toThrow();
        
        // Invalid ranges
        this.framework.expect(() => validateRange(0, 1, 10, 'Test')).toThrow();
        this.framework.expect(() => validateRange(11, 1, 10, 'Test')).toThrow();
        this.framework.expect(() => validateRange(NaN, 1, 10, 'Test')).toThrow();
      });

      this.framework.it('should validate 3D points correctly', () => {
        const validPoint = { x: 1, y: 2, z: 3 };
        const invalidPoint1 = { x: NaN, y: 2, z: 3 };
        const invalidPoint2 = { x: 1, y: 2 }; // missing z
        const invalidPoint3 = null;

        this.framework.expect(() => validatePoint(validPoint, 'Test Point')).not.toThrow();
        this.framework.expect(() => validatePoint(invalidPoint1, 'Test Point')).toThrow();
        this.framework.expect(() => validatePoint(invalidPoint2, 'Test Point')).toThrow();
        this.framework.expect(() => validatePoint(invalidPoint3, 'Test Point')).toThrow();
      });

      this.framework.it('should validate that points are different', () => {
        const point1 = { x: 1, y: 2, z: 3 };
        const point2 = { x: 4, y: 5, z: 6 };
        const point3 = { x: 1, y: 2, z: 3 };

        this.framework.expect(() => validatePointsDifferent(point1, point2)).not.toThrow();
        this.framework.expect(() => validatePointsDifferent(point1, point3)).toThrow();
      });

      this.framework.it('should validate JSON files correctly', () => {
        const validFile = { name: 'test.json', type: 'application/json', size: 1024 };
        const invalidFile1 = { name: 'test.txt', type: 'text/plain', size: 1024 };
        const invalidFile2 = { name: 'test.json', type: 'application/json', size: 10 * 1024 * 1024 }; // Too large
        const invalidFile3 = null;

        this.framework.expect(() => validateJsonFile(validFile)).not.toThrow();
        this.framework.expect(() => validateJsonFile(invalidFile1)).toThrow();
        this.framework.expect(() => validateJsonFile(invalidFile2)).toThrow();
        this.framework.expect(() => validateJsonFile(invalidFile3)).toThrow();
      });
    });

    const constantsSuite = this.framework.describe('Constants', () => {
      this.framework.it('should have all required color constants', () => {
        this.framework.expect(COLORS.POINT).toBeTruthy();
        this.framework.expect(COLORS.CENTER).toBeTruthy();
        this.framework.expect(COLORS.HIGHLIGHT).toBeTruthy();
        this.framework.expect(typeof COLORS.POINT).toBe('number');
      });

      this.framework.it('should have all required size constants', () => {
        this.framework.expect(SIZES.DEFAULT_SPHERE).toBeGreaterThan(0);
        this.framework.expect(SIZES.AXIS_LENGTH).toBeGreaterThan(0);
        this.framework.expect(typeof SIZES.DEFAULT_SPHERE).toBe('number');
      });

      this.framework.it('should have sensible default values', () => {
        this.framework.expect(DEFAULTS.WHEEL.REPETITIONS).toBeGreaterThan(0);
        this.framework.expect(DEFAULTS.SPIRAL.SEGMENTS).toBeGreaterThan(0);
        this.framework.expect(DEFAULTS.GRID.ROWS).toBeGreaterThan(0);
      });

      this.framework.it('should have proper mathematical constants', () => {
        this.framework.expect(COLORS.POINT).toBeGreaterThan(0);
        this.framework.expect(COLORS.POINT).toBeLessThan(0xFFFFFF);
      });
    });

    // Run all test suites
    const validatorResults = await this.framework.runSuite(validatorSuite);
    const constantsResults = await this.framework.runSuite(constantsSuite);

    // Combine results
    return {
      tests: [...validatorResults.tests, ...constantsResults.tests],
      passed: validatorResults.passed + constantsResults.passed,
      total: validatorResults.total + constantsResults.total
    };
  }
}