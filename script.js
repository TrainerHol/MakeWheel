import { Wheel } from "./wheel.js";
import { SceneManager } from "./scene.js";
import { UI } from "./ui.js";
import { Maze } from "./maze.js";

const sceneManager = new SceneManager();
sceneManager.init();

const wheel = new Wheel(sceneManager.scene);
const maze = new Maze(sceneManager.scene);

const ui = new UI(wheel, sceneManager, maze);
ui.init();

sceneManager.animate();
