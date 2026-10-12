import { describe, expect, it } from "vitest";
import { FILE_EXTENSION_ICONS, getFileExtension } from "./file-extension-icons";
import { UPLOAD_CONSTRAINTS } from "./upload-constraints";

describe("getFileExtension", () => {
  it("returns an empty string for null or extensionless file names", () => {
    expect(getFileExtension(null)).toBe("");
    expect(getFileExtension("README")).toBe("");
  });

  it("extracts and lowercases the extension", () => {
    expect(getFileExtension("notes.md")).toBe(".md");
    expect(getFileExtension("ARCHIVE.CSV")).toBe(".csv");
  });

  it("uses the last extension for multi-dot file names", () => {
    expect(getFileExtension("backup.tar.gz")).toBe(".gz");
  });

  it("ignores directory separators when locating the extension", () => {
    expect(getFileExtension("folder.old/resume.pdf")).toBe(".pdf");
  });
});

describe("FILE_EXTENSION_ICONS", () => {
  it("has an icon for every extension the file upload type accepts", () => {
    const acceptedExtensions = Object.keys(UPLOAD_CONSTRAINTS.file.extensionMimeTypes);
    for (const extension of acceptedExtensions) {
      expect(FILE_EXTENSION_ICONS[extension]).toBeDefined();
    }
  });
});
