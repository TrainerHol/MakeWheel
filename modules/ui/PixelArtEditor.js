import { PIXEL_ART_COLORS } from "../utils/dyes.js";
import {
  PIXEL_ART_FURNITURE,
  toCustomDesignSpacing,
} from "../utils/pixelArtFurniture.js";
import {
  clonePixelGrid,
  countFilledPixels,
  createEmptyPixelGrid,
  createPixelArtDesign,
  resizePixelGrid,
} from "../utils/pixelArtExporter.js";
import {
  getImageImportSize,
  imageDataToPixelGrid,
} from "../utils/pixelArtImage.js";
import { attachHoldToConfirm } from "../utils/holdToConfirm.js";
import {
  applyGradientToPixelGrid,
  parseGradientAngle,
} from "../utils/gradientFill.js";

const DEFAULT_WIDTH = 8;
const DEFAULT_HEIGHT = 8;
const MAX_HISTORY = 100;
const MAX_CANVAS_SIZE = 64;
const CUSTOM_FURNITURE_ID = "custom-furniture";

export class PixelArtEditor {
  constructor() {
    this.width = DEFAULT_WIDTH;
    this.height = DEFAULT_HEIGHT;
    this.grid = createEmptyPixelGrid(this.width, this.height);
    this.selectedColor = PIXEL_ART_COLORS[0];
    this.currentTool = "pencil";
    this.undoStack = [];
    this.redoStack = [];
    this.active = false;
    this.isPainting = false;
    this.strokeSnapshot = null;
    this.strokeChanged = false;
    this.elements = {};
    this.cancelClearHold = null;
  }

  init() {
    this.cacheElements();
    if (!this.elements.root) return;

    this.populateFurnitureOptions();
    this.populateGradientOptions();
    this.renderPalette();
    this.renderGrid();
    this.bindEvents();
    this.setTool(this.currentTool);
    this.updateColorPreview();
    this.updateStatus();
  }

  setActive(isActive) {
    this.active = isActive;
    if (!this.elements.root) return;

    if (!isActive) {
      this.cancelClearHold?.();
    }

    this.elements.root.style.display = isActive ? "grid" : "none";
    if (isActive) {
      this.updateStatus();
      this.fitGridToWorkspace();
    }
  }

  cacheElements() {
    this.elements = {
      root: document.getElementById("pixelArtInputs"),
      grid: document.getElementById("pixelArtGrid"),
      workspace: document.querySelector(".pixel-art-workspace"),
      palette: document.getElementById("pixelArtPalette"),
      widthInput: document.getElementById("pixelArtWidth"),
      heightInput: document.getElementById("pixelArtHeight"),
      resizeBtn: document.getElementById("pixelArtResizeBtn"),
      furnitureSelect: document.getElementById("pixelArtFurnitureType"),
      customFurnitureInputs: document.getElementById("pixelArtCustomFurnitureInputs"),
      customItemId: document.getElementById("pixelArtCustomItemId"),
      customItemName: document.getElementById("pixelArtCustomItemName"),
      customOrientation: document.getElementById("pixelArtCustomOrientation"),
      customHorizontalSpacing: document.getElementById("pixelArtCustomHorizontalSpacing"),
      customVerticalSpacing: document.getElementById("pixelArtCustomVerticalSpacing"),
      designNameInput: document.getElementById("pixelArtDesignName"),
      status: document.getElementById("pixelArtStatus"),
      colorPreview: document.getElementById("pixelArtColorPreview"),
      colorLabel: document.getElementById("pixelArtColorLabel"),
      undoBtn: document.getElementById("pixelArtUndoBtn"),
      redoBtn: document.getElementById("pixelArtRedoBtn"),
      clearBtn: document.getElementById("pixelArtClearBtn"),
      downloadBtn: document.getElementById("pixelArtDownloadBtn"),
      imageInput: document.getElementById("pixelArtImageInput"),
      importBtn: document.getElementById("pixelArtImportBtn"),
      importStatus: document.getElementById("pixelArtImportStatus"),
      importAsCanvasSize: document.getElementById("pixelArtImportAsCanvasSize"),
      removeBackground: document.getElementById("pixelArtRemoveBackground"),
      preserveShading: document.getElementById("pixelArtPreserveShading"),
      gradientStart: document.getElementById("pixelArtGradientStart"),
      gradientStartPreview: document.getElementById("pixelArtGradientStartPreview"),
      gradientEnd: document.getElementById("pixelArtGradientEnd"),
      gradientEndPreview: document.getElementById("pixelArtGradientEndPreview"),
      gradientAngle: document.getElementById("pixelArtGradientAngle"),
      gradientApplyBtn: document.getElementById("pixelArtGradientApplyBtn"),
      toolButtons: Array.from(document.querySelectorAll("[data-pixel-tool]")),
    };
  }

