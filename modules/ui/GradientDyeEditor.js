import { PIXEL_ART_COLORS } from "../utils/dyes.js";
import {
  applyGradientToDesign,
  collectLocatedFurniture,
  detectMakePlaceDesignKind,
  mapGradientToEntries,
} from "../utils/gradientDye.js";
import { parseGradientAngle } from "../utils/gradientFill.js";
import { validateJsonFile } from "../utils/validators.js";

const SKIPPED_DOT_COLOR = 0x444444;
const TARGET_DOT_SIZE = 0.36;

export class GradientDyeEditor {
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
    this.elements = {};
  }

  init() {
    this.cacheElements();
    if (!this.elements.root) return;

    this.populateGradientOptions();
    this.bindEvents();
    this.updateGradientColorPreviews();
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
      root: document.getElementById("gradientDyeInputs"),
      fileInput: document.getElementById("gradientDyeFileInput"),
      importBtn: document.getElementById("gradientDyeImportBtn"),
      downloadBtn: document.getElementById("gradientDyeDownloadBtn"),
      resetCameraBtn: document.getElementById("gradientDyeResetCameraBtn"),
      startSelect: document.getElementById("gradientDyeStart"),
      startPreview: document.getElementById("gradientDyeStartPreview"),
      endSelect: document.getElementById("gradientDyeEnd"),
      endPreview: document.getElementById("gradientDyeEndPreview"),
      yawInput: document.getElementById("gradientDyeYaw"),
      pitchInput: document.getElementById("gradientDyePitch"),
      status: document.getElementById("gradientDyeStatus"),
      importStatus: document.getElementById("gradientDyeImportStatus"),
    };
  }

  populateGradientOptions() {
    this.populateColorSelect(this.elements.startSelect, PIXEL_ART_COLORS[0]?.id);
    this.populateColorSelect(
      this.elements.endSelect,
      PIXEL_ART_COLORS.find((color) => color.id === "jet-black")?.id || PIXEL_ART_COLORS.at(-1)?.id
    );
  }

  populateColorSelect(select, selectedColorId) {
    if (!select) return;

    select.innerHTML = "";
    PIXEL_ART_COLORS.forEach((color) => {
      const option = document.createElement("option");
      option.value = color.id;
      option.textContent = color.name;
      select.appendChild(option);
    });
    if (selectedColorId) {
      select.value = selectedColorId;
    }
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

    this.elements.fileInput?.addEventListener("change", () => {
      if (this.elements.fileInput.files?.[0]) {
        this.importJsonFromFile();
      } else {
        this.setImportStatus("");
      }
    });

    [
      this.elements.startSelect,
      this.elements.endSelect,
      this.elements.yawInput,
      this.elements.pitchInput,
    ].forEach((element) => {
      element?.addEventListener("change", () => {
        this.updateGradientColorPreviews();
        this.updatePreview();
      });
      element?.addEventListener("input", () => {
        this.updateGradientColorPreviews();
        this.updatePreview();
      });
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
    const mappedTargets = mapGradientToEntries(targetEntries, this.getGradientOptions());
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
      mesh.userData.gradientDyeEntry = entry;
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
      const result = applyGradientToDesign(this.originalDesign, this.getGradientOptions());
      const blob = new Blob([JSON.stringify(result.design, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${this.stripJsonExtension(this.fileName || "design")}_gradient-dye.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      this.setImportStatus(`Downloaded ${result.changedCount} dyed item${result.changedCount === 1 ? "" : "s"}.`);
      return true;
    } catch (error) {
      alert(`Gradient Dye download failed: ${error.message}`);
      return false;
    }
  }

  getGradientOptions() {
    return {
      startColor: this.getPaletteColorById(this.elements.startSelect?.value),
      endColor: this.getPaletteColorById(this.elements.endSelect?.value),
      yawDegrees: parseGradientAngle(this.elements.yawInput?.value, 0),
      pitchDegrees: parseGradientAngle(this.elements.pitchInput?.value, 0),
      palette: PIXEL_ART_COLORS,
    };
  }

  updateGradientColorPreviews() {
    this.updateGradientColorPreview(this.elements.startPreview, this.elements.startSelect?.value);
    this.updateGradientColorPreview(this.elements.endPreview, this.elements.endSelect?.value);
  }

  updateGradientColorPreview(preview, colorId) {
    if (!preview) return;

    const color = this.getPaletteColorById(colorId);
    preview.style.backgroundColor = this.toCssColor(color.hex);
    preview.title = color.name;
  }

  updateStatus() {
    if (!this.elements.status) return;

    if (!this.originalDesign) {
      this.elements.status.textContent = "No design imported.";
      if (this.elements.downloadBtn) {
        this.elements.downloadBtn.disabled = true;
      }
      return;
    }

    const targetCount = this.entries.filter((entry) => entry.isDyeTarget).length;
    const skippedCount = this.entries.length - targetCount;
    this.elements.status.textContent =
      `${this.formatKind(this.designKind)}: ${this.entries.length} located item${this.entries.length === 1 ? "" : "s"}, ` +
      `${targetCount} dyed, ${skippedCount} skipped`;
    if (this.elements.downloadBtn) {
      this.elements.downloadBtn.disabled = false;
    }
  }

  getImportSummary(prefix) {
    const targetCount = this.entries.filter((entry) => entry.isDyeTarget).length;
    const skippedCount = this.entries.length - targetCount;
    return `${prefix} ${this.formatKind(this.designKind).toLowerCase()}: ${this.entries.length} located item${this.entries.length === 1 ? "" : "s"}, ${targetCount} dyed, ${skippedCount} skipped.`;
  }

  setImportStatus(message, isError = false) {
    if (!this.elements.importStatus) return;

    this.elements.importStatus.textContent = message;
    this.elements.importStatus.classList.toggle("error", isError);
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

  getPaletteColorById(colorId) {
    return PIXEL_ART_COLORS.find((color) => color.id === colorId) || PIXEL_ART_COLORS[0];
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
