import { PIXEL_ART_COLORS, getRandomColorDyePalette } from "../utils/dyes.js";
import {
  applyRandomColorsToDesign,
  mapRandomColorsToEntries,
} from "../utils/randomColorDye.js";
import {
  collectLocatedFurniture,
  detectMakePlaceDesignKind,
} from "../utils/gradientDye.js";
import { validateJsonFile } from "../utils/validators.js";

const SKIPPED_DOT_COLOR = 0x444444;
const TARGET_DOT_SIZE = 0.36;

export class RandomColorEditor {
  constructor(sceneManager, cameraControls) {
    this.sceneManager = sceneManager;
    this.cameraControls = cameraControls;
    this.active = false;
    this.originalDesign = null;
    this.fileName = "";
    this.designKind = "";
    this.entries = [];
    this.previewMeshes = [];
    this.previewGeometry = null;
    this.autoSeed = this.createAutoSeed();
    this.elements = {};
  }

  init() {
    this.cacheElements();
    if (!this.elements.root) return;

    this.bindEvents();
    this.updateStatus();
  }

  setActive(isActive) {
    this.active = isActive;
    if (!this.elements.root) return;

    this.elements.root.style.display = isActive ? "block" : "none";
    if (isActive) {
      this.updatePreview();
      this.updateStatus();
    } else {
      this.clearPreview();
    }
  }

  cacheElements() {
    this.elements = {
      root: document.getElementById("randomColorInputs"),
      fileInput: document.getElementById("randomColorFileInput"),
      importBtn: document.getElementById("randomColorImportBtn"),
      downloadBtn: document.getElementById("randomColorDownloadBtn"),
      resetCameraBtn: document.getElementById("randomColorResetCameraBtn"),
      rerollBtn: document.getElementById("randomColorRerollBtn"),
      includeSpecial: document.getElementById("randomColorIncludeSpecial"),
      seedInput: document.getElementById("randomColorSeed"),
      status: document.getElementById("randomColorStatus"),
      importStatus: document.getElementById("randomColorImportStatus"),
    };
  }

  bindEvents() {
    this.elements.importBtn?.addEventListener("click", () => {
      this.importJsonFromFile();
    });

    this.elements.downloadBtn?.addEventListener("click", () => {
      this.downloadDesign();
    });

    this.elements.resetCameraBtn?.addEventListener("click", () => {
      this.fitCameraToPreview();
    });

    this.elements.rerollBtn?.addEventListener("click", () => {
      this.rerollColors();
    });

    this.elements.fileInput?.addEventListener("change", () => {
      if (this.elements.fileInput.files?.[0]) {
        this.importJsonFromFile();
      } else {
        this.setImportStatus("");
      }
    });

    this.elements.includeSpecial?.addEventListener("change", () => {
      this.updatePreview();
      this.updateStatus();
    });

    this.elements.seedInput?.addEventListener("input", () => {
      this.updatePreview();
      this.updateStatus();
    });
  }

  async importJsonFromFile() {
    const file = this.elements.fileInput?.files?.[0];
    if (!file) {
      this.setImportStatus("Choose a MakePlace JSON file first.", true);
      return false;
    }

    try {
      validateJsonFile(file);
      const json = JSON.parse(await file.text());
      const kind = detectMakePlaceDesignKind(json);
      const entries = collectLocatedFurniture(json);
      if (entries.length < 1) {
        throw new Error("No furniture with transform.location was found.");
      }

      this.originalDesign = json;
      this.fileName = file.name;
      this.designKind = kind;
      this.entries = entries;
      this.resetAutoSeed();
      this.updatePreview();
      this.fitCameraToPreview();
      this.updateStatus();
      this.setImportStatus(this.getImportSummary("Imported"));
      this.elements.fileInput.value = "";
      return true;
    } catch (error) {
      this.originalDesign = null;
      this.fileName = "";
      this.designKind = "";
      this.entries = [];
      this.clearPreview();
      this.updateStatus();
      this.setImportStatus(`Import failed: ${error.message}`, true);
      return false;
    }
  }

  updatePreview() {
    if (!this.active) return;

    this.clearPreview();
    if (!this.originalDesign || this.entries.length < 1 || !window.THREE) return;

    const THREE = window.THREE;
    const targetEntries = this.entries.filter((entry) => entry.isDyeTarget);
    const mappedTargets = mapRandomColorsToEntries(targetEntries, this.getRandomOptions());
    const targetColorsByPath = new Map(
      mappedTargets.map((entry) => [this.pathKey(entry.path), entry.color])
    );

    this.previewGeometry = new THREE.SphereGeometry(TARGET_DOT_SIZE, 14, 10);
    this.previewMeshes = this.entries.map((entry) => {
      const color = targetColorsByPath.get(this.pathKey(entry.path));
      const material = new THREE.MeshBasicMaterial({
        color: color ? this.toCssColor(color.hex) : SKIPPED_DOT_COLOR,
        transparent: !color,
        opacity: color ? 1 : 0.45,
      });
      const mesh = new THREE.Mesh(this.previewGeometry, material);
      mesh.position.set(...this.makePlaceLocationToWorld(entry.location));
      mesh.userData.randomColorEntry = entry;
      this.sceneManager.scene.add(mesh);
      return mesh;
    });
  }

