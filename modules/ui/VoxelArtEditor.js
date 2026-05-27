import { PIXEL_ART_COLORS } from "../utils/dyes.js";
import {
  createVoxelArtDesign,
  removeHiddenVoxelsFromList,
  summarizeVoxelExport,
} from "../utils/voxelArtExporter.js";
import {
  countVoxels,
  createEmptyVoxelModel,
  createVoxel,
  createVoxelModelFromParsedVox,
  deleteVoxel,
  getVoxel,
  getVoxelArray,
  normalizeVoxelDimension,
  resizeVoxelModel,
  setVoxel,
  voxelModelToExportModel,
} from "../utils/voxelArtModel.js";
import { parseVoxFile } from "../utils/voxelArtParser.js";
import {
  CUSTOM_VOXEL_FURNITURE_ID,
  VOXEL_ART_FURNITURE,
  createVoxelArtFurniture,
} from "../utils/voxelArtFurniture.js";
import { attachHoldToConfirm } from "../utils/holdToConfirm.js";
import {
  mapGradientToVoxels,
  parseGradientAngle,
} from "../utils/gradientFill.js";

const MAX_HISTORY = 100;
const TOOL_IDS = ["add", "erase", "paint", "pick"];
const CAMERA_MIN_DISTANCE = 6;
const CAMERA_MAX_DISTANCE = 90;
const CUBE_SIZE = 0.96;

export class VoxelArtEditor {
  constructor() {
    this.active = false;
    this.model = createEmptyVoxelModel();
    this.selectedColor = PIXEL_ART_COLORS[0];
    this.currentTool = "add";
    this.undoStack = [];
    this.redoStack = [];
    this.elements = {};
    this.three = null;
    this.renderQueued = false;
    this.instanceVoxels = [];
    this.hoveredVoxel = null;
    this.ghostVoxel = null;
    this.isOrbiting = false;
    this.orbitPointer = null;
    this.lastPointer = { x: 0, y: 0 };
    this.cameraState = {
      yaw: Math.PI / 4,
      pitch: Math.PI / 5,
      distance: 18,
    };
    this.cancelClearHold = null;
  }

