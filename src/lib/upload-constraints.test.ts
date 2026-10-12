import { describe, expect, it } from "vitest";
import { formatFileSize, validateUpload } from "./upload-constraints";

describe("validateUpload", () => {
  it("accepts a valid image within the size limit", () => {
    const result = validateUpload("image", "photo.png", 1024, "image/png");
    expect(result).toEqual({ valid: true, contentType: "image/png" });
  });

  it("accepts a valid file within the size limit", () => {
    const result = validateUpload("file", "notes.md", 1024, "text/markdown");
    expect(result).toEqual({ valid: true, contentType: "text/markdown" });
  });

  it("rejects an image over the 5MB limit", () => {
    const result = validateUpload("image", "photo.png", 6 * 1024 * 1024, "image/png");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/5MB/);
  });

  it("rejects a file over the 10MB limit", () => {
    const result = validateUpload("file", "doc.pdf", 11 * 1024 * 1024, "application/pdf");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/10MB/);
  });

  it("rejects an unsupported extension", () => {
    const result = validateUpload("file", "script.exe", 1024, "application/octet-stream");
    expect(result).toEqual({ valid: false, error: "Unsupported file type" });
  });

  it("rejects a mime type that doesn't match the extension", () => {
    const result = validateUpload("image", "photo.png", 1024, "application/pdf");
    expect(result).toEqual({ valid: false, error: "File content doesn't match its extension" });
  });

  it("accepts a generic/empty mime type when the extension is known", () => {
    const result = validateUpload("file", "config.ini", 1024, "");
    expect(result).toEqual({ valid: true, contentType: "text/plain" });
  });

  it("accepts either yaml mime type for .yml", () => {
    expect(validateUpload("file", "config.yml", 1024, "text/yaml").valid).toBe(true);
    expect(validateUpload("file", "config.yml", 1024, "application/x-yaml").valid).toBe(true);
  });
});

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(512)).toBe("512 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(2048)).toBe("2.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
