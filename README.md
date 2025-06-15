# MakeWheel by Hol

## Link

[You can use this tool from here](https://trainerhol.github.io/MakeWheel/)

## Overview

MakeWheel is a web-based tool for creating geometric patterns and designs that can be imported into MakePlace (a Final Fantasy XIV housing design tool). It takes custom design files from MakePlace and repeats them using selected pattern shape types to create intricate designs such as spirals, wheels, grids, and mazes. The output file can then be reimported into MakePlace for further tweaking and adjustments.

## Features

- **8 Shape Types**: Choose from Wheel, Spiral, Conical Spiral, Spherical Spiral, Cylinder Spiral, Grid, 2D Maze, and 3D Maze patterns
- **3D Visualization**: Real-time 3D preview using Three.js with interactive camera controls
- **Comprehensive Parameters**: Extensive customization options for each shape type with validation
- **File Processing**: Upload and process MakePlace JSON files with generated patterns
- **Interactive UI**: Intuitive interface with real-time parameter validation and error messages
- **MakePlace Compatibility**: Direct export to MakePlace-compatible JSON format
- **Coordinate Display**: View generated coordinates in a list with easy copy/paste

## How It Works

1. **Select Shape Type**: Choose the desired shape type from the dropdown menu.
2. **Input Parameters**: Enter the necessary parameters for the selected shape type.
3. **Generate Shape**: Click the "Generate" button to create the shape based on the input parameters.
4. **Upload Design**: Upload a MakePlace design JSON file.
5. **Process Design**: Click the "Process Design" button to apply the generated shape to the uploaded design.
6. **Download Processed JSON**: Download the processed JSON file for reimporting into MakePlace.

## Shape Types

### 1. Wheel

Creates circular patterns with points distributed around a center defined by two reference points.

**Parameters:**

- **Point 1 (X, Y, Z)**: First reference point for the wheel (default: 25, 0, 0)
- **Point 2 (X, Y, Z)**: Second reference point for the wheel (default: -25, 0, 0)
- **Repetitions**: Number of points around the wheel circumference (range: 1-20, default: 12)
- **Segments**: Number of intermediate points between center and edge (range: 0-20, default: 0)
- **Plane Angle**: Rotation angle of the entire wheel in degrees (range: 0-360°, default: 0°)

### 2. Spiral

Creates flat spiral patterns expanding outward from a center point.

**Parameters:**

- **Center Point (X, Y, Z)**: Center of the spiral (default: 0, 0, 0)
- **Start Point (X, Y, Z)**: Starting point of the spiral (default: 25, 0, 0)
- **Direction**: Spiral direction (clockwise/counterclockwise, default: clockwise)
- **Segments**: Number of points along the spiral (range: 1-100, default: 50)
- **Turns**: Number of complete rotations (range: 0.1-10, default: 2)
- **Plane Angle**: Rotation angle of the spiral plane (range: 0-360°, default: 0°)
- **Plane Axis**: Axis for plane rotation (X/Y/Z-Axis, default: X-Axis)

### 3. Conical Spiral

Creates spiral patterns that form a cone shape, spiraling upward or downward.

**Parameters:**

- **Center Point (X, Y, Z)**: Center of the cone base (default: 0, 0, 0)
- **Start Point (X, Y, Z)**: Starting point of the spiral (default: 25, 0, 0)
- **Direction**: Spiral direction (clockwise/counterclockwise, default: clockwise)
- **Segments**: Number of points along the spiral (range: 1-100, default: 25)
- **Turns**: Number of complete rotations (range: 0.1-10, default: 2)
- **Height**: Height of the cone (range: 1-100, default: 30)
- **Orientation**: Cone orientation (upright/inverted, default: upright)
- **Start Point**: Starting location (center/start coordinate, default: center)
- **Plane Angle**: Rotation angle of the cone plane (range: 0-360°, default: 0°)
- **Plane Axis**: Axis for plane rotation (X/Y/Z-Axis, default: X-Axis)

### 4. Spherical Spiral

Creates spiral patterns on the surface of a sphere, following latitude lines.

**Parameters:**

- **Center Point (X, Y, Z)**: Center of the sphere (default: 0, 0, 0)
- **Radius**: Radius of the sphere (range: 1-100, default: 25)
- **Direction**: Spiral direction (clockwise/counterclockwise, default: clockwise)
- **Segments**: Number of points along the spiral (range: 1-100, default: 50)
- **Turns**: Number of complete rotations (range: 0.1-10, default: 2)
- **Start Angle**: Starting polar angle in degrees (range: 0-360°, default: 0°)
- **End Angle**: Ending polar angle in degrees (range: 0-360°, default: 180°)
- **Plane Angle**: Rotation angle of the sphere plane (range: 0-360°, default: 0°)
- **Plane Axis**: Axis for plane rotation (X/Y/Z-Axis, default: X-Axis)

### 5. Cylinder Spiral

Creates spiral patterns wrapped around a cylinder surface.

**Parameters:**

- **Center Point (X, Y, Z)**: Center of the cylinder base (default: 0, 0, 0)
- **Radius**: Radius of the cylinder (range: 1-100, default: 5)
- **Height**: Height of the cylinder (range: 1-100, default: 10)
- **Segments**: Number of points along the spiral (range: 1-100, default: 36)
- **Turns**: Number of complete rotations (range: 0.1-10, default: 2)
- **Direction**: Spiral direction (clockwise/counter-clockwise, default: clockwise)
- **Plane Angle**: Rotation angle of the cylinder plane (range: 0-360°, default: 0°)
- **Plane Axis**: Axis for plane rotation (X/Y/Z-Axis, default: X-Axis)

### 6. Grid

Creates rectangular grid patterns with points arranged in rows and columns.

**Parameters:**

- **Center Point (X, Y, Z)**: Center of the grid (default: 0, 0, 0)
- **Rows**: Number of rows (range: 2-20, default: 3)
- **Columns**: Number of columns (range: 2-20, default: 3)
- **Spacing**: Distance between grid points (range: 1-10, default: 4)
- **Step Amount**: Vertical step between sequential points (range: 0.1-10, default: 2)
- **Floors**: Number of grid floors/levels (range: 1-10, default: 1)

### 7. Maze (2D)

Generates 2D maze structures using wall pieces.

**Parameters:**

- **Cell Length**: Length of each maze cell (range: 1-20, default: 4)
- **Wall Width**: Width of maze walls (range: 1-10, default: 1)
- **Wall Height**: Height of maze walls (range: 1-20, default: 6)
- **Grid Width**: Number of cells horizontally (range: 2-50, default: 5)
- **Grid Height**: Number of cells vertically (optional, defaults to Grid Width)

### 8. 3D Maze

Generates 3D maze structures with walls and floors across multiple levels.

**Parameters:**

- **Cell Length**: Length of each maze cell (range: 1-20, default: 4)
- **Wall Width**: Width of maze walls (range: 1-10, default: 1)
- **Wall Height**: Height of maze walls (range: 1-20, default: 6)
- **Floor Piece Length**: Length of floor pieces (range: 1-20, default: 4)
- **Floor Piece Width**: Width of floor pieces (range: 1-20, default: 4)
- **Grid Width**: Number of cells horizontally (range: 2-20, default: 3)
- **Grid Height**: Number of cells vertically (optional, defaults to Grid Width)
- **Number of Floors**: Number of maze levels (range: 2-10, default: 2)

## Usage

### Running the Application

1. Open `index.html` in a web browser
2. For development with ES6 modules, use a local web server:
   - `python -m http.server` (Python 3)
   - `python -m SimpleHTTPServer` (Python 2)
   - VS Code Live Server extension

### Creating Patterns

1. **Select Shape Type**: Choose from the 8 available shape types
2. **Configure Parameters**: Adjust parameters for your selected shape
3. **Generate Pattern**: Click "Generate" to create and visualize the pattern
4. **View 3D Preview**: Use mouse controls to rotate, zoom, and pan the 3D scene
5. **Reset Camera**: Click "Reset Camera" to return to default view

### Processing MakePlace Files

1. **Upload Design**: Click "Upload Wall/Item Pieces JSON" to select your MakePlace file
2. **Upload Floor Pieces**: (3D Maze only) Optionally upload floor piece JSON
3. **Process Design**: Click "Process Design" to apply the pattern to your uploaded design
4. **Download Result**: Click "Download Processed JSON" to save the final file
5. **Import to MakePlace**: Load the processed file back into MakePlace

### Tips

- Use smaller values for complex shapes to avoid performance issues
- Enable "MakePlace Format" before processing for direct compatibility
- The coordinate display shows all generated points for reference
- Validation errors appear in red text below parameter inputs
- Camera controls: Left-click drag to rotate, scroll to zoom, right-click drag to pan

## Technical Details

### Architecture

- **Vanilla JavaScript**: No build process required
- **ES6 Modules**: Modern modular architecture
- **Three.js**: 3D visualization and rendering
- **Input Validation**: Comprehensive parameter validation with user feedback

### File Structure

```
├── index.html          # Main application file
├── script.js           # Application entry point
├── scene.js            # Three.js scene management
├── modules/            # Modular ES6 architecture
│   ├── shapes/         # Shape generation classes
│   ├── ui/             # UI management components
│   └── utils/          # Utilities and constants
├── tests/              # Testing framework
```

### Dependencies

- [Three.js r128](https://threejs.org/) - 3D rendering and visualization
- [MakePlace](https://makeplace.app/) - Final Fantasy XIV housing design tool

### Browser Compatibility

- Modern browsers with ES6 module support
- Chrome, Firefox, Safari, Edge (recent versions)

## License

This project is released under the Unlicense (public domain). See the project files for details.