  init() {
    this.cacheElements();
    if (!this.elements.root) return;

    this.populateFurnitureOptions();
    this.populateGradientOptions();
    this.renderPalette();
    this.bindEvents();
    this.setTool(this.currentTool);
    this.updateColorPreview();
    this.syncSizeInputs();
    this.updateCustomFurnitureVisibility();
    this.updateRotationVisibility();
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
      this.ensureViewport();
      this.resizeRenderer();
      this.updateSceneFromModel();
      this.updateStatus();
      this.requestRender();
    }
  }

  cacheElements() {
    this.elements = {
      root: document.getElementById("voxelArtInputs"),
      designNameInput: document.getElementById("voxelArtDesignName"),
      furnitureSelect: document.getElementById("voxelArtFurnitureType"),
      customFurnitureInputs: document.getElementById("voxelArtCustomFurnitureInputs"),
      customItemId: document.getElementById("voxelArtCustomItemId"),
      customItemName: document.getElementById("voxelArtCustomItemName"),
      customXSpacing: document.getElementById("voxelArtCustomXSpacing"),
      customDepthSpacing: document.getElementById("voxelArtCustomDepthSpacing"),
      customHeightSpacing: document.getElementById("voxelArtCustomHeightSpacing"),
      sizeXInput: document.getElementById("voxelArtSizeX"),
      sizeYInput: document.getElementById("voxelArtSizeY"),
      sizeZInput: document.getElementById("voxelArtSizeZ"),
      resizeBtn: document.getElementById("voxelArtResizeBtn"),
      newBtn: document.getElementById("voxelArtNewBtn"),
      fileInput: document.getElementById("voxelArtFileInput"),
      importBtn: document.getElementById("voxelArtImportBtn"),
      clearInsideBtn: document.getElementById("voxelArtClearInsideBtn"),
      downloadBtn: document.getElementById("voxelArtDownloadBtn"),
      undoBtn: document.getElementById("voxelArtUndoBtn"),
      redoBtn: document.getElementById("voxelArtRedoBtn"),
      clearBtn: document.getElementById("voxelArtClearBtn"),
      removeHidden: document.getElementById("voxelArtRemoveHidden"),
      preserveShading: document.getElementById("voxelArtPreserveShading"),
      rotateRow: document.getElementById("voxelArtRotateRow"),
      rotateClosestToEdge: document.getElementById("voxelArtRotateClosestToEdge"),
      viewport: document.getElementById("voxelArtViewport"),
      palette: document.getElementById("voxelArtPalette"),
      colorPreview: document.getElementById("voxelArtColorPreview"),
      colorLabel: document.getElementById("voxelArtColorLabel"),
      gradientStart: document.getElementById("voxelArtGradientStart"),
      gradientStartPreview: document.getElementById("voxelArtGradientStartPreview"),
      gradientEnd: document.getElementById("voxelArtGradientEnd"),
      gradientEndPreview: document.getElementById("voxelArtGradientEndPreview"),
      gradientYaw: document.getElementById("voxelArtGradientYaw"),
      gradientPitch: document.getElementById("voxelArtGradientPitch"),
      gradientApplyBtn: document.getElementById("voxelArtGradientApplyBtn"),
      status: document.getElementById("voxelArtStatus"),
      importStatus: document.getElementById("voxelArtImportStatus"),
      toolButtons: Array.from(document.querySelectorAll("[data-voxel-tool]")),
    };
  }

  populateFurnitureOptions() {
    if (!this.elements.furnitureSelect) return;

    this.elements.furnitureSelect.innerHTML = "";
    VOXEL_ART_FURNITURE.forEach((furniture) => {
      const option = document.createElement("option");
      option.value = furniture.id;
      option.textContent = furniture.name;
      this.elements.furnitureSelect.appendChild(option);
    });

    const customOption = document.createElement("option");
    customOption.value = CUSTOM_VOXEL_FURNITURE_ID;
    customOption.textContent = "Custom Furniture";
    this.elements.furnitureSelect.appendChild(customOption);
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

  bindEvents() {
    this.elements.toolButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.setTool(button.dataset.voxelTool);
      });
    });

    this.elements.resizeBtn?.addEventListener("click", () => {
      this.resizeModelFromInputs();
    });

    this.elements.newBtn?.addEventListener("click", () => {
      this.createNewModel();
    });

    this.elements.importBtn?.addEventListener("click", () => {
      this.importVoxFromFile();
    });

    this.elements.clearInsideBtn?.addEventListener("click", () => {
      this.clearHiddenInteriorVoxels();
    });

    this.elements.downloadBtn?.addEventListener("click", () => {
      this.downloadDesign();
    });

    this.elements.undoBtn?.addEventListener("click", () => {
      this.undo();
    });

    this.elements.redoBtn?.addEventListener("click", () => {
      this.redo();
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

    this.cancelClearHold = attachHoldToConfirm(this.elements.clearBtn, () => {
      this.clearModel();
    });

    this.elements.fileInput?.addEventListener("change", () => {
      if (this.elements.fileInput.files?.[0]) {
        this.importVoxFromFile();
      } else {
        this.setImportStatus("");
      }
    });

    this.elements.removeHidden?.addEventListener("change", () => {
      this.updateStatus();
    });

    this.elements.furnitureSelect?.addEventListener("change", () => {
      this.updateCustomFurnitureVisibility();
      this.updateRotationVisibility();
      this.updateStatus();
    });

    this.elements.viewport?.addEventListener("pointermove", (event) => {
      this.handlePointerMove(event);
    });

    this.elements.viewport?.addEventListener("pointerdown", (event) => {
      this.handlePointerDown(event);
    });

    this.elements.viewport?.addEventListener("pointerup", (event) => {
      this.finishPointerAction(event);
    });

    this.elements.viewport?.addEventListener("pointerleave", () => {
      this.clearHover();
    });

    this.elements.viewport?.addEventListener("wheel", (event) => {
      this.handleWheel(event);
    }, { passive: false });

    this.elements.viewport?.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    window.addEventListener("resize", () => {
      if (!this.active) return;
      this.resizeRenderer();
      this.requestRender();
    });

    document.addEventListener("keydown", (event) => {
      this.handleKeyDown(event);
    });
  }

  ensureViewport() {
    if (this.three || !this.elements.viewport || !window.THREE) return;

    const THREE = window.THREE;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    this.elements.viewport.appendChild(renderer.domElement);
    this.elements.viewport.tabIndex = 0;

    const ambient = new THREE.AmbientLight(0xffffff, 0.38);
    const directional = new THREE.DirectionalLight(0xffffff, 0.82);
    directional.position.set(5, 9, 7);
    const fill = new THREE.DirectionalLight(0xffffff, 0.18);
    fill.position.set(-7, 4, -5);
    scene.add(ambient, directional, fill);

    const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    const voxelGroup = new THREE.Group();
    scene.add(voxelGroup);

    const hoverMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.02, 1.02, 1.02),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.85,
      })
    );
    hoverMesh.visible = false;
    scene.add(hoverMesh);

    const ghostMesh = new THREE.Mesh(
      new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      })
    );
    ghostMesh.visible = false;
    scene.add(ghostMesh);

    const boundsGroup = new THREE.Group();
    scene.add(boundsGroup);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    this.three = {
      THREE,
      scene,
      camera,
      renderer,
      voxelGroup,
      voxelGeometry: geometry,
      hoverMesh,
      ghostMesh,
      boundsGroup,
      raycaster,
      pointer,
      groundPlane,
      matrix: new THREE.Matrix4(),
      intersectionPoint: new THREE.Vector3(),
    };

    this.updateCamera();
    this.updateBoundsHelpers();
  }

  updateSceneFromModel() {
    if (!this.three) return;

    const voxels = getVoxelArray(this.model);
    const { THREE, voxelGroup, voxelGeometry, matrix } = this.three;
    this.instanceVoxels = voxels;
    this.clearVoxelGroup();

    const voxelsByColor = new Map();
    voxels.forEach((voxel) => {
      const colorKey = voxel.color.hex;
      if (!voxelsByColor.has(colorKey)) {
        voxelsByColor.set(colorKey, []);
      }
      voxelsByColor.get(colorKey).push(voxel);
    });

    voxelsByColor.forEach((colorVoxels, colorHex) => {
      const mesh = new THREE.InstancedMesh(
        voxelGeometry,
        new THREE.MeshLambertMaterial({
          color: this.getPreviewColor(colorHex),
        }),
        colorVoxels.length
      );
      mesh.userData.voxels = colorVoxels;
      colorVoxels.forEach((voxel, index) => {
        matrix.makeTranslation(...this.voxelToWorld(voxel));
        mesh.setMatrixAt(index, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      voxelGroup.add(mesh);
    });
    this.updateBoundsHelpers();
    this.updateHoverMeshes();
    this.requestRender();
  }

  clearVoxelGroup() {
    if (!this.three) return;

    const { voxelGroup } = this.three;
    while (voxelGroup.children.length > 0) {
      const child = voxelGroup.children[0];
      voxelGroup.remove(child);
      child.material?.dispose?.();
    }
  }

  updateBoundsHelpers() {
    if (!this.three) return;

    const { THREE, boundsGroup } = this.three;
    while (boundsGroup.children.length > 0) {
      boundsGroup.remove(boundsGroup.children[0]);
    }

    const size = this.model.size;
    this.three.groundPlane.constant = size.z / 2;
    const boundsGeometry = new THREE.BoxGeometry(size.x, size.z, size.y);
    const edges = new THREE.EdgesGeometry(boundsGeometry);
    const bounds = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x4f8cff, transparent: true, opacity: 0.75 })
    );
    bounds.position.set(0, 0, 0);
    boundsGroup.add(bounds);

    const grid = new THREE.GridHelper(Math.max(size.x, size.y), Math.max(size.x, size.y), 0x3a3a3a, 0x202020);
    grid.position.y = -size.z / 2;
    boundsGroup.add(grid);
  }

  handlePointerMove(event) {
    if (!this.active || !this.three) return;

    if (this.isOrbiting) {
      const dx = event.clientX - this.lastPointer.x;
      const dy = event.clientY - this.lastPointer.y;
      this.lastPointer = { x: event.clientX, y: event.clientY };
      this.cameraState.yaw -= dx * 0.008;
      this.cameraState.pitch = Math.min(
        Math.PI / 2 - 0.08,
        Math.max(-Math.PI / 2 + 0.08, this.cameraState.pitch + dy * 0.008)
      );
      this.updateCamera();
      return;
    }

    this.updateHoverFromPointer(event);
  }

  handlePointerDown(event) {
    if (!this.active || !this.three) return;

    this.elements.viewport?.focus();
    if (event.button === 2 || event.button === 1 || event.spaceKey) {
      this.startOrbit(event);
      return;
    }

    event.preventDefault();
    this.updateHoverFromPointer(event);
    if (event.altKey || this.currentTool === "pick") {
      this.pickHoveredColor();
      return;
    }

    if (this.currentTool === "add") {
      this.addGhostVoxel();
    } else if (this.currentTool === "erase") {
      this.eraseHoveredVoxel();
    } else if (this.currentTool === "paint") {
      this.paintHoveredVoxel();
    }
  }

  startOrbit(event) {
    event.preventDefault();
    this.isOrbiting = true;
    this.orbitPointer = event.pointerId;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    this.elements.viewport?.setPointerCapture?.(event.pointerId);
  }

  finishPointerAction(event) {
    if (!this.isOrbiting) return;
    if (this.orbitPointer !== null && event.pointerId !== this.orbitPointer) return;

    this.isOrbiting = false;
    this.orbitPointer = null;
    this.elements.viewport?.releasePointerCapture?.(event.pointerId);
  }

  handleWheel(event) {
    if (!this.active) return;

    event.preventDefault();
    const scale = event.deltaY > 0 ? 1.08 : 0.92;
    this.cameraState.distance = Math.min(
      CAMERA_MAX_DISTANCE,
      Math.max(CAMERA_MIN_DISTANCE, this.cameraState.distance * scale)
    );
    this.updateCamera();
  }

  updateHoverFromPointer(event) {
    const hit = this.getPointerHit(event);
    this.hoveredVoxel = hit?.voxel || null;
    this.ghostVoxel = hit?.ghostVoxel || null;
    this.updateHoverMeshes();
    this.requestRender();
  }

  getPointerHit(event) {
    if (!this.three) return null;

    const { THREE, camera, voxelGroup, pointer, raycaster, groundPlane, intersectionPoint } = this.three;
    const rect = this.elements.viewport.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const intersections = raycaster.intersectObjects(voxelGroup.children, false);
    if (intersections.length > 0 && intersections[0].instanceId !== undefined) {
      const intersection = intersections[0];
      const voxel = intersection.object.userData.voxels[intersection.instanceId];
      const normal = intersection.face?.normal || new THREE.Vector3(0, 1, 0);
      const delta = this.faceNormalToVoxelDelta(normal);
      const ghostVoxel = {
        x: voxel.x + delta.x,
        y: voxel.y + delta.y,
        z: voxel.z + delta.z,
      };
      return {
        voxel,
        ghostVoxel: this.canPlaceVoxel(ghostVoxel) ? ghostVoxel : null,
      };
    }

    if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
      const ghostVoxel = this.worldToGroundVoxel(intersectionPoint);
      return {
        voxel: null,
        ghostVoxel: this.canPlaceVoxel(ghostVoxel) ? ghostVoxel : null,
      };
    }

    return null;
  }

  updateHoverMeshes() {
    if (!this.three) return;

    const { hoverMesh, ghostMesh } = this.three;
    hoverMesh.visible = Boolean(this.hoveredVoxel);
    if (this.hoveredVoxel) {
      hoverMesh.position.set(...this.voxelToWorld(this.hoveredVoxel));
    }

    ghostMesh.visible = Boolean(this.ghostVoxel && this.currentTool === "add");
    if (this.ghostVoxel) {
      ghostMesh.position.set(...this.voxelToWorld(this.ghostVoxel));
      ghostMesh.material.color.copy(this.getPreviewColor(this.selectedColor.hex));
    }
  }

  clearHover() {
    if (this.isOrbiting) return;
    this.hoveredVoxel = null;
    this.ghostVoxel = null;
    this.updateHoverMeshes();
    this.requestRender();
  }

  addGhostVoxel() {
    if (!this.ghostVoxel) return false;

    const snapshot = this.snapshot();
    const added = setVoxel(this.model, createVoxel({
      ...this.ghostVoxel,
      color: this.selectedColor,
    }));
    if (!added) return false;

    this.commitSnapshot(snapshot);
    this.ghostVoxel = null;
    this.updateSceneFromModel();
    this.updateStatus();
    return true;
  }

  eraseHoveredVoxel() {
    if (!this.hoveredVoxel) return false;

    const snapshot = this.snapshot();
    const deleted = deleteVoxel(this.model, this.hoveredVoxel);
    if (!deleted) return false;

    this.commitSnapshot(snapshot);
    this.hoveredVoxel = null;
    this.ghostVoxel = null;
    this.updateSceneFromModel();
    this.updateStatus();
    return true;
  }

  paintHoveredVoxel() {
    if (!this.hoveredVoxel) return false;

    const existing = getVoxel(this.model, this.hoveredVoxel);
    if (!existing || existing.color.id === this.selectedColor.id) return false;

    const snapshot = this.snapshot();
    setVoxel(this.model, createVoxel({
      ...existing,
      color: this.selectedColor,
    }));
    this.commitSnapshot(snapshot);
    this.updateSceneFromModel();
    this.updateStatus();
    return true;
  }

  pickHoveredColor() {
    const voxel = this.hoveredVoxel ? getVoxel(this.model, this.hoveredVoxel) : null;
    if (!voxel) return false;

    this.selectColor(voxel.color);
    if (this.currentTool === "pick") {
      this.setTool("paint");
    }
    return true;
  }

  resizeModelFromInputs() {
    const nextSize = {
      x: normalizeVoxelDimension(this.elements.sizeXInput?.value, this.model.size.x),
      y: normalizeVoxelDimension(this.elements.sizeYInput?.value, this.model.size.y),
      z: normalizeVoxelDimension(this.elements.sizeZInput?.value, this.model.size.z),
    };

    if (
      nextSize.x === this.model.size.x &&
      nextSize.y === this.model.size.y &&
      nextSize.z === this.model.size.z
    ) {
      return false;
    }

    const snapshot = this.snapshot();
    this.model = resizeVoxelModel(this.model, nextSize);
    this.commitSnapshot(snapshot);
    this.syncSizeInputs();
    this.fitCameraToModel();
    this.updateSceneFromModel();
    this.updateStatus();
    return true;
  }

  createNewModel() {
    const nextSize = {
      x: normalizeVoxelDimension(this.elements.sizeXInput?.value, this.model.size.x),
      y: normalizeVoxelDimension(this.elements.sizeYInput?.value, this.model.size.y),
      z: normalizeVoxelDimension(this.elements.sizeZInput?.value, this.model.size.z),
    };
    const snapshot = this.snapshot();
    this.model = createEmptyVoxelModel(nextSize);
    this.commitSnapshot(snapshot);
    this.syncSizeInputs();
    this.clearHover();
    this.fitCameraToModel();
    this.updateSceneFromModel();
    this.updateStatus();
    this.setImportStatus("Created an empty voxel model.");
  }

  async importVoxFromFile() {
    const file = this.elements.fileInput?.files?.[0];
    if (!file) {
      this.setImportStatus("Choose a .vox file first.", true);
      return false;
    }

    if (!file.name.toLowerCase().endsWith(".vox")) {
      this.setImportStatus("The selected file must use the .vox extension.", true);
      return false;
    }

    try {
      this.setImportStatus("Importing VOX file...");
      const parsedModel = parseVoxFile(await file.arrayBuffer());
      const snapshot = this.snapshot();
      const importedModel = createVoxelModelFromParsedVox(parsedModel, {
        preserveShading: Boolean(this.elements.preserveShading?.checked),
      });
      const importedVoxels = getVoxelArray(importedModel);
      const shouldRemoveHidden = Boolean(this.elements.removeHidden?.checked);
      const visibleVoxels = shouldRemoveHidden
        ? removeHiddenVoxelsFromList(importedVoxels, importedModel.size)
        : importedVoxels;
      const removedHiddenCount = importedVoxels.length - visibleVoxels.length;
      this.model = shouldRemoveHidden
        ? this.createModelFromVoxels(importedModel.size, visibleVoxels)
        : importedModel;
      this.commitSnapshot(snapshot);
      this.syncSizeInputs();
      this.clearHover();
      this.fitCameraToModel();
      this.updateSceneFromModel();
      this.updateStatus();

      const paletteMessage = parsedModel.hasCustomPalette ? "with embedded palette" : "with default palette";
      const hiddenMessage = removedHiddenCount > 0
        ? ` Removed ${removedHiddenCount} hidden interior voxel${removedHiddenCount === 1 ? "" : "s"}.`
        : "";
      this.setImportStatus(`Imported ${parsedModel.size.x} x ${parsedModel.size.y} x ${parsedModel.size.z}, ${parsedModel.voxels.length} voxels ${paletteMessage}.${hiddenMessage}`);
      this.elements.fileInput.value = "";
      return true;
    } catch (error) {
      this.setImportStatus(`Import failed: ${error.message}`, true);
      return false;
    }
  }

  clearHiddenInteriorVoxels() {
    const currentVoxels = getVoxelArray(this.model);
    if (currentVoxels.length < 1) {
      this.setImportStatus("No voxels to optimize.");
      return false;
    }

    const visibleVoxels = removeHiddenVoxelsFromList(currentVoxels, this.model.size);
    const removedCount = currentVoxels.length - visibleVoxels.length;
    if (removedCount < 1) {
      this.setImportStatus("No hidden interior voxels found.");
      return false;
    }

    const snapshot = this.snapshot();
    const nextModel = createEmptyVoxelModel(this.model.size);
    visibleVoxels.forEach((voxel) => {
      setVoxel(nextModel, createVoxel(voxel));
    });

    this.model = nextModel;
    this.commitSnapshot(snapshot);
    this.clearHover();
    this.updateSceneFromModel();
    this.updateStatus();
    this.setImportStatus(`Removed ${removedCount} hidden interior voxel${removedCount === 1 ? "" : "s"}.`);
    return true;
  }

  createModelFromVoxels(size, voxels) {
    const model = createEmptyVoxelModel(size);
    voxels.forEach((voxel) => {
      setVoxel(model, createVoxel(voxel));
    });
    return model;
  }

  clearModel() {
    const voxelCount = countVoxels(this.model);
    if (voxelCount < 1) {
      this.setImportStatus("Model is already clear.");
      return false;
    }

    const snapshot = this.snapshot();
    this.model = createEmptyVoxelModel(this.model.size);
    this.commitSnapshot(snapshot);
    this.clearHover();
    this.updateSceneFromModel();
    this.updateStatus();
    this.setImportStatus(`Cleared ${voxelCount} voxel${voxelCount === 1 ? "" : "s"}.`);
    return true;
  }

  applyGradientFill() {
    const voxels = getVoxelArray(this.model);
    if (voxels.length < 1) {
      this.setImportStatus("No voxels to gradient.");
      return false;
    }

    const result = mapGradientToVoxels(voxels, {
      startColor: this.getPaletteColorById(this.elements.gradientStart?.value),
      endColor: this.getPaletteColorById(this.elements.gradientEnd?.value),
      yawDegrees: parseGradientAngle(this.elements.gradientYaw?.value, 0),
      pitchDegrees: parseGradientAngle(this.elements.gradientPitch?.value, 0),
      palette: PIXEL_ART_COLORS,
    });
    if (!result.changed) return false;

    const snapshot = this.snapshot();
    const nextModel = createEmptyVoxelModel(this.model.size);
    result.voxels.forEach((voxel) => {
      setVoxel(nextModel, createVoxel(voxel));
    });

    this.model = nextModel;
    this.commitSnapshot(snapshot);
    this.clearHover();
    this.updateSceneFromModel();
    this.updateStatus();
    this.setImportStatus(`Applied gradient to ${result.filledCount} voxel${result.filledCount === 1 ? "" : "s"}.`);
    return true;
  }

  downloadDesign() {
    if (countVoxels(this.model) < 1) {
      alert("Add at least one voxel before downloading.");
      return false;
    }

    const furniture = this.getSelectedFurniture();
    if (!furniture) return false;

    try {
      const exportModel = voxelModelToExportModel(this.model);
      const designName = this.elements.designNameInput?.value || "Voxel Art";
      const design = createVoxelArtDesign({
        model: exportModel,
        furniture,
        designName,
        removeHiddenVoxels: Boolean(this.elements.removeHidden?.checked),
        rotateClosestToEdge: Boolean(this.elements.rotateClosestToEdge?.checked),
      });

      const blob = new Blob([JSON.stringify(design, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${this.slugify(design.name)}_${this.model.size.x}x${this.model.size.y}x${this.model.size.z}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      alert(`Voxel Art download failed: ${error.message}`);
      return false;
    }
  }

  undo() {
    if (this.undoStack.length === 0) return;

    this.redoStack.push(this.snapshot());
    this.model = this.undoStack.pop();
    this.syncSizeInputs();
    this.clearHover();
    this.updateSceneFromModel();
    this.updateStatus();
  }

  redo() {
    if (this.redoStack.length === 0) return;

    this.undoStack.push(this.snapshot());
    this.model = this.redoStack.pop();
    this.syncSizeInputs();
    this.clearHover();
    this.updateSceneFromModel();
    this.updateStatus();
  }

  snapshot() {
    const model = createEmptyVoxelModel(this.model.size);
    this.model.voxels.forEach((voxel) => {
      model.voxels.set(`${voxel.x},${voxel.y},${voxel.z}`, createVoxel(voxel));
    });
    return model;
  }

  commitSnapshot(snapshot) {
    this.undoStack.push(snapshot);
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  setTool(tool) {
    if (!TOOL_IDS.includes(tool)) return;

    this.currentTool = tool;
    this.elements.toolButtons.forEach((button) => {
      const isActive = button.dataset.voxelTool === tool;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    this.updateHoverMeshes();
    this.requestRender();
  }

  selectColor(color) {
    this.selectedColor = color;
    this.updateColorPreview();
    this.updatePaletteSelection();
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

  updateCustomFurnitureVisibility() {
    if (!this.elements.customFurnitureInputs || !this.elements.furnitureSelect) return;

    const isCustom = this.elements.furnitureSelect.value === CUSTOM_VOXEL_FURNITURE_ID;
    this.elements.customFurnitureInputs.style.display = isCustom ? "flex" : "none";
  }

  updateRotationVisibility() {
    if (!this.elements.rotateRow || !this.elements.furnitureSelect) return;

    const furnitureId = this.elements.furnitureSelect.value;
    const selectedFurniture = VOXEL_ART_FURNITURE.find((furniture) => furniture.id === furnitureId);
    const canRotate = furnitureId === CUSTOM_VOXEL_FURNITURE_ID || Boolean(selectedFurniture?.supportsEdgeRotation);

    this.elements.rotateRow.style.display = canRotate ? "inline-flex" : "none";
    if (!canRotate && this.elements.rotateClosestToEdge) {
      this.elements.rotateClosestToEdge.checked = false;
    }
  }

  getSelectedFurniture() {
    const furnitureId = this.elements.furnitureSelect?.value;
    if (furnitureId !== CUSTOM_VOXEL_FURNITURE_ID) {
      return VOXEL_ART_FURNITURE.find((furniture) => furniture.id === furnitureId) || VOXEL_ART_FURNITURE[0];
    }

    const itemId = Number(this.elements.customItemId?.value);
    const name = this.elements.customItemName?.value.trim() || "";
    const layoutXSpacing = Number(this.elements.customXSpacing?.value);
    const layoutDepthSpacing = Number(this.elements.customDepthSpacing?.value);
    const layoutHeightSpacing = Number(this.elements.customHeightSpacing?.value);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      alert("Custom furniture item ID must be a positive whole number.");
      return null;
    }

    if (!name) {
      alert("Custom furniture name is required.");
      return null;
    }

    if (!this.isPositiveFiniteNumber(layoutXSpacing)) {
      alert("Custom furniture X step must be a positive number.");
      return null;
    }

    if (!this.isPositiveFiniteNumber(layoutDepthSpacing)) {
      alert("Custom furniture depth step must be a positive number.");
      return null;
    }

    if (!this.isPositiveFiniteNumber(layoutHeightSpacing)) {
      alert("Custom furniture height step must be a positive number.");
      return null;
    }

    return createVoxelArtFurniture({
      id: CUSTOM_VOXEL_FURNITURE_ID,
      name,
      itemId,
      layoutXSpacing,
      layoutDepthSpacing,
      layoutHeightSpacing,
      supportsEdgeRotation: true,
    });
  }

  updateStatus() {
    if (!this.elements.status) return;

    const exportModel = voxelModelToExportModel(this.model);
    let exportedVoxelCount = countVoxels(this.model);
    let skippedHiddenVoxelCount = 0;
    try {
      const summary = summarizeVoxelExport(exportModel, {
        removeHiddenVoxels: Boolean(this.elements.removeHidden?.checked),
      });
      exportedVoxelCount = summary.exportedVoxelCount;
      skippedHiddenVoxelCount = summary.skippedHiddenVoxelCount;
    } catch {
      // Status should not block editing if an export-only validation changes later.
    }

    const totalVoxels = countVoxels(this.model);
    this.elements.status.textContent =
      `${this.model.size.x} x ${this.model.size.y} x ${this.model.size.z} model, ` +
      `${totalVoxels} voxel${totalVoxels === 1 ? "" : "s"}, ` +
      `${exportedVoxelCount} exported, ${skippedHiddenVoxelCount} hidden skipped`;

    if (this.elements.undoBtn) {
      this.elements.undoBtn.disabled = this.undoStack.length === 0;
    }
    if (this.elements.redoBtn) {
      this.elements.redoBtn.disabled = this.redoStack.length === 0;
    }
  }

  syncSizeInputs() {
    if (this.elements.sizeXInput) this.elements.sizeXInput.value = String(this.model.size.x);
    if (this.elements.sizeYInput) this.elements.sizeYInput.value = String(this.model.size.y);
    if (this.elements.sizeZInput) this.elements.sizeZInput.value = String(this.model.size.z);
  }

  fitCameraToModel() {
    const largest = Math.max(this.model.size.x, this.model.size.y, this.model.size.z);
    this.cameraState.distance = Math.min(CAMERA_MAX_DISTANCE, Math.max(CAMERA_MIN_DISTANCE, largest * 2.3));
    this.updateCamera();
  }

  updateCamera() {
    if (!this.three) return;

    const { camera } = this.three;
    const { yaw, pitch, distance } = this.cameraState;
    camera.position.set(
      Math.sin(yaw) * Math.cos(pitch) * distance,
      Math.sin(pitch) * distance,
      Math.cos(yaw) * Math.cos(pitch) * distance
    );
    camera.lookAt(0, 0, 0);
    this.requestRender();
  }

  resizeRenderer() {
    if (!this.three || !this.elements.viewport) return;

    const { renderer, camera } = this.three;
    const bounds = this.elements.viewport.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) return;

    renderer.setSize(bounds.width, bounds.height, false);
    camera.aspect = bounds.width / bounds.height;
    camera.updateProjectionMatrix();
  }

  requestRender() {
    if (!this.three || this.renderQueued) return;

    this.renderQueued = true;
    requestAnimationFrame(() => {
      this.renderQueued = false;
      if (!this.three) return;
      this.three.renderer.render(this.three.scene, this.three.camera);
    });
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
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (key === "t") {
      this.setTool("add");
    } else if (key === "r") {
      this.setTool("erase");
    } else if (key === "g") {
      this.setTool("paint");
    }
  }

  canPlaceVoxel(voxel) {
    return (
      voxel &&
      Number.isInteger(voxel.x) &&
      Number.isInteger(voxel.y) &&
      Number.isInteger(voxel.z) &&
      voxel.x >= 0 &&
      voxel.y >= 0 &&
      voxel.z >= 0 &&
      voxel.x < this.model.size.x &&
      voxel.y < this.model.size.y &&
      voxel.z < this.model.size.z &&
      !getVoxel(this.model, voxel)
    );
  }

  voxelToWorld(voxel) {
    return [
      voxel.x - (this.model.size.x - 1) / 2,
      voxel.z - (this.model.size.z - 1) / 2,
      voxel.y - (this.model.size.y - 1) / 2,
    ];
  }

  worldToGroundVoxel(point) {
    return {
      x: Math.floor(point.x + this.model.size.x / 2),
      y: Math.floor(point.z + this.model.size.y / 2),
      z: 0,
    };
  }

  faceNormalToVoxelDelta(normal) {
    return {
      x: Math.round(normal.x),
      y: Math.round(normal.z),
      z: Math.round(normal.y),
    };
  }

  setImportStatus(message, isError = false) {
    if (!this.elements.importStatus) return;

    this.elements.importStatus.textContent = message;
    this.elements.importStatus.classList.toggle("error", isError);
  }

  isTypingTarget(target) {
    if (!target) return false;
    return ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
  }

  isPositiveFiniteNumber(value) {
    return Number.isFinite(value) && value > 0;
  }

  getPaletteColorById(colorId) {
    return PIXEL_ART_COLORS.find((color) => color.id === colorId) || PIXEL_ART_COLORS[0];
  }

  toCssColor(hex) {
    return `#${hex.slice(0, 6)}`;
  }

  getPreviewColor(hex) {
    const color = new this.three.THREE.Color(this.toCssColor(hex));
    if (typeof color.convertSRGBToLinear === "function") {
      color.convertSRGBToLinear();
    }
    return color;
  }

  slugify(value) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "voxel-art";
  }
}
