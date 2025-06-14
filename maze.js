// This file now serves as a compatibility wrapper for the refactored Maze2D module
// It re-exports the Maze2D class as Maze to maintain backward compatibility

import { Maze2D } from './modules/mazes/Maze2D.js';

/**
 * Legacy Maze class that wraps Maze2D for backward compatibility
 */
export class Maze extends Maze2D {
  constructor(scene) {
    super(scene);
  }

  /**
   * Legacy generateMaze method that maps to the new generate method
   */
  generateMaze(itemLength, itemWidth, itemHeight, width, height = width) {
    return this.generate({
      itemLength,
      itemWidth,
      itemHeight,
      width,
      height
    });
  }
}