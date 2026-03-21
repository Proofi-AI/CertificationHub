"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, FileText, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface UploadedFile {
  fileUrl: string;
  filePath: string;
  fileHash: string;
  fileName: string;
  fileMimeType: string;
  fileSizeBytes: number;
}

interface FileUploadZoneProps {
  onUpload: (file: UploadedFile) => void;
  onDuplicate: (duplicateId: string, duplicateName: string) => void;
  onClear: () => void;
  uploadedFile: UploadedFile | null;
}

export function FileUploadZone({ onUpload, onDuplicate, onClear, uploadedFile }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (res.status === 409) {
          onDuplicate(data.duplicateId, data.duplicateName);
        } else if (!res.ok) {
          setError(data.error ?? "Upload failed");
        } else {
          onUpload(data as UploadedFile);
        }
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, onDuplicate]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (uploadedFile) {
    const isPdf = uploadedFile.fileMimeType === "application/pdf";
    const sizeKB = Math.round(uploadedFile.fileSizeBytes / 1024);

    return (
      <div className="flex items-center justify-between rounded-lg border bg-blue-50 px-4 py-3">
        <div className="flex items-center gap-3">
          {isPdf ? (
            <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
          ) : (
            <Image className="h-8 w-8 text-blue-600 flex-shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">{uploadedFile.fileName}</p>
            <p className="text-xs text-gray-500">{sizeKB} KB</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-10 transition-colors",
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <>
            <Upload className="mb-3 h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">Drop your file here, or click to browse</p>
            <p className="mt-1 text-xs text-gray-500">PDF, JPG, PNG up to 25 MB</p>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
