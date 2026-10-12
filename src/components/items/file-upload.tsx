"use client";

import { useRef, useState } from "react";
import { File as FileIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UPLOAD_CONSTRAINTS, formatFileSize, type UploadKind } from "@/lib/upload-constraints";

export interface UploadedFile {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

interface FileUploadProps {
  kind: UploadKind;
  value: UploadedFile | null;
  onChange: (value: UploadedFile | null) => void;
}

function uploadWithProgress(file: File, kind: UploadKind, onProgress: (percent: number) => void) {
  return new Promise<UploadedFile>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error ?? "Upload failed"));
        }
      } catch {
        reject(new Error("Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));

    xhr.send(formData);
  });
}

export function FileUpload({ kind, value, onChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const constraint = UPLOAD_CONSTRAINTS[kind];
  const acceptedExtensions = Object.keys(constraint.extensionMimeTypes);

  async function handleFile(file: File) {
    setIsUploading(true);
    setProgress(0);
    try {
      const uploaded = await uploadWithProgress(file, kind, setProgress);
      onChange(uploaded);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove() {
    if (value) {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: value.fileUrl }),
      }).catch(() => {});
    }
    onChange(null);
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border p-3">
        {kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.fileUrl}
            alt={value.fileName}
            className="size-12 shrink-0 rounded object-cover"
          />
        ) : (
          <FileIcon className="size-8 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{value.fileName}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(value.fileSize)}</p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={handleRemove} aria-label="Remove file">
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragging ? "border-primary bg-accent/50" : "border-border"
        }`}
      >
        <Upload className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag and drop or <span className="text-primary">browse</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {acceptedExtensions.join(", ")} up to {formatFileSize(constraint.maxSizeBytes)}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedExtensions.join(",")}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void handleFile(file);
          }}
        />
      </div>
      {isUploading && (
        <div className="mt-2 space-y-1">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">Uploading... {progress}%</p>
        </div>
      )}
    </div>
  );
}
