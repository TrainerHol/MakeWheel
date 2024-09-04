# MakeWheel by Hol

## Overview

MakeWheel is a tool designed to take custom design files from MakePlace and repeat them using a selected pattern shape type. This program is particularly useful for creating intricate designs such as spirals, wheels, and scaffolding structures. The output file can then be reimported into MakePlace for further tweaking and adjustments.

## Features

- **Shape Types**: Choose from four different shape types: Wheel, Spiral, Conical Spiral, and Spherical Spiral.
- **Customizable Parameters**: Adjust various parameters such as points, repetitions, segments, plane angles, and more to create unique designs.
- **File Upload and Processing**: Upload a JSON design file, process it according to the selected shape type, and download the processed JSON file.
- **Interactive UI**: An intuitive user interface to input parameters and visualize the generated shapes in real-time.
- **MakePlace Format**: Option to format coordinates for MakePlace compatibility.

## How It Works

1. **Select Shape Type**: Choose the desired shape type from the dropdown menu.
2. **Input Parameters**: Enter the necessary parameters for the selected shape type.
3. **Generate Shape**: Click the "Generate" button to create the shape based on the input parameters.
4. **Upload Design**: Upload a MakePlace design JSON file.
5. **Process Design**: Click the "Process Design" button to apply the generated shape to the uploaded design.
6. **Download Processed JSON**: Download the processed JSON file for reimporting into MakePlace.

## Shape Types

### Wheel

- **Point 1 and Point 2**: Define the two points that form the base of the wheel.
- **Repetitions**: Number of times the shape is repeated around the wheel.
- **Segments**: Number of segments between each repetition.
- **Plane Angle**: Angle of the plane in which the wheel lies.

### Spiral

- **Center Point**: The center of the spiral.
- **Start Point**: The starting point of the spiral.
- **Direction**: Clockwise or counterclockwise direction of the spiral.
- **Segments**: Number of segments in the spiral.
- **Turns**: Number of turns in the spiral.
- **Plane Angle**: Angle of the plane in which the spiral lies.

### Conical Spiral

- **Center Point**: The center of the conical spiral.
- **Start Point**: The starting point of the conical spiral.
- **Direction**: Clockwise or counterclockwise direction of the conical spiral.
- **Segments**: Number of segments in the conical spiral.
- **Turns**: Number of turns in the conical spiral.
- **Height**: Height of the conical spiral.
- **Orientation**: Upright or inverted orientation.
- **Start Point**: Whether to start from the center or the start coordinate.

**Approximation for Equal Spacing**: The total length of the conical spiral is calculated using the formula:
\[ \text{Total Length} = \sqrt{(\text{Start Radius})^2 + (\text{Height})^2} \times \text{Turns} \]
The segment length is then determined by dividing the total length by the number of segments.

### Spherical Spiral

- **Center Point**: The center of the spherical spiral.
- **Radius**: The radius of the spherical spiral.
- **Direction**: Clockwise or counterclockwise direction of the spiral.
- **Segments**: Number of segments in the spiral.
- **Turns**: Number of turns in the spiral.
- **Start Angle**: The angle at which the spiral starts.
- **End Angle**: The angle at which the spiral ends.

**Approximation for Equal Spacing**: The total length of the spherical spiral is approximated by calculating the distance between consecutive points along the spiral. The segment length is then distributed evenly based on the total length divided by the number of segments.

## Usage

1. Open `index.html` in a web browser.
2. Select the shape type and input the required parameters.
3. Click "Generate" to visualize the shape.
4. Upload a MakePlace design JSON file.
5. Click "Process Design" to apply the shape to the design.
6. Download the processed JSON file and reimport it into MakePlace for further adjustments.

## Dependencies

- [Three.js](https://threejs.org/) for 3D rendering.
- [MakePlace](https://makeplace.app/) for design files.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
