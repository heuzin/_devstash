import { FileCode, FileCog, FileJson, FileSpreadsheet, FileText, type LucideIcon } from "lucide-react";

export const FILE_EXTENSION_ICONS: Record<string, LucideIcon> = {
  ".pdf": FileText,
  ".txt": FileText,
  ".md": FileText,
  ".json": FileJson,
  ".yaml": FileCode,
  ".yml": FileCode,
  ".xml": FileCode,
  ".csv": FileSpreadsheet,
  ".toml": FileCog,
  ".ini": FileCog,
};

export function getFileExtension(fileName: string | null): string {
  if (!fileName) return "";
  const match = /\.[^./\\]+$/.exec(fileName);
  return match ? match[0].toLowerCase() : "";
}