  populateFurnitureOptions() {
    if (!this.elements.furnitureSelect) return;

    this.elements.furnitureSelect.innerHTML = "";
    PIXEL_ART_FURNITURE.forEach((furniture) => {
      const option = document.createElement("option");
      option.value = furniture.id;
      option.textContent = furniture.name;
      this.elements.furnitureSelect.appendChild(option);
    });

    const customOption = document.createElement("option");
    customOption.value = CUSTOM_FURNITURE_ID;
    customOption.textContent = "Custom Furniture";
    this.elements.furnitureSelect.appendChild(customOption);
    this.updateCustomFurnitureVisibility();
  }

  populateGradientOptions() {
    this.populateColorSelect(this.elements.gradientStart, PIXEL_ART_COLORS[0]?.id);
    this.populateColorSelect(
      this.elements.gradientEnd,
      PIXEL_ART_COLORS.find((color) => color.id === "jet-black")?.id || PIXEL_ART_COLORS.at(-1)?.id
    );
    this.updateGradientColorPreviews();
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
    this.elements.toolButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.setTool(button.dataset.pixelTool);
      });
    });

    this.elements.resizeBtn?.addEventListener("click", () => {
      this.resizeCanvasFromInputs();
    });

    this.elements.undoBtn?.addEventListener("click", () => {
      this.undo();
    });

    this.elements.redoBtn?.addEventListener("click", () => {
      this.redo();
    });

    this.cancelClearHold = attachHoldToConfirm(this.elements.clearBtn, () => {
      this.clearCanvas();
    });

    this.elements.downloadBtn?.addEventListener("click", () => {
      this.downloadDesign();
    });

    this.elements.importBtn?.addEventListener("click", () => {
      this.importImageFromFile();
    });

    this.elements.gradientApplyBtn?.addEventListener("click", () => {
      this.applyGradientFill();
    });

    this.elements.gradientStart?.addEventListener("change", () => {
      this.updateGradientColorPreviews();
    });

    this.elements.gradientEnd?.addEventListener("change", () => {
      this.updateGradientColorPreviews();
    });

    this.elements.imageInput?.addEventListener("change", () => {
      if (this.elements.imageInput.files?.[0]) {
        this.importImageFromFile();
      } else {
        this.setImportStatus("");
      }
    });

    this.elements.furnitureSelect?.addEventListener("change", () => {
      this.updateCustomFurnitureVisibility();
    });

    window.addEventListener("resize", () => {
      this.fitGridToWorkspace();
    });

    this.elements.grid?.addEventListener("pointerdown", (event) => {
      const cell = event.target.closest(".pixel-art-cell");
      if (!cell) return;

      event.preventDefault();
      this.handlePointerDown(cell, event);
    });

    this.elements.grid?.addEventListener("pointerover", (event) => {
      if (!this.isPainting) return;
      const cell = event.target.closest(".pixel-art-cell");
      if (!cell) return;

      this.applyStrokeToCell(cell);
    });

    window.addEventListener("pointerup", () => {
      this.finishStroke();
    });

    document.addEventListener("keydown", (event) => {
      this.handleKeyDown(event);
    });

    document.addEventListener("paste", (event) => {
      this.handlePaste(event);
    });
  }

  updateCustomFurnitureVisibility() {
    if (!this.elements.customFurnitureInputs || !this.elements.furnitureSelect) return;

    const isCustom = this.elements.furnitureSelect.value === CUSTOM_FURNITURE_ID;
    this.elements.customFurnitureInputs.style.display = isCustom ? "flex" : "none";
  }

  renderGrid() {
    if (!this.elements.grid) return;

    this.elements.grid.innerHTML = "";
    this.elements.grid.style.gridTemplateColumns = `repeat(${this.width}, minmax(0, 1fr))`;
    this.elements.grid.style.gridTemplateRows = `repeat(${this.height}, minmax(0, 1fr))`;

    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "pixel-art-cell";
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);
        cell.setAttribute("aria-label", `Pixel ${col + 1}, ${row + 1}`);
        this.paintCellElement(cell, this.grid[row][col]);
        this.elements.grid.appendChild(cell);
      }
    }

    this.fitGridToWorkspace();
  }

  renderPalette() {
    if (!this.elements.palette) return;

    this.elements.palette.innerHTML = "";

    PIXEL_ART_COLORS.forEach((color) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pixel-palette-swatch";
      button.dataset.colorId = color.id;
      button.title = color.name;
      button.setAttribute("aria-label", color.name);
      button.style.backgroundColor = this.toCssColor(color.hex);
      button.addEventListener("click", () => {
        this.selectColor(color);
      });
      this.elements.palette.appendChild(button);
    });

    this.updatePaletteSelection();
  }

  setTool(tool) {
    if (!["pencil", "eraser", "fill", "pick"].includes(tool)) return;

    this.currentTool = tool;
    this.elements.toolButtons.forEach((button) => {
      const isActive = button.dataset.pixelTool === tool;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  selectColor(color) {
    this.selectedColor = color;
    this.updateColorPreview();
    this.updatePaletteSelection();
    if (this.currentTool === "eraser" || this.currentTool === "pick") {
      this.setTool("pencil");
    }
  }

  updateColorPreview() {
    if (this.elements.colorPreview) {
      this.elements.colorPreview.style.backgroundColor = this.toCssColor(this.selectedColor.hex);
    }
    if (this.elements.colorLabel) {
      this.elements.colorLabel.textContent = this.selectedColor.name;
    }
  }

  updateGradientColorPreviews() {
    this.updateGradientColorPreview(this.elements.gradientStartPreview, this.elements.gradientStart?.value);
    this.updateGradientColorPreview(this.elements.gradientEndPreview, this.elements.gradientEnd?.value);
  }

  updateGradientColorPreview(preview, colorId) {
    if (!preview) return;

    const color = this.getPaletteColorById(colorId);
    preview.style.backgroundColor = this.toCssColor(color.hex);
    preview.title = color.name;
  }

  updatePaletteSelection() {
    if (!this.elements.palette) return;

    this.elements.palette.querySelectorAll(".pixel-palette-swatch").forEach((button) => {
      button.classList.toggle("active", button.dataset.colorId === this.selectedColor.id);
    });
  }

  handlePointerDown(cell, event = null) {
    if (event?.altKey || this.currentTool === "pick") {
      this.pickCellColor(cell);
      return;
    }

    if (this.currentTool === "fill") {
      this.applyFill(cell);
      return;
    }

    this.isPainting = true;
    this.strokeSnapshot = clonePixelGrid(this.grid);
    this.strokeChanged = false;
    this.applyStrokeToCell(cell);
  }

  applyStrokeToCell(cell) {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const nextValue = this.currentTool === "eraser" ? null : this.selectedColor;

    if (this.pixelsEqual(this.grid[row][col], nextValue)) return;

    this.grid[row][col] = nextValue ? { ...nextValue } : null;
    this.paintCellElement(cell, this.grid[row][col]);
    this.strokeChanged = true;
    this.updateStatus();
  }

  pickCellColor(cell) {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const color = this.grid[row]?.[col];
    if (!color) {
      this.setImportStatus("No color in this pixel.");
      return false;
    }

    this.selectColor(color);
    this.setImportStatus(`Picked ${color.name}.`);
    return true;
  }

  finishStroke() {
    if (!this.isPainting) return;

    this.isPainting = false;
    if (this.strokeChanged && this.strokeSnapshot) {
      this.pushUndo(this.strokeSnapshot);
      this.redoStack = [];
    }
    this.strokeSnapshot = null;
    this.strokeChanged = false;
    this.updateStatus();
  }

  applyFill(cell) {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const target = this.grid[row][col];
    const replacement = this.selectedColor;

    if (this.pixelsEqual(target, replacement)) return;

    const snapshot = clonePixelGrid(this.grid);
    const targetKey = this.pixelKey(target);
    const replacementValue = { ...replacement };
    const queue = [[row, col]];
    const visited = new Set();
    let changed = false;

    while (queue.length > 0) {
      const [currentRow, currentCol] = queue.shift();
      const key = `${currentRow},${currentCol}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (
        currentRow < 0 ||
        currentRow >= this.height ||
        currentCol < 0 ||
        currentCol >= this.width ||
        this.pixelKey(this.grid[currentRow][currentCol]) !== targetKey
      ) {
        continue;
      }

      this.grid[currentRow][currentCol] = { ...replacementValue };
      changed = true;

      queue.push(
        [currentRow - 1, currentCol],
        [currentRow + 1, currentCol],
        [currentRow, currentCol - 1],
        [currentRow, currentCol + 1]
      );
    }

    if (changed) {
      this.pushUndo(snapshot);
      this.redoStack = [];
      this.renderGrid();
      this.updateStatus();
    }
  }

  resizeCanvasFromInputs() {
    const nextWidth = this.parseSizeInput(this.elements.widthInput?.value, this.width);
    const nextHeight = this.parseSizeInput(this.elements.heightInput?.value, this.height);

    if (nextWidth === this.width && nextHeight === this.height) return;

    this.pushUndo(clonePixelGrid(this.grid));
    this.redoStack = [];
    this.width = nextWidth;
    this.height = nextHeight;
    this.grid = resizePixelGrid(this.grid, this.width, this.height);
    this.syncSizeInputs();
    this.renderGrid();
    this.updateStatus();
  }

  parseSizeInput(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(parsed, 1), MAX_CANVAS_SIZE);
  }

  undo() {
    if (this.undoStack.length === 0) return;

    this.redoStack.push(clonePixelGrid(this.grid));
    this.grid = this.undoStack.pop();
    this.width = this.grid[0]?.length || DEFAULT_WIDTH;
    this.height = this.grid.length || DEFAULT_HEIGHT;
    this.syncSizeInputs();
    this.renderGrid();
    this.updateStatus();
  }

  redo() {
    if (this.redoStack.length === 0) return;

    this.undoStack.push(clonePixelGrid(this.grid));
    this.grid = this.redoStack.pop();
    this.width = this.grid[0]?.length || DEFAULT_WIDTH;
    this.height = this.grid.length || DEFAULT_HEIGHT;
    this.syncSizeInputs();
    this.renderGrid();
    this.updateStatus();
  }

  clearCanvas() {
    const filledPixels = countFilledPixels(this.grid);
    if (filledPixels < 1) {
      this.setImportStatus("Canvas is already clear.");
      return false;
    }

    this.pushUndo(clonePixelGrid(this.grid));
    this.redoStack = [];
    this.grid = createEmptyPixelGrid(this.width, this.height);
    this.renderGrid();
    this.updateStatus();
    this.setImportStatus(`Cleared ${filledPixels} pixel${filledPixels === 1 ? "" : "s"}.`);
    return true;
  }

  applyGradientFill() {
    const filledPixels = countFilledPixels(this.grid);
    if (filledPixels < 1) {
      this.setImportStatus("No filled pixels to gradient.");
      return false;
    }

    const result = applyGradientToPixelGrid(this.grid, {
      startColor: this.getPaletteColorById(this.elements.gradientStart?.value),
      endColor: this.getPaletteColorById(this.elements.gradientEnd?.value),
      angleDegrees: parseGradientAngle(this.elements.gradientAngle?.value, 0),
      palette: PIXEL_ART_COLORS,
    });
    if (!result.changed) return false;

    this.pushUndo(clonePixelGrid(this.grid));
    this.redoStack = [];
    this.grid = result.grid;
    this.renderGrid();
    this.updateStatus();
    this.setImportStatus(`Applied gradient to ${result.filledCount} pixel${result.filledCount === 1 ? "" : "s"}.`);
    return true;
  }

  async importImageFromFile() {
    const file = this.elements.imageInput?.files?.[0];
    if (!file) {
      this.setImportStatus("Choose an image first.", true);
      return false;
    }

    const imported = await this.importImageFile(file, { actionLabel: "Imported" });
    if (imported && this.elements.imageInput) {
      this.elements.imageInput.value = "";
    }
    return imported;
  }

  async importImageFile(file, { actionLabel = "Imported" } = {}) {
    if (!file.type.startsWith("image/")) {
      this.setImportStatus("The selected file is not an image.", true);
      return false;
    }

    try {
      this.setImportStatus("Importing image...");
      const image = await this.loadImage(file);
      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;
      const importAsCanvasSize = Boolean(this.elements.importAsCanvasSize?.checked);
      const removeBackground = Boolean(this.elements.removeBackground?.checked);
      const preserveShading = this.elements.preserveShading?.checked !== false;
      const targetSize = importAsCanvasSize
        ? { width: this.width, height: this.height }
        : getImageImportSize(sourceWidth, sourceHeight);
      const canvas = document.createElement("canvas");
      canvas.width = targetSize.width;
      canvas.height = targetSize.height;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        throw new Error("Canvas image processing is not available");
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.clearRect(0, 0, targetSize.width, targetSize.height);
      context.drawImage(image, 0, 0, targetSize.width, targetSize.height);

      const nextGrid = imageDataToPixelGrid(
        context.getImageData(0, 0, targetSize.width, targetSize.height),
        PIXEL_ART_COLORS,
        undefined,
        { removeBackground, preserveShading }
      );

      this.pushUndo(clonePixelGrid(this.grid));
      this.redoStack = [];
      this.width = targetSize.width;
      this.height = targetSize.height;
      this.grid = nextGrid;
      this.syncSizeInputs();
      this.renderGrid();
      this.updateStatus();
      const backgroundMessage = removeBackground ? " Background removed from matching edge colors." : "";
      const shadingMessage = preserveShading ? " Shading preserved where close palette alternatives were available." : "";
      this.setImportStatus(`${actionLabel} ${sourceWidth} x ${sourceHeight} as ${this.width} x ${this.height}.${backgroundMessage}${shadingMessage}`);
      return true;
    } catch (error) {
      this.setImportStatus(`Import failed: ${error.message}`, true);
      return false;
    }
  }

  handlePaste(event) {
    if (!this.active) return;

    const file = this.getClipboardImageFile(event.clipboardData);
    if (!file) return;

    event.preventDefault();
    this.importImageFile(file, { actionLabel: "Pasted" });
  }

  getClipboardImageFile(clipboardData) {
    if (!clipboardData) return null;

    for (const file of Array.from(clipboardData.files || [])) {
      if (file.type.startsWith("image/")) {
        return file;
      }
    }

    for (const item of Array.from(clipboardData.items || [])) {
      if (!item.type.startsWith("image/")) continue;
      const file = item.getAsFile();
      if (!file) continue;
      if (file.name) return file;
      return new File([file], "pasted-image.png", { type: file.type });
    }

    return null;
  }

  loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read the image file"));
      };

      image.src = url;
    });
  }

  downloadDesign() {
    const filledPixels = countFilledPixels(this.grid);
    if (filledPixels < 1) {
      alert("Draw at least one pixel before downloading.");
      return false;
    }

    const designName = this.elements.designNameInput?.value || "Pixel Art";
    const furniture = this.getSelectedFurniture();
    if (!furniture) return false;

    const design = createPixelArtDesign({
      grid: this.grid,
      width: this.width,
      height: this.height,
      furniture,
      designName,
    });

    const blob = new Blob([JSON.stringify(design, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${this.slugify(design.name)}_${this.width}x${this.height}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  }

  getSelectedFurniture() {
    const furnitureId = this.elements.furnitureSelect?.value;
    if (furnitureId !== CUSTOM_FURNITURE_ID) {
      return PIXEL_ART_FURNITURE.find((furniture) => furniture.id === furnitureId) || PIXEL_ART_FURNITURE[0];
    }

    const itemId = Number(this.elements.customItemId?.value);
    const name = this.elements.customItemName?.value.trim() || "";
    const orientation = this.elements.customOrientation?.value === "horizontal" ? "horizontal" : "vertical";
    const horizontalSpacing = Number(this.elements.customHorizontalSpacing?.value);
    const verticalSpacing = Number(this.elements.customVerticalSpacing?.value);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      alert("Custom furniture item ID must be a positive whole number.");
      return null;
    }

    if (!name) {
      alert("Custom furniture name is required.");
      return null;
    }

    if (!this.isPositiveFiniteNumber(horizontalSpacing)) {
      alert("Custom furniture horizontal step must be a positive number.");
      return null;
    }

    if (!this.isPositiveFiniteNumber(verticalSpacing)) {
      alert("Custom furniture vertical step must be a positive number.");
      return null;
    }

    return {
      id: CUSTOM_FURNITURE_ID,
      name,
      itemId,
      layout: orientation === "horizontal" ? "floor-xy" : "vertical-xz",
      layoutColumnSpacing: horizontalSpacing,
      layoutRowSpacing: verticalSpacing,
      customDesignColumnSpacing: toCustomDesignSpacing(horizontalSpacing),
      customDesignRowSpacing: toCustomDesignSpacing(verticalSpacing),
      fixedCoordinate: 0,
      rotation: [0, 0, 0, 1],
      scale: [1, 1, 1],
    };
  }

  isPositiveFiniteNumber(value) {
    return Number.isFinite(value) && value > 0;
  }

  getPaletteColorById(colorId) {
    return PIXEL_ART_COLORS.find((color) => color.id === colorId) || PIXEL_ART_COLORS[0];
  }

  pushUndo(snapshot) {
    this.undoStack.push(snapshot);
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
  }

  syncSizeInputs() {
    if (this.elements.widthInput) {
      this.elements.widthInput.value = String(this.width);
    }
    if (this.elements.heightInput) {
      this.elements.heightInput.value = String(this.height);
    }
  }

  fitGridToWorkspace() {
    if (!this.active || !this.elements.grid || !this.elements.workspace) return;

    requestAnimationFrame(() => {
      const bounds = this.elements.workspace.getBoundingClientRect();
      if (bounds.width < 1 || bounds.height < 1) return;

      const cellSize = Math.max(
        2,
        Math.floor(Math.min(bounds.width / this.width, bounds.height / this.height))
      );

      this.elements.grid.style.width = `${cellSize * this.width}px`;
      this.elements.grid.style.height = `${cellSize * this.height}px`;
    });
  }

  updateStatus() {
    const filledPixels = countFilledPixels(this.grid);
    if (this.elements.status) {
      this.elements.status.textContent = `${this.width} x ${this.height} canvas, ${filledPixels} item${filledPixels === 1 ? "" : "s"}`;
    }
    if (this.elements.undoBtn) {
      this.elements.undoBtn.disabled = this.undoStack.length === 0;
    }
    if (this.elements.redoBtn) {
      this.elements.redoBtn.disabled = this.redoStack.length === 0;
    }
  }

  setImportStatus(message, isError = false) {
    if (!this.elements.importStatus) return;

    this.elements.importStatus.textContent = message;
    this.elements.importStatus.classList.toggle("error", isError);
  }

  handleKeyDown(event) {
    if (!this.active || this.isTypingTarget(event.target)) return;

    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === "z" && event.shiftKey) {
      event.preventDefault();
      this.redo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key === "z") {
      event.preventDefault();
      this.undo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key === "y") {
      event.preventDefault();
      this.redo();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (key === "t") {
      event.preventDefault();
      this.setTool("pencil");
    } else if (key === "r") {
      event.preventDefault();
      this.setTool("eraser");
    } else if (key === "g") {
      event.preventDefault();
      this.setTool("fill");
    }
  }

  isTypingTarget(target) {
    if (!target) return false;
    return ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
  }

  paintCellElement(cell, pixel) {
    cell.classList.toggle("empty", !pixel);
    cell.style.backgroundColor = pixel ? this.toCssColor(pixel.hex) : "transparent";
    cell.title = pixel ? pixel.name : "Transparent";
  }

  pixelsEqual(left, right) {
    return this.pixelKey(left) === this.pixelKey(right);
  }

  pixelKey(pixel) {
    return pixel ? pixel.hex : "transparent";
  }

  toCssColor(hex) {
    return `#${hex.slice(0, 6)}`;
  }

  slugify(value) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "pixel-art";
  }
}
