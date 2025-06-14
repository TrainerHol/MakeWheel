// This file now serves as a compatibility wrapper for the refactored Maze3D module
// It re-exports the Maze3D class to maintain backward compatibility

import { Maze3D as Maze3DModule } from './modules/mazes/Maze3D.js';

/**
 * Legacy Maze3D class that wraps the refactored Maze3D for backward compatibility
 */
export class Maze3D extends Maze3DModule {
  constructor(scene) {
    super(scene);
  }

  /**
   * Legacy generateMaze3D method that maps to the new generate method
   */
  generateMaze3D(itemLength, itemWidth, itemHeight, floorLength, floorWidth, width, height = width, floors = 2) {
    return this.generate({
      itemLength,
      itemWidth,
      itemHeight,
      floorLength,
      floorWidth,
      width,
      height,
      floors
    });
  }

  /**
   * Alternative method name for compatibility with UI controllers
   */
  generateMaze(floorLength, floorWidth, gridWidth, gridHeight, floors) {
    return this.generate({
      itemLength: floorLength,
      itemWidth: 1, // Default wall width
      itemHeight: 6, // Default wall height
      floorLength,
      floorWidth,
      width: gridWidth,
      height: gridHeight,
      floors
    });
  }
}