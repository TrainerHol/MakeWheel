import {
  convertMakePlaceDesign,
  detectMakePlaceDesignKind,
  summarizeConvertedDesign,
} from "../utils/customDesignConverter.js";
import { validateJsonFile } from "../utils/validators.js";

export class CustomDesignConverterEditor {
  constructor() {
    this.active = false;
    this.originalFileName = "";
    this.conversion = null;
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
      this.updateStatus();
    }
  }

  cacheElements() {
    this.elements = {
      root: document.getElementById("customDesignConverterInputs"),
      fileInput: document.getElementById("customDesignConverterFileInput"),
      importBtn: document.getElementById("customDesignConverterImportBtn"),
      downloadBtn: document.getElementById("customDesignConverterDownloadBtn"),
      status: document.getElementById("customDesignConverterStatus"),
      importStatus: document.getElementById("customDesignConverterImportStatus"),
    };
  }

  bindEvents() {
    this.elements.importBtn?.addEventListener("click", () => {
      this.importJsonFromFile();
    });

    this.elements.fileInput?.addEventListener("change", () => {
      if (this.elements.fileInput.files?.[0]) {
        this.importJsonFromFile();
      } else {
        this.setImportStatus("");
      }
    });

    this.elements.downloadBtn?.addEventListener("click", () => {
      this.downloadConvertedDesign();
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
      const summary = summarizeConvertedDesign(json);
      const conversion = convertMakePlaceDesign(json);

      this.originalFileName = file.name;
      this.conversion = {
        ...conversion,
        sourceKind: kind,
        summary,
      };
      this.updateStatus();
      this.setImportStatus(this.formatImportSummary(summary));
      this.elements.fileInput.value = "";
      return true;
    } catch (error) {
      this.originalFileName = "";
      this.conversion = null;
      this.updateStatus();
      this.setImportStatus(`Import failed: ${error.message}`, true);
      return false;
    }
  }

  downloadConvertedDesign() {
    if (!this.conversion) {
      alert("Import a MakePlace JSON file first.");
      return false;
    }

    const blob = new Blob([JSON.stringify(this.conversion.converted, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = this.getDownloadFileName();
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  }

  updateStatus() {
    if (!this.elements.status) return;

    if (!this.conversion) {
      this.elements.status.textContent = "No file imported.";
      if (this.elements.downloadBtn) {
        this.elements.downloadBtn.disabled = true;
      }
      return;
    }

    const summary = this.conversion.summary;
    this.elements.status.textContent =
      `${summary.directionLabel}: ${summary.itemCount} item${summary.itemCount === 1 ? "" : "s"}, ` +
      `${summary.rootCount} root${summary.rootCount === 1 ? "" : "s"}`;
    if (this.elements.downloadBtn) {
      this.elements.downloadBtn.disabled = false;
    }
  }

  formatImportSummary(summary) {
    const sourceLabel = this.formatKind(summary.sourceKind);
    const targetLabel = this.formatKind(summary.targetKind);
    return `Detected ${sourceLabel}. Will convert to ${targetLabel} using ${summary.sourceArea}; ${summary.itemCount} item${summary.itemCount === 1 ? "" : "s"}.`;
  }

  setImportStatus(message, isError = false) {
    if (!this.elements.importStatus) return;

    this.elements.importStatus.textContent = message;
    this.elements.importStatus.classList.toggle("error", isError);
  }

  getDownloadFileName() {
    const baseName = this.stripJsonExtension(this.originalFileName || "design");
    const suffix = this.conversion?.targetKind === "layout" ? "layout" : "custom-design";
    return `${baseName}_${suffix}.json`;
  }

  stripJsonExtension(fileName) {
    return fileName.replace(/\.json$/i, "") || "design";
  }

  formatKind(kind) {
    return kind === "custom-design" ? "custom design" : "layout";
  }
}
