import { Wheel } from "./wheel.js";
import { SceneManager } from "./scene.js";
import { UI } from "./ui.js";
import { Maze } from "./maze.js";
import { Maze3D } from "./Maze3D.js";

const sceneManager = new SceneManager();
sceneManager.init();

const wheel = new Wheel(sceneManager.scene, sceneManager.camera);
const maze = new Maze(sceneManager.scene);
const maze3d = new Maze3D(sceneManager.scene);

const ui = new UI(wheel, sceneManager, maze, maze3d);
ui.init();

sceneManager.animate();
