/**
 * Simple test framework for MakeWheel
 */
export class TestFramework {
  constructor() {
    this.currentSuite = null;
    this.tests = [];
  }

  /**
   * Create a test suite
   */
  describe(suiteName, callback) {
    this.currentSuite = {
      name: suiteName,
      tests: []
    };
    
    callback();
    
    const suite = this.currentSuite;
    this.currentSuite = null;
    return suite;
  }

  /**
   * Create a test case
   */
  it(testName, testFunction) {
    if (!this.currentSuite) {
      throw new Error('Test must be inside a describe block');
    }

    this.currentSuite.tests.push({
      name: testName,
      test: testFunction
    });
  }

  /**
   * Assertion methods
   */
  expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, but got ${actual}`);
        }
      },
      
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
        }
      },
      
      toBeCloseTo: (expected, tolerance = 0.01) => {
        if (Math.abs(actual - expected) > tolerance) {
          throw new Error(`Expected ${actual} to be close to ${expected} (tolerance: ${tolerance})`);
        }
      },
      
      toBeGreaterThan: (expected) => {
        if (actual <= expected) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
      },
      
      toBeLessThan: (expected) => {
        if (actual >= expected) {
          throw new Error(`Expected ${actual} to be less than ${expected}`);
        }
      },
      
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Expected ${actual} to be truthy`);
        }
      },
      
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Expected ${actual} to be falsy`);
        }
      },
      
      toThrow: () => {
        let threw = false;
        try {
          if (typeof actual === 'function') {
            actual();
          }
        } catch (e) {
          threw = true;
        }
        if (!threw) {
          throw new Error('Expected function to throw an error');
        }
      },
      
      toBeInstanceOf: (expectedClass) => {
        if (!(actual instanceof expectedClass)) {
          throw new Error(`Expected ${actual} to be an instance of ${expectedClass.name}`);
        }
      },
      
      toHaveLength: (expectedLength) => {
        if (!actual || actual.length !== expectedLength) {
          throw new Error(`Expected length ${expectedLength}, but got ${actual ? actual.length : 'undefined'}`);
        }
      },
      
      toContain: (expectedItem) => {
        if (!actual || !actual.includes(expectedItem)) {
          throw new Error(`Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expectedItem)}`);
        }
      }
    };
  }

  /**
   * Run a test suite
   */
  async runSuite(suite) {
    const results = {
      name: suite.name,
      tests: [],
      passed: 0,
      total: suite.tests.length
    };

    for (const test of suite.tests) {
      const testResult = {
        name: test.name,
        passed: false,
        log: ''
      };

      try {
        await test.test();
        testResult.passed = true;
        results.passed++;
      } catch (error) {
        testResult.passed = false;
        testResult.log = error.message;
        console.error(`Test failed: ${test.name}`, error);
      }

      results.tests.push(testResult);
    }

    return results;
  }

  /**
   * Create a mock object
   */
  createMock(methods = {}) {
    const mock = {};
    
    Object.keys(methods).forEach(method => {
      if (typeof methods[method] === 'function') {
        mock[method] = methods[method];
      } else {
        mock[method] = () => methods[method];
      }
    });
    
    return mock;
  }

  /**
   * Create a spy function
   */
  createSpy(name = 'spy') {
    const spy = function(...args) {
      spy.calls.push(args);
      spy.callCount++;
      return spy.returnValue;
    };
    
    spy.calls = [];
    spy.callCount = 0;
    spy.returnValue = undefined;
    spy.name = name;
    
    spy.wasCalledWith = (...expectedArgs) => {
      return spy.calls.some(call => 
        call.length === expectedArgs.length &&
        call.every((arg, index) => arg === expectedArgs[index])
      );
    };
    
    return spy;
  }
}