  clearPreview() {
    if (!this.sceneManager?.scene) return;

    this.previewMeshes.forEach((mesh) => {
      this.sceneManager.scene.remove(mesh);
      mesh.material?.dispose?.();
    });
    this.previewMeshes = [];

    if (this.previewGeometry) {
      this.previewGeometry.dispose();
      this.previewGeometry = null;
    }
  }

  fitCameraToPreview() {
    if (!this.active || !this.cameraControls || this.previewMeshes.length < 1) {
      return false;
    }

    const boundingBox = this.cameraControls.calculateBoundingBox(this.previewMeshes);
    const center = new THREE.Vector3(
      (boundingBox.min.x + boundingBox.max.x) / 2,
      (boundingBox.min.y + boundingBox.max.y) / 2,
      (boundingBox.min.z + boundingBox.max.z) / 2
    );
    const size = Math.max(
      boundingBox.max.x - boundingBox.min.x,
      boundingBox.max.y - boundingBox.min.y,
      boundingBox.max.z - boundingBox.min.z
    );
    const distance = Math.max(size * 2.1, 35);

    this.cameraControls.target.copy(center);
    this.sceneManager.camera.position.set(
      center.x + distance * 0.7,
      center.y + distance * 0.7,
      center.z + distance * 0.7
    );
    this.sceneManager.camera.lookAt(center);
    this.cameraControls.updateCameraState();
    return true;
  }

  downloadDesign() {
    if (!this.originalDesign) {
      alert("Import a MakePlace JSON file first.");
      return false;
    }

    try {
      const result = applyRandomColorsToDesign(this.originalDesign, this.getRandomOptions());
      const blob = new Blob([JSON.stringify(result.design, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${this.stripJsonExtension(this.fileName || "design")}_random-color.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      this.setImportStatus(`Downloaded ${result.changedCount} randomly dyed item${result.changedCount === 1 ? "" : "s"}.`);
      return true;
    } catch (error) {
      alert(`Random Color download failed: ${error.message}`);
      return false;
    }
  }

  rerollColors() {
    this.resetAutoSeed();
    if (this.elements.seedInput) {
      this.elements.seedInput.value = "";
    }
    this.updatePreview();
    this.updateStatus();
  }

  getRandomOptions() {
    return {
      includeSpecialDyes: Boolean(this.elements.includeSpecial?.checked),
      seed: this.elements.seedInput?.value.trim() || this.autoSeed,
      palette: PIXEL_ART_COLORS,
    };
  }

  updateStatus() {
    if (!this.elements.status) return;

    const paletteCount = getRandomColorDyePalette({
      includeSpecialDyes: Boolean(this.elements.includeSpecial?.checked),
      palette: PIXEL_ART_COLORS,
    }).length;

    if (!this.originalDesign) {
      this.elements.status.textContent = `No design imported. Palette: ${paletteCount} colors.`;
      if (this.elements.downloadBtn) {
        this.elements.downloadBtn.disabled = true;
      }
      return;
    }

    const targetCount = this.entries.filter((entry) => entry.isDyeTarget).length;
    const skippedCount = this.entries.length - targetCount;
    this.elements.status.textContent =
      `${this.formatKind(this.designKind)}: ${this.entries.length} located item${this.entries.length === 1 ? "" : "s"}, ` +
      `${targetCount} with default dye, ${skippedCount} skipped, palette: ${paletteCount} colors`;
    if (this.elements.downloadBtn) {
      this.elements.downloadBtn.disabled = false;
    }
  }

  getImportSummary(prefix) {
    const targetCount = this.entries.filter((entry) => entry.isDyeTarget).length;
    const skippedCount = this.entries.length - targetCount;
    return `${prefix} ${this.formatKind(this.designKind).toLowerCase()}: ${this.entries.length} located item${this.entries.length === 1 ? "" : "s"}, ${targetCount} with default dye, ${skippedCount} skipped.`;
  }

  setImportStatus(message, isError = false) {
    if (!this.elements.importStatus) return;

    this.elements.importStatus.textContent = message;
    this.elements.importStatus.classList.toggle("error", isError);
  }

  resetAutoSeed() {
    this.autoSeed = this.createAutoSeed();
  }

  createAutoSeed() {
    return `${Date.now()}-${Math.random()}`;
  }

  makePlaceLocationToWorld(location) {
    return [
      Number(location[0]) / 100,
      Number(location[2]) / 100,
      Number(location[1]) / 100,
    ];
  }

  pathKey(path) {
    return JSON.stringify(path);
  }

  toCssColor(hex) {
    return `#${hex.slice(0, 6)}`;
  }

  formatKind(kind) {
    return kind === "custom-design" ? "Custom design" : "Layout";
  }

  stripJsonExtension(fileName) {
    return fileName.replace(/\.json$/i, "") || "design";
  }
}
