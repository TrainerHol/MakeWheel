/**
 * Validation utilities for user input
 */

/**
 * Validates a number input is within range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {string} name - Name of the field for error messages
 * @throws {Error} When validation fails
 * @returns {boolean} True if validation passes
 */
export function validateRange(value, min, max, name) {
  // Simple validation that throws on error (as expected by ShapeControllers)
  if (value === null || value === undefined || isNaN(value)) {
    throw new Error(`${name} is required and must be a number`);
  }
  
  if (value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }
  
  return true;
}

/**
 * Validates that a point is valid
 * @param {THREE.Vector3|Object} point - Point to validate
 * @param {string} name - Name of the point for error messages
 * @throws {Error} When validation fails
 * @returns {boolean} True if validation passes
 */
export function validatePoint(point, name) {
  if (!point) {
    throw new Error(`${name} is required`);
  }
  
  const x = point.x !== undefined ? point.x : point[0];
  const y = point.y !== undefined ? point.y : point[1];
  const z = point.z !== undefined ? point.z : point[2];
  
  if (x === undefined || y === undefined || z === undefined) {
    throw new Error(`${name} must have x, y, and z coordinates`);
  }
  
  if (isNaN(x) || isNaN(y) || isNaN(z)) {
    throw new Error(`${name} coordinates must be numbers`);
  }
  
  return true;
}

/**
 * Validates that two points are different
 * @param {THREE.Vector3|Object} point1 - First point
 * @param {THREE.Vector3|Object} point2 - Second point
 * @param {string} name1 - Name of first point
 * @param {string} name2 - Name of second point
 * @throws {Error} When validation fails
 * @returns {boolean} True if validation passes
 */
export function validatePointsDifferent(point1, point2, name1 = "Point 1", name2 = "Point 2") {
  if (!point1 || !point2) {
    throw new Error(`Both ${name1} and ${name2} are required`);
  }
  
  const epsilon = 0.0001;
  const dx = Math.abs(point1.x - point2.x);
  const dy = Math.abs(point1.y - point2.y);
  const dz = Math.abs(point1.z - point2.z);
  
  if (dx < epsilon && dy < epsilon && dz < epsilon) {
    throw new Error(`${name1} and ${name2} must be at different locations`);
  }
  
  return true;
}

/**
 * Validates a file is a valid JSON file
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export function validateJsonFile(file) {
  if (!file) {
    throw new Error('No file selected');
  }
  
  if (!file.name.toLowerCase().endsWith('.json')) {
    throw new Error('File must be a JSON file (.json extension)');
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('File size must be less than 10MB');
  }
  
  return true;
}

/**
 * Validates JSON content
 * @param {string} jsonString - JSON string to validate
 * @returns {Object} Validation result with parsed data
 */
export function validateJsonContent(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    return { valid: true, error: null, data };
  } catch (error) {
    return { valid: false, error: `Invalid JSON: ${error.message}`, data: null };
  }
}

/**
 * Validates input field value from DOM element
 * @param {HTMLElement} element - Input element
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} name - Field name for error messages
 * @returns {Object} Validation result with parsed value
 */
export function validateInputField(element, min, max, name) {
  if (!element) {
    throw new Error(`${name} input field not found`);
  }
  
  const value = parseFloat(element.value);
  
  if (isNaN(value)) {
    throw new Error(`${name} must be a valid number`);
  }
  
  // Call validateRange which now throws on error
  validateRange(value, min, max, name);
  
  return value;
}

/**
 * Shows an error message to the user
 * @param {string} message - Error message to display
 * @param {string} title - Optional title for the error
 */
export function showError(message, title = 'Error') {
  console.error(`${title}: ${message}`);
  alert(`${title}: ${message}`);
}

/**
 * Shows a success message to the user
 * @param {string} message - Success message to display
 */
export function showSuccess(message) {
  console.log(`Success: ${message}`);
  // Could be enhanced to show a non-blocking success notification
}

/**
 * Validates common shape parameters
 * @param {Object} params - Parameters to validate
 * @returns {Object} Validation result
 */
export function validateShapeParams(params) {
  const {
    segments = 0,
    turns = 0,
    radius = 0,
    height = 0,
    width = 0,
    rows = 0,
    columns = 0,
    spacing = 0
  } = params;
  
  const validations = [];
  
  if (segments !== undefined && segments !== 0) {
    validations.push(validateRange(segments, 1, 200, 'Segments'));
  }
  
  if (turns !== undefined && turns !== 0) {
    validations.push(validateRange(turns, 0.1, 20, 'Turns'));
  }
  
  if (radius !== undefined && radius !== 0) {
    validations.push(validateRange(radius, 0.1, 200, 'Radius'));
  }
  
  if (height !== undefined && height !== 0) {
    validations.push(validateRange(height, 0.1, 200, 'Height'));
  }
  
  if (width !== undefined && width !== 0) {
    validations.push(validateRange(width, 2, 50, 'Width'));
  }
  
  if (rows !== undefined && rows !== 0) {
    validations.push(validateRange(rows, 2, 20, 'Rows'));
  }
  
  if (columns !== undefined && columns !== 0) {
    validations.push(validateRange(columns, 2, 20, 'Columns'));
  }
  
  if (spacing !== undefined && spacing !== 0) {
    validations.push(validateRange(spacing, 0.1, 50, 'Spacing'));
  }
  
  // Check if any validation failed
  for (const validation of validations) {
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true, error: null };
}