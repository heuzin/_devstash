export type UploadKind = "image" | "file";

interface UploadConstraint {
  maxSizeBytes: number;
  extensionMimeTypes: Record<string, string[]>;
}

export const UPLOAD_CONSTRAINTS: Record<UploadKind, UploadConstraint> = {
  image: {
    maxSizeBytes: 5 * 1024 * 1024,
    extensionMimeTypes: {
      ".png": ["image/png"],
      ".jpg": ["image/jpeg"],
      ".jpeg": ["image/jpeg"],
      ".gif": ["image/gif"],
      ".webp": ["image/webp"],
      ".svg": ["image/svg+xml"],
    },
  },
  file: {
    maxSizeBytes: 10 * 1024 * 1024,
    extensionMimeTypes: {
      ".pdf": ["application/pdf"],
      ".txt": ["text/plain"],
      ".md": ["text/markdown", "text/plain"],
      ".json": ["application/json"],
      ".yaml": ["application/x-yaml", "text/yaml"],
      ".yml": ["application/x-yaml", "text/yaml"],
      ".xml": ["application/xml", "text/xml"],
      ".csv": ["text/csv"],
      ".toml": ["application/toml"],
      ".ini": ["text/plain"],
    },
  },
};

function getExtension(fileName: string): string {
  const match = /\.[^./\\]+$/.exec(fileName);
  return match ? match[0].toLowerCase() : "";
}

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
  contentType?: string;
}

const GENERIC_MIME_TYPES = new Set(["", "application/octet-stream"]);

export function validateUpload(kind: UploadKind, fileName: string, size: number, mimeType: string): UploadValidationResult {
  const constraint = UPLOAD_CONSTRAINTS[kind];

  if (size > constraint.maxSizeBytes) {
    const maxMb = constraint.maxSizeBytes / (1024 * 1024);
    return { valid: false, error: `File exceeds the ${maxMb}MB limit` };
  }

  const extension = getExtension(fileName);
  const expectedMimeTypes = constraint.extensionMimeTypes[extension];
  if (!expectedMimeTypes) {
    return { valid: false, error: "Unsupported file type" };
  }

  if (!GENERIC_MIME_TYPES.has(mimeType) && !expectedMimeTypes.includes(mimeType)) {
    return { valid: false, error: "File content doesn't match its extension" };
  }

  return { valid: true, contentType: expectedMimeTypes[0] };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
