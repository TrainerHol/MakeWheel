import { Wheel } from './wheel.js';
import { SceneManager } from './scene.js';
import { UI } from './ui.js';

const sceneManager = new SceneManager();
sceneManager.init();

const wheel = new Wheel(sceneManager.scene);

const ui = new UI(wheel, sceneManager);
ui.init();

sceneManager.animate();